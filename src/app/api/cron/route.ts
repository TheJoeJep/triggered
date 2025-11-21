
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import type { Organization, Trigger, Schedule, ExecutionLog } from '@/lib/types';
import axios from 'axios';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { add } from 'date-fns';

const calculateNextRun = (schedule: Schedule, timezone: string, currentNextRun: string): Date => {
    const now = new Date();
    // Use the CURRENT scheduled run time as the base for the next calculation, not 'now'.
    const lastRun = new Date(currentNextRun);

    // Convert the last run time to the organization's specific timezone to perform calculations.
    const zonedBaseTime = toZonedTime(lastRun, timezone);

    let nextRunInTimezone: Date;

    if (schedule.type === 'one-time') {
        // One-time triggers that have run should not run again. Set to a far-future date.
        return new Date('9999-12-31T23:59:59Z');
    }

    // This handles the legacy incorrect "daily" type by treating it as a 1-day interval
    if ((schedule as any).type === 'daily') {
        schedule = { type: 'interval', amount: 1, unit: 'days' };
    }

    if (schedule.type !== 'interval' || !schedule.unit || !schedule.amount) {
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


const processTrigger = async (
    orgId: string,
    trigger: Trigger,
    folderId: string | null,
    organizationTimezone: string
): Promise<void> => {
    console.log(`[CRON] Processing trigger "${trigger.name}" (ID: ${trigger.id})`);
    if (!db) {
        console.error(`[CRON-ERROR] Firestore not initialized. Cannot process trigger ${trigger.id}.`);
        return;
    }
    const now = new Date();

    const logEntry: Omit<ExecutionLog, 'id'> = {
        timestamp: now.toISOString(),
        status: 'failed', // Default to failed, update on success
        requestPayload: trigger.payload,
    };

    const updatedTriggerFields: Partial<Trigger> = {};

    try {
        const response = await axios({
            method: trigger.method,
            url: trigger.url,
            data: trigger.payload,
            headers: { 'Content-Type': 'application/json' },
            timeout: trigger.timeout || 5000,
        });

        console.log(`[CRON] Trigger "${trigger.name}" executed successfully with status ${response.status}.`);
        logEntry.status = 'success';
        logEntry.responseStatus = response.status;
        logEntry.responseBody = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        updatedTriggerFields.status = 'active';

    } catch (error: any) {
        console.error(`[CRON-ERROR] Failed to execute trigger "${trigger.name}" (ID: ${trigger.id}):`, error.message);
        updatedTriggerFields.status = 'failed';
        logEntry.error = error.message;
        if (error.response) {
            logEntry.responseStatus = error.response.status;
            logEntry.responseBody = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data);
        }
    } finally {
        const newLog: ExecutionLog = {
            ...logEntry,
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };

        const currentRunCount = trigger.runCount || 0;
        updatedTriggerFields.runCount = currentRunCount + 1;
        updatedTriggerFields.executionHistory = [newLog, ...(trigger.executionHistory || [])].slice(0, 20);

        let isCompleted = false;
        if (trigger.limit && updatedTriggerFields.runCount >= trigger.limit) {
            updatedTriggerFields.status = 'completed';
            isCompleted = true;
        }

        if (trigger.schedule.type === 'one-time') {
            updatedTriggerFields.status = 'completed';
            isCompleted = true;
        }

        if (isCompleted) {
            updatedTriggerFields.nextRun = new Date('9999-12-31T23:59:59Z').toISOString();
        } else {
            const nextRunDate = calculateNextRun(trigger.schedule, organizationTimezone, trigger.nextRun);
            updatedTriggerFields.nextRun = nextRunDate.toISOString();
        }

        // --- Database Update Logic ---
        const orgDocRef = db.collection('organizations').doc(orgId);

        try {
            console.log(`[CRON] Attempting to update trigger ${trigger.id} in the database.`);
            await db.runTransaction(async (transaction) => {
                const orgDoc = await transaction.get(orgDocRef);
                if (!orgDoc.exists) {
                    throw new Error(`[CRON-CRITICAL] Organization ${orgId} not found during transaction!`);
                };

                const orgData = orgDoc.data() as Organization;

                if (folderId) {
                    const folderIndex = orgData.folders.findIndex(f => f.id === folderId);
                    if (folderIndex === -1) throw new Error(`Folder ${folderId} not found in org ${orgId}`);

                    const triggerIndex = orgData.folders[folderIndex].triggers.findIndex(t => t.id === trigger.id);
                    if (triggerIndex === -1) throw new Error(`Trigger ${trigger.id} not found in folder ${folderId}`);

                    const triggerInDB = orgData.folders[folderIndex].triggers[triggerIndex];
                    const finalUpdatedTrigger = { ...triggerInDB, ...updatedTriggerFields };

                    const updatePath = `folders.${folderIndex}.triggers`;
                    const currentTriggers = orgData.folders[folderIndex].triggers;
                    currentTriggers[triggerIndex] = finalUpdatedTrigger;
                    transaction.update(orgDocRef, { [updatePath]: currentTriggers });

                } else {
                    const triggerIndex = orgData.triggers.findIndex(t => t.id === trigger.id);
                    if (triggerIndex === -1) throw new Error(`Trigger ${trigger.id} not found in org ${orgId}`);

                    const triggerInDB = orgData.triggers[triggerIndex];
                    const finalUpdatedTrigger = { ...triggerInDB, ...updatedTriggerFields };

                    const updatePath = 'triggers';
                    const currentTriggers = orgData.triggers;
                    currentTriggers[triggerIndex] = finalUpdatedTrigger;
                    transaction.update(orgDocRef, { [updatePath]: currentTriggers });
                }
            });
            console.log(`[CRON] Successfully updated trigger ${trigger.id} in the database.`);
        } catch (e: any) {
            console.error(`[CRON-CRITICAL] Failed to update trigger ${trigger.id} in database after execution:`, e.message);
        }
    }
};


export async function GET() {
    console.log(`[CRON] Job started at ${new Date().toISOString()}`);
    if (!db) {
        console.error("[CRON-ERROR] Firestore DB not available in cron job.");
        return NextResponse.json({ success: false, message: 'Server configuration error.' }, { status: 500 });
    }

    try {
        const now = new Date().toISOString();
        const organizationsSnapshot = await db.collection('organizations').get();
        console.log(`[CRON] Found ${organizationsSnapshot.docs.length} organizations to process.`);

        const promises: Promise<void>[] = [];

        for (const orgDoc of organizationsSnapshot.docs) {
            const organization = orgDoc.data() as Organization;
            const orgId = orgDoc.id;
            const organizationTimezone = organization.timezone || 'UTC';

            // Process triggers in folders
            if (organization.folders) {
                for (const folder of organization.folders) {
                    if (folder.triggers) {
                        for (const trigger of folder.triggers) {
                            console.log(`[CRON] Evaluating trigger "${trigger.name}" (ID: ${trigger.id}). Next Run: ${trigger.nextRun}, Now: ${now}`);
                            if (trigger.status === 'active' && trigger.nextRun && trigger.nextRun <= now) {
                                console.log(`[CRON] Trigger "${trigger.name}" is due. Pushing to processing queue.`);
                                promises.push(processTrigger(orgId, trigger, folder.id, organizationTimezone));
                            }
                        }
                    }
                }
            }

            // Process top-level triggers
            if (organization.triggers) {
                for (const trigger of organization.triggers) {
                    console.log(`[CRON] Evaluating trigger "${trigger.name}" (ID: ${trigger.id}). Next Run: ${trigger.nextRun}, Now: ${now}`);
                    if (trigger.status === 'active' && trigger.nextRun && trigger.nextRun <= now) {
                        console.log(`[CRON] Trigger "${trigger.name}" is due. Pushing to processing queue.`);
                        promises.push(processTrigger(orgId, trigger, null, organizationTimezone));
                    }
                }
            }
        }

        if (promises.length > 0) {
            console.log(`[CRON] Executing ${promises.length} due triggers.`);
            await Promise.all(promises);
        } else {
            console.log(`[CRON] No triggers are due at this time.`);
        }

        console.log(`[CRON] Job finished at ${new Date().toISOString()}`);
        return NextResponse.json({ success: true, message: 'Cron job executed successfully.' });
    } catch (error) {
        console.error('[CRON-ERROR] Unhandled error in cron job:', error);
        return NextResponse.json({ success: false, message: 'Cron job failed.' }, { status: 500 });
    }
}
