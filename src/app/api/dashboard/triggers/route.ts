import { NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase-admin';
import { PLAN_LIMITS } from '@/lib/constants';
import { Trigger, Organization, Schedule } from '@/lib/types';
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

        // Transaction is less critical here for count, but we need to check org membership.
        // We'll trust the count query.

        const orgRef = db.collection('organizations').doc(orgId);
        const orgDoc = await orgRef.get();

        if (!orgDoc.exists) throw new Error("Organization not found");
        const orgData = orgDoc.data() as Organization;

        if (!orgData.memberUids.includes(uid)) {
            throw new Error("Unauthorized access to organization");
        }

        const planId = orgData.planId || 'free';
        const limits = PLAN_LIMITS[planId];

        const triggersRef = orgRef.collection('triggers');
        const countSnapshot = await triggersRef.count().get();
        const currentCount = countSnapshot.data().count;

        if (currentCount >= limits.triggers) {
            throw new Error(`LIMIT_REACHED: Plan limit reached (${limits.triggers})`);
        }

        let finalSchedule: Schedule = triggerData.schedule as any;
        if ((triggerData.schedule as any).type === 'daily') {
            finalSchedule = { type: 'interval', amount: 1, unit: 'days' };
        }

        if (finalSchedule.type === 'interval') {
            if (finalSchedule.amount && finalSchedule.unit) {
                const interval = getIntervalInMinutes(finalSchedule.amount, finalSchedule.unit);
                if (interval < limits.minIntervalMinutes) {
                    throw new Error(`INVALID_INTERVAL: Minimum interval is ${limits.minIntervalMinutes} minutes`);
                }
            }
        }

        const newTrigger: Trigger = {
            ...triggerData,
            schedule: finalSchedule,
            id: `trigger-${Date.now()}`,
            status: 'active',
            runCount: 0,
            executionHistory: [],
            orgId: orgId,
            folderId: folderId || null
        } as Trigger;

        // Auto-generate ID or use one we set? Firestore 'add' generates one.
        // But we want to use our ID if we generated it, or let firestore generate it.
        // The type expects 'id'.
        // Let's use Firestore ID.
        const newTriggerRef = triggersRef.doc();
        newTrigger.id = newTriggerRef.id;

        await newTriggerRef.set(newTrigger);

        return NextResponse.json({ success: true, id: newTrigger.id });

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
