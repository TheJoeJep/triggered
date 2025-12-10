
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { withAuthentication, AuthenticatedRequest, AuthenticatedContext } from '../../middleware';
import type { Trigger, TriggerStatus } from '@/lib/types';
import { z } from 'zod';
import { PLAN_LIMITS } from '@/lib/constants';
import { IntervalUnit, Schedule } from '@/lib/types';

function getIntervalInMinutes(amount: number, unit: IntervalUnit): number {
    switch (unit) {
        case 'seconds': return amount / 60;
        case 'minutes': return amount;
        case 'hours': return amount * 60;
        case 'days': return amount * 60 * 24;
        case 'weeks': return amount * 60 * 24 * 7;
        case 'months': return amount * 60 * 24 * 30; // Approx
        case 'years': return amount * 60 * 24 * 365; // Approx
        default: return 0;
    }
}

const findTriggerRef = (orgId: string, triggerId: string) => {
    return db.collection('organizations').doc(orgId).collection('triggers').doc(triggerId);
};

export const GET = withAuthentication(async (req, context) => {
    const { organization } = req;
    const { triggerId } = context.params;

    const triggerRef = findTriggerRef(organization.id, triggerId);
    const triggerDoc = await triggerRef.get();

    if (!triggerDoc.exists) {
        return NextResponse.json({ error: 'Trigger not found' }, { status: 404 });
    }

    return NextResponse.json({ id: triggerDoc.id, ...triggerDoc.data() });
});

const updateTriggerSchema = z.object({
    name: z.string().min(1).optional(),
    url: z.string().url().optional(),
    method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]).optional(),
    nextRun: z.string().datetime().optional(),
    schedule: z.object({
        type: z.enum(['one-time', 'interval']),
        amount: z.number().optional(),
        unit: z.enum(["seconds", "minutes", "hours", "days", "weeks", "months", "years"]).optional(),
    }).optional(),
    payload: z.record(z.any()).optional(),
    limit: z.number().optional(),
    timeout: z.number().int().positive().optional(),
    status: z.enum(["active", "paused"]).optional(), // Only allow these status changes via API
    archiveOnComplete: z.boolean().optional(),
});

export const PUT = withAuthentication(async (req, context) => {
    const { organization } = req;
    const { triggerId } = context.params;
    const body = await req.json();

    const validation = updateTriggerSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
    }

    const { schedule, ...updateData } = validation.data;

    // Check Plan Limits for Schedule Updates
    if (schedule && schedule.type === 'interval') {
        const planId = organization.planId || 'free';
        const limits = PLAN_LIMITS[planId];

        if (schedule.amount && schedule.unit) {
            const intervalInMinutes = getIntervalInMinutes(schedule.amount, schedule.unit);
            if (intervalInMinutes < limits.minIntervalMinutes) {
                return NextResponse.json({
                    error: `Minimum interval for ${planId} plan is ${limits.minIntervalMinutes} minutes.`,
                    code: 'INVALID_INTERVAL'
                }, { status: 400 });
            }
        }
    }

    const triggerRef = findTriggerRef(organization.id, triggerId);
    const triggerDoc = await triggerRef.get();

    if (!triggerDoc.exists) {
        return NextResponse.json({ error: 'Trigger not found' }, { status: 404 });
    }

    const finalUpdate: any = { ...updateData };
    if (schedule) finalUpdate.schedule = schedule;

    await triggerRef.update(finalUpdate);

    // Fetch updated
    const updatedDoc = await triggerRef.get();

    return NextResponse.json({ id: updatedDoc.id, ...updatedDoc.data() });
});

export const DELETE = withAuthentication(async (req, context) => {
    const { organization } = req;
    const { triggerId } = context.params;

    const triggerRef = findTriggerRef(organization.id, triggerId);
    const triggerDoc = await triggerRef.get();

    if (!triggerDoc.exists) {
        return NextResponse.json({ error: 'Trigger not found' }, { status: 404 });
    }

    await triggerRef.delete();

    return new NextResponse(null, { status: 204 });
});
