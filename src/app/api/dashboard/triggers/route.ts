import { NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase-admin';
import { PLAN_LIMITS } from '@/lib/constants';
import { Trigger, Organization } from '@/lib/types';
import { getIntervalInMinutes, calculateMinNextRun } from '@/lib/trigger-utils';
import { z } from 'zod';

const createTriggerSchema = z.object({
    name: z.string().min(1),
    url: z.string().url(),
    method: z.enum(["GET", "POST", "PUT", "DELETE"]),
    nextRun: z.string().datetime(),
    schedule: z.object({
        type: z.enum(['one-time', 'interval']),
        amount: z.number().optional(),
        unit: z.enum(["seconds", "minutes", "hours", "days", "weeks", "months", "years"]).optional(),
    }),
    folderId: z.string().optional().nullable(),
    payload: z.record(z.any()).optional(),
    limit: z.number().optional(),
    timeout: z.number().int().positive().optional(),
    archiveOnComplete: z.boolean().optional(),
    orgId: z.string().min(1),
});

export async function POST(req: Request) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    try {
        const decodedToken = await auth.verifyIdToken(token);
        const uid = decodedToken.uid;

        const body = await req.json();
        const validation = createTriggerSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid request', details: validation.error.flatten() }, { status: 400 });
        }

        const { folderId, orgId, ...triggerData } = validation.data;

        const orgRef = db.collection('organizations').doc(orgId);

        await db.runTransaction(async (transaction) => {
            const orgDoc = await transaction.get(orgRef);
            if (!orgDoc.exists) throw new Error("Organization not found");

            const orgData = orgDoc.data() as Organization;

            if (!orgData.memberUids.includes(uid)) {
                throw new Error("Unauthorized access to organization");
            }

            const planId = orgData.planId || 'free';
            const limits = PLAN_LIMITS[planId];

            const currentTriggers = orgData.triggers || [];
            const currentFolders = orgData.folders || [];
            const currentCount = currentTriggers.length + currentFolders.reduce((acc, f) => acc + (f.triggers?.length || 0), 0);

            if (currentCount >= limits.triggers) {
                throw new Error(`LIMIT_REACHED: Plan limit reached (${limits.triggers})`);
            }

            if (triggerData.schedule.type === 'interval') {
                if (triggerData.schedule.amount && triggerData.schedule.unit) {
                    const interval = getIntervalInMinutes(triggerData.schedule.amount, triggerData.schedule.unit);
                    if (interval < limits.minIntervalMinutes) {
                        throw new Error(`INVALID_INTERVAL: Minimum interval is ${limits.minIntervalMinutes} minutes`);
                    }
                }
            }

            const newTrigger: Trigger = {
                ...triggerData,
                id: `trigger-${Date.now()}`,
                status: 'active',
                runCount: 0,
                executionHistory: [],
            } as Trigger;

            let updatedFolders = currentFolders;
            let updatedTriggers = currentTriggers;

            if (folderId) {
                updatedFolders = currentFolders.map(f => {
                    if (f.id === folderId) {
                        return { ...f, triggers: [...f.triggers, newTrigger] };
                    }
                    return f;
                });
                transaction.update(orgRef, { folders: updatedFolders });
            } else {
                updatedTriggers = [...currentTriggers, newTrigger];
                transaction.update(orgRef, { triggers: updatedTriggers });
            }

            // Update minNextRun
            const tempOrg = { ...orgData, folders: updatedFolders, triggers: updatedTriggers };
            const newMin = calculateMinNextRun(tempOrg);
            transaction.update(orgRef, { minNextRun: newMin || null });
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Create Trigger Error:", error);
        if (error.message.startsWith('LIMIT_REACHED') || error.message.startsWith('INVALID_INTERVAL')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        if (error.message === 'Unauthorized access to organization') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
