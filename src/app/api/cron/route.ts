
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { Organization, Trigger, ExecutionLog, Schedule } from '@/lib/types';
import axios from 'axios';
import { add } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { calculateMinNextRun } from '@/lib/trigger-utils';
import { PLAN_LIMITS } from '@/lib/constants';

// Force dynamic to prevent caching of the cron job
export const dynamic = 'force-dynamic';

const calculateNextRun = (schedule: Schedule, timezone: string, lastScheduledRun?: string): Date => {
    const now = new Date();
    // If we have a last scheduled run, use that as the base. Otherwise, use now.
    // Ideally, we should align to the schedule (e.g., if every 5 mins, align to :00, :05, etc.)
    // For now, we'll just add the interval to the last run or now.

    let baseTime = lastScheduledRun ? new Date(lastScheduledRun) : now;

    // If the last run is in the future (shouldn't happen for a due trigger), use it.
    // If it's in the past, we want to calculate the next slot from IT, but ensure the result is in the future.

    // Convert baseTime to the organization's timezone to perform calendar math
    const zonedBaseTime = toZonedTime(baseTime, timezone);
    let nextRunInTimezone: Date;

    if (schedule.type === 'one-time') {
        // One-time triggers shouldn't be rescheduled via this function usually, 
        // but if they are, we might want to return a far-future date or handle it upstream.
        // For safety, return a date far in the future.
        return new Date('9999-12-31T23:59:59Z');
    }

    if (!schedule.amount || !schedule.unit) {
        console.error(`[CRON-ERROR] Invalid interval schedule object for calculation:`, schedule);
        // Return a far-future date to prevent re-running an invalid trigger
        return new Date('9999-12-31T23:59:59Z');
    }

    const unit = schedule.unit as "seconds" | "minutes" | "hours" | "days" | "weeks" | "months" | "years";
    // Add the interval to the last scheduled run time.
    nextRunInTimezone = add(zonedBaseTime, { [unit]: schedule.amount });

    // Convert the calculated time back to a standard Date object (in UTC).
    let futureRun = fromZonedTime(nextRunInTimezone, timezone);

    // If, for some reason, the calculated next run is still in the past (e.g., cron was down),
    // keep adding the interval until the next run time is in the future.
    while (futureRun < now && schedule.type === 'interval') {
        const unit = schedule.unit as "seconds" | "minutes" | "hours" | "days" | "weeks" | "months" | "years";
        const nextZoned = add(toZonedTime(futureRun, timezone), { [unit]: schedule.amount });
        futureRun = fromZonedTime(nextZoned, timezone);
    }
    console.log(`[CRON] Calculated next run: ${futureRun.toISOString()}`);
    return futureRun;
};



type TriggerResult = {
    triggerId: string;
    folderId: string | null;
    status: 'active' | 'completed' | 'failed' | 'archived';
    nextRun: string;
    runCount: number;
    newLog: ExecutionLog;
};

const executeTrigger = async (
    trigger: Trigger,
    folderId: string | null,
    organizationTimezone: string
): Promise<TriggerResult> => {
    console.log(`[CRON] Processing trigger "${trigger.name}" (ID: ${trigger.id})`);

    const now = new Date();
    const logEntry: Omit<ExecutionLog, 'id'> = {
        timestamp: now.toISOString(),
        status: 'failed',
        requestPayload: trigger.payload,
        triggerMode: 'production',
    };

    let status: 'active' | 'completed' | 'failed' | 'archived' = 'active';

    try {
        const response = await axios({
            method: trigger.method,
            url: trigger.url,
            data: trigger.payload,
            headers: {
                'Content-Type': 'application/json',
                'X-Trigger-Mode': 'production'
            },
            timeout: trigger.timeout || 5000,
        });

        console.log(`[CRON] Trigger "${trigger.name}" executed successfully with status ${response.status}.`);
        logEntry.status = 'success';
        logEntry.responseStatus = response.status;
        logEntry.responseBody = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        status = 'active';

    } catch (error: any) {
        console.error(`[CRON-ERROR] Failed to execute trigger "${trigger.name}" (ID: ${trigger.id}):`, error.message);
        status = 'active'; // Keep active to retry or continue schedule

        logEntry.error = error.message;
        if (error.response) {
            logEntry.responseStatus = error.response.status;
            logEntry.responseBody = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data);
        }
    }

    const newLog: ExecutionLog = {
        ...logEntry,
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    const currentRunCount = trigger.runCount || 0;
    const newRunCount = currentRunCount + 1;

    let isCompleted = false;
    if (trigger.limit && newRunCount >= trigger.limit) {
        status = trigger.archiveOnComplete ? 'archived' : 'completed';
        isCompleted = true;
    }

    if (trigger.schedule.type === 'one-time') {
        if (logEntry.status === 'success') {
            status = trigger.archiveOnComplete ? 'archived' : 'completed';
        } else {
            status = 'failed';
        }
        isCompleted = true;
    }

    let nextRun: string;
    if (isCompleted) {
        nextRun = new Date('9999-12-31T23:59:59Z').toISOString();
    } else {
        const nextRunDate = calculateNextRun(trigger.schedule, organizationTimezone, trigger.nextRun);
        nextRun = nextRunDate.toISOString();
    }

    return {
        triggerId: trigger.id,
        folderId,
        status,
        nextRun,
        runCount: newRunCount,
        newLog
    };
};

