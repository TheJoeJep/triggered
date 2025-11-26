
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
        const now = new Date().toISOString();
        const organizationsSnapshot = await db.collection('organizations').get();
        log(`[CRON] Found ${organizationsSnapshot.docs.length} organizations to process.`);

        let totalDueTriggers = 0;

        for (const orgDoc of organizationsSnapshot.docs) {
            const organization = orgDoc.data() as Organization;
            const orgId = orgDoc.id;
            const organizationTimezone = organization.timezone || 'UTC';
            const planId = organization.planId || 'free';
            const limits = PLAN_LIMITS[planId];

            // Usage Tracking & Lazy Reset
            let usage = organization.usage || { executionsThisMonth: 0, billingCycleStart: new Date().toISOString() };
            const billingStart = new Date(usage.billingCycleStart);
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

            if (billingStart < oneMonthAgo) {
                // Reset usage if billing cycle is over
                usage = { executionsThisMonth: 0, billingCycleStart: new Date().toISOString() };
            }

            if (usage.executionsThisMonth >= limits.executionsPerMonth) {
                log(`[CRON] Organization ${orgId} (${planId}) reached monthly limit of ${limits.executionsPerMonth}. Skipping.`);
                continue;
            }

            const dueTriggers: { trigger: Trigger, folderId: string | null }[] = [];

            // Collect due triggers from folders
            if (Array.isArray(organization.folders)) {
                for (const folder of organization.folders) {
                    if (Array.isArray(folder.triggers)) {
                        for (const trigger of folder.triggers) {
                            if (trigger.status === 'active' && trigger.nextRun && trigger.nextRun <= now) {
                                log(`[CRON] Trigger "${trigger.name}" (ID: ${trigger.id}) is due.`);
                                dueTriggers.push({ trigger, folderId: folder.id });
                            }
                        }
                    }
                }
            }

            // Collect due top-level triggers
            if (Array.isArray(organization.triggers)) {
                for (const trigger of organization.triggers) {
                    if (trigger.status === 'active' && trigger.nextRun && trigger.nextRun <= now) {
                        log(`[CRON] Trigger "${trigger.name}" (ID: ${trigger.id}) is due.`);
                        dueTriggers.push({ trigger, folderId: null });
                    }
                }
            }

            // If no due triggers, we still want to update minNextRun if it's missing (Backfill)
            // But to avoid writing to DB every minute for every org, we only update if we did work OR if minNextRun is missing.
            // For now, let's only update if we did work to keep it simple, 
            // BUT we need to backfill. 
            // Optimization: Only update if dueTriggers > 0. 
            // The backfill will happen naturally as triggers become due.
            // However, if a trigger is far in the future, it will never get backfilled until then.
            // Let's stick to updating only when triggers are executed for now to avoid massive writes.

            if (dueTriggers.length === 0) continue;

            totalDueTriggers += dueTriggers.length;
            log(`[CRON] Executing ${dueTriggers.length} triggers for Org ${orgId}...`);

            // Execute triggers in parallel
            const results = await Promise.all(
                dueTriggers.map(dt => executeTrigger(dt.trigger, dt.folderId, organizationTimezone))
            );

            // Batch update the organization document
            try {
                await db.runTransaction(async (transaction) => {
                    const freshOrgDoc = await transaction.get(orgDoc.ref);
                    if (!freshOrgDoc.exists) throw new Error("Org not found");
                    const freshOrgData = freshOrgDoc.data() as Organization;

                    const updatedFolders = [...(freshOrgData.folders || [])];
                    const updatedTopLevelTriggers = [...(freshOrgData.triggers || [])];

                    for (const result of results) {
                        if (result.folderId) {
                            const folderIndex = updatedFolders.findIndex(f => f.id === result.folderId);
                            if (folderIndex !== -1) {
                                const triggerIndex = updatedFolders[folderIndex].triggers.findIndex(t => t.id === result.triggerId);
                                if (triggerIndex !== -1) {
                                    const trigger = updatedFolders[folderIndex].triggers[triggerIndex];
                                    updatedFolders[folderIndex].triggers[triggerIndex] = {
                                        ...trigger,
                                        status: result.status,
                                        nextRun: result.nextRun,
                                        runCount: result.runCount,
                                        executionHistory: [result.newLog, ...(trigger.executionHistory || [])].slice(0, 20)
                                    };
                                }
                            }
                        } else {
                            const triggerIndex = updatedTopLevelTriggers.findIndex(t => t.id === result.triggerId);
                            if (triggerIndex !== -1) {
                                const trigger = updatedTopLevelTriggers[triggerIndex];
                                updatedTopLevelTriggers[triggerIndex] = {
                                    ...trigger,
                                    status: result.status,
                                    nextRun: result.nextRun,
                                    runCount: result.runCount,
                                    executionHistory: [result.newLog, ...(trigger.executionHistory || [])].slice(0, 20)
                                };
                            }
                        }
                    }

                    // Calculate minNextRun for the updated organization state
                    const tempOrg: Organization = {
                        ...freshOrgData,
                        folders: updatedFolders,
                        triggers: updatedTopLevelTriggers
                    };
                    const minNextRun = calculateMinNextRun(tempOrg);

                    transaction.update(orgDoc.ref, {
                        folders: updatedFolders,
                        triggers: updatedTopLevelTriggers,
                        minNextRun: minNextRun || null,
                        usage: {
                            ...usage,
                            executionsThisMonth: usage.executionsThisMonth + results.length
                        }
                    });
                });
                log(`[CRON] Successfully updated ${results.length} triggers for Org ${orgId}.`);
            } catch (e: any) {
                console.error(`[CRON-CRITICAL] Failed to update org ${orgId}:`, e);
                log(`[CRON-ERROR] Failed to save results for Org ${orgId}: ${e.message}`);
            }
        }

        log(`[CRON] Job finished at ${new Date().toISOString()}`);
        return NextResponse.json({
            success: true,
            message: 'Cron job executed successfully.',
            stats: {
                organizations: organizationsSnapshot.docs.length,
                dueTriggers: totalDueTriggers,
                timestamp: now
            },
            logs: logs
        });
    } catch (error) {
        console.error('[CRON-ERROR] Unhandled error in cron job:', error);
        return NextResponse.json({ success: false, message: 'Cron job failed.', error: String(error), logs }, { status: 500 });
    }
}
