
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { withAuthentication, AuthenticatedRequest } from '../middleware';
import type { Trigger, Organization, Schedule } from '@/lib/types';
import { z } from 'zod';
import { PLAN_LIMITS } from '@/lib/constants';
import { IntervalUnit } from '@/lib/types';

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

const createTriggerSchema = z.object({
    name: z.string().min(1),
    url: z.string().url(),
    method: z.enum(["GET", "POST", "PUT", "DELETE"]),
    nextRun: z.string().datetime(),
    schedule: z.object({
        type: z.enum(['one-time', 'interval', 'daily']), // Allow 'daily' for backward compatibility
        amount: z.number().optional(),
        unit: z.enum(["seconds", "minutes", "hours", "days", "weeks", "months", "years"]).optional(),
    }),
    folderId: z.string().optional(),
    payload: z.record(z.any()).optional(),
    limit: z.number().optional(),
    timeout: z.number().int().positive().optional(),
    archiveOnComplete: z.boolean().optional(),
});


export const GET = withAuthentication(async (req) => {
    const { organization } = req;

    const allTriggers = [
        ...organization.triggers,
        ...organization.folders.flatMap(f => f.triggers)
    ];

    return NextResponse.json(allTriggers);
});


export const POST = withAuthentication(async (req) => {
    const { organization } = req;
    const body = await req.json();

    const validation = createTriggerSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
    }

    const { folderId, ...triggerData } = validation.data;

    const planId = organization.planId || 'free';
    const limits = PLAN_LIMITS[planId];

    // 1. Check Trigger Count Limit
    const currentTriggerCount = organization.triggers.length + organization.folders.reduce((acc, f) => acc + f.triggers.length, 0);
    if (currentTriggerCount >= limits.triggers) {
        return NextResponse.json({
            error: `Plan limit reached. You can only have ${limits.triggers} triggers on the ${planId} plan.`,
            code: 'LIMIT_REACHED'
        }, { status: 403 });
    }

    // 2. Check Minimum Interval Limit
    // Normalize the schedule data
    let finalSchedule: Schedule = triggerData.schedule as any;
    if ((triggerData.schedule as any).type === 'daily') {
        finalSchedule = { type: 'interval', amount: 1, unit: 'days' };
    }

    if (finalSchedule.type === 'interval') {
        const intervalInMinutes = getIntervalInMinutes(finalSchedule.amount, finalSchedule.unit);
        if (intervalInMinutes < limits.minIntervalMinutes) {
            return NextResponse.json({
                error: `Minimum interval for ${planId} plan is ${limits.minIntervalMinutes} minutes.`,
                code: 'INVALID_INTERVAL'
            }, { status: 400 });
        }
    }

    const newTrigger: Trigger = {
        ...triggerData,
        schedule: finalSchedule,
        id: `trigger-${Date.now()}`,
        status: 'active',
        runCount: 0,
        executionHistory: [],
    };

    const orgDocRef = db.collection('organizations').doc(organization.id);

    const currentMin = organization.minNextRun;
    const newMin = (!currentMin || newTrigger.nextRun < currentMin) ? newTrigger.nextRun : currentMin;

    if (folderId) {
        const folderExists = organization.folders.some(f => f.id === folderId);
        if (!folderExists) {
            return NextResponse.json({ error: `Folder with id ${folderId} not found` }, { status: 404 });
        }
        const updatedFolders = organization.folders.map(f => {
            if (f.id === folderId) {
                return { ...f, triggers: [...f.triggers, newTrigger] };
            }
            return f;
        });
        await orgDocRef.update({
            folders: updatedFolders,
            minNextRun: newMin
        });
    } else {
        await orgDocRef.update({
            triggers: [...organization.triggers, newTrigger],
            minNextRun: newMin
        });
    }

    return NextResponse.json(newTrigger, { status: 201 });
});