export async function GET() {
    const logs: string[] = [];
    const log = (msg: string) => {
        console.log(msg);
        logs.push(msg);
    };

    log(`[CRON] Job started at ${new Date().toISOString()}`);

    try {
        const now = new Date();
        const nowIso = now.toISOString();
        const organizationsSnapshot = await db.collection('organizations').get();
        log(`[CRON] Found ${organizationsSnapshot.docs.length} organizations to process.`);

        let totalDueTriggers = 0;

        for (const orgDoc of organizationsSnapshot.docs) {
            const organization = orgDoc.data() as Organization;
            const orgId = orgDoc.id;
            const organizationTimezone = organization.timezone || 'UTC';
            const planId = organization.planId || 'free';
            const limits = PLAN_LIMITS[planId];

            // --- Migration Start ---
            const batch = db.batch(); // Use batch for migration
            let migrationNeeded = false;

            // Migrate top-level legacy triggers
            if (organization.triggers && organization.triggers.length > 0) {
                log(`[CRON-MIGRATION] Migrating ${organization.triggers.length} legacy top-level triggers for Org ${orgId}`);
                organization.triggers.forEach(t => {
                    const newRef = db.collection('organizations').doc(orgId).collection('triggers').doc(t.id);
                    batch.set(newRef, { ...t, orgId, folderId: null });
                });
                batch.update(orgDoc.ref, { triggers: [] });
                migrationNeeded = true;
            }

            // Migrate folder legacy triggers
            let foldersUpdated = false;
            const safeFolders = (organization.folders || []).map(f => {
                if (f.triggers && f.triggers.length > 0) {
                    log(`[CRON-MIGRATION] Migrating ${f.triggers.length} legacy triggers in folder ${f.id} for Org ${orgId}`);
                    f.triggers.forEach(t => {
                        const newRef = db.collection('organizations').doc(orgId).collection('triggers').doc(t.id);
                        batch.set(newRef, { ...t, orgId, folderId: f.id });
                    });
                    foldersUpdated = true;
                    return { ...f, triggers: [] };
                }
                return f;
            });

            if (foldersUpdated) {
                batch.update(orgDoc.ref, { folders: safeFolders });
                migrationNeeded = true;
            }

            if (migrationNeeded) {
                await batch.commit();
                log(`[CRON-MIGRATION] Migration completed for Org ${orgId}`);
            }
            // --- Migration End ---


            // Usage Tracking & Lazy Reset
            let usage = organization.usage || { executionsThisMonth: 0, billingCycleStart: nowIso, dailyExecutions: {} };
            const billingStart = new Date(usage.billingCycleStart);
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

            if (billingStart < oneMonthAgo) {
                // Reset usage if billing cycle is over
                usage = { executionsThisMonth: 0, billingCycleStart: nowIso, dailyExecutions: {} };
            }

            if (usage.executionsThisMonth >= limits.executionsPerMonth) {
                log(`[CRON] Organization ${orgId} (${planId}) reached monthly limit of ${limits.executionsPerMonth}. Skipping.`);
                continue;
            }

            // --- Fetch Active Triggers from Subcollection ---
            const triggersRef = db.collection('organizations').doc(orgId).collection('triggers');
            const activeTriggersSnapshot = await triggersRef.where('status', '==', 'active').get();
            let activeTriggers = activeTriggersSnapshot.docs.map(d => d.data() as Trigger);

            // --- Enforce Plan Limits (Pause Excess) ---
            const triggersToPause: Trigger[] = [];

            if (limits.triggers !== Infinity && activeTriggers.length > limits.triggers) {
                log(`[CRON] Organization ${orgId} exceeds trigger limit (${activeTriggers.length} > ${limits.triggers}). Pausing excess triggers.`);

                // Sort by nextRun (asc) to keep earliest ones
                activeTriggers.sort((a, b) => {
                    if (!a.nextRun) return 1;
                    if (!b.nextRun) return -1;
                    return new Date(a.nextRun).getTime() - new Date(b.nextRun).getTime();
                });

                // Identify triggers to pause (after the first N)
                const toKeep = activeTriggers.slice(0, limits.triggers);
                const toPauseList = activeTriggers.slice(limits.triggers);

                // Update lists
                activeTriggers = toKeep;

                // Pause them in DB immediately
                const pauseBatch = db.batch();
                for (const t of toPauseList) {
                    const tRef = triggersRef.doc(t.id);
                    pauseBatch.update(tRef, { status: 'paused' });
                    triggersToPause.push(t);
                }
                await pauseBatch.commit();
                log(`[CRON] Paused ${toPauseList.length} excess triggers.`);
            }

            if (triggersToPause.length > 0) {
                // triggersToPause are already handled above, we just logged them.
            }

            // --- Identify Due Triggers ---
            const dueTriggers = activeTriggers.filter(t => t.nextRun && new Date(t.nextRun) <= now);

            if (dueTriggers.length === 0) continue;

            totalDueTriggers += dueTriggers.length;
            log(`[CRON] Executing ${dueTriggers.length} triggers for Org ${orgId}...`);

            // --- Execute Triggers ---
            const results = await Promise.all(
                dueTriggers.map(t => executeTrigger(t, t.folderId || null, organizationTimezone))
            );

            // --- Update Execution Results in Subcollection and Org Usage ---
            const updateBatch = db.batch();
            let successCount = 0;

            for (const result of results) {
                const triggerRef = triggersRef.doc(result.triggerId);

                // We need to fetch current history to append properly if we want to be strict,
                // BUT for cron, we usually just overwrite/prepend since we are the authoritative runner.
                // However, subcollection makes this disconnected.
                // Let's rely on the fact that we have the 'newLog'. 
                // We need to fetch the specific trigger doc to append history safely?
                // Or just use arrayUnion? ArrayUnion puts it at the end. We want it at the start usually.
                // Firestore doesn't support arrayPrepend.
                // Reading every trigger doc again is expensive.
                // `executeTrigger` returned `newLog`.

                // Optimization: We already fetched `activeTriggers` above. We have the data in memory!
                const originalTrigger = activeTriggers.find(t => t.id === result.triggerId);
                const currentHistory = originalTrigger?.executionHistory || [];
                // Keep last 5 logs on the document for quick preview
                const newHistory = [result.newLog, ...currentHistory].slice(0, 5);

                // 1. Write full log to 'logs' subcollection
                const logRef = triggerRef.collection('logs').doc(result.newLog.id);
                updateBatch.set(logRef, result.newLog);

                // Lazy History Migration: If this is the first run after refactor, migrate old logs to subcollection
                if (!originalTrigger?.historyMigrated && currentHistory.length > 0) {
                    for (const log of currentHistory) {
                        const logId = log.id || `log-${new Date(log.timestamp).getTime()}-${Math.random().toString(36).substr(2, 5)}`;
                        const histLogRef = triggerRef.collection('logs').doc(logId);
                        updateBatch.set(histLogRef, { ...log, id: logId });
                    }
                }

                // 2. Update Trigger Doc with latest status and summary history
                updateBatch.update(triggerRef, {
                    status: result.status,
                    nextRun: result.nextRun,
                    runCount: result.runCount,
                    executionHistory: newHistory,
                    historyMigrated: true
                });

                successCount++;
            }

            // Update Org Usage
            const todayKey = now.toISOString().split('T')[0];
            const currentDaily = usage.dailyExecutions || {};
            const todayCount = (currentDaily[todayKey] || 0) + results.length;

            updateBatch.update(orgDoc.ref, {
                usage: {
                    ...usage,
                    executionsThisMonth: usage.executionsThisMonth + results.length,
                    dailyExecutions: {
                        ...currentDaily,
                        [todayKey]: todayCount
                    }
                },
                minNextRun: null // Deprecated/Recalculate or just leave null if we stop using it
            });

            await updateBatch.commit();
            log(`[CRON] Successfully executed and updated ${results.length} triggers for Org ${orgId}.`);
        }

        log(`[CRON] Job finished at ${new Date().toISOString()}`);
        return NextResponse.json({
            success: true,
            message: 'Cron job executed successfully.',
            stats: {
                organizations: organizationsSnapshot.docs.length,
                dueTriggers: totalDueTriggers,
                timestamp: nowIso
            },
            logs: logs
        });
    } catch (error) {
        console.error('[CRON-ERROR] Unhandled error in cron job:', error);
        return NextResponse.json({ success: false, message: 'Cron job failed.', error: String(error), logs }, { status: 500 });
    }
}
