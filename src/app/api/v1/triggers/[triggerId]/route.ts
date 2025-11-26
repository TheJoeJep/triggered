
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { withAuthentication, AuthenticatedRequest, AuthenticatedContext } from '../../middleware';
import type { Trigger, TriggerStatus } from '@/lib/types';
import { z } from 'zod';
import axios from 'axios';
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

const findTrigger = (organization: AuthenticatedRequest['organization'], triggerId: string): { trigger: Trigger | null, folderId: string | null } => {
    // Check top-level triggers
    let trigger = organization.triggers.find(t => t.id === triggerId);
    if (trigger) {
        return { trigger, folderId: null };
    }
    // Check triggers in folders
    for (const folder of organization.folders) {
        trigger = folder.triggers.find(t => t.id === triggerId);
        if (trigger) {
            return { trigger, folderId: folder.id };
        }
    }
    return { trigger: null, folderId: null };
};

export const GET = withAuthentication(async (req, context) => {
    const { organization } = req;
    const { triggerId } = context.params;

    const { trigger } = findTrigger(organization, triggerId);

    if (!trigger) {
        return NextResponse.json({ error: 'Trigger not found' }, { status: 404 });
    }

    return NextResponse.json(trigger);
});


const updateTriggerSchema = z.object({
    name: z.string().min(1).optional(),
    url: z.string().url().optional(),
    method: z.enum(["GET", "POST", "PUT", "DELETE"]).optional(),
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

    // Check Plan Limits for Schedule Updates
    if (validation.data.schedule && validation.data.schedule.type === 'interval') {
        const planId = organization.planId || 'free';
        const limits = PLAN_LIMITS[planId];
        const schedule = validation.data.schedule;

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

    const { trigger: oldTrigger, folderId } = findTrigger(organization, triggerId);
    if (!oldTrigger) {
        return NextResponse.json({ error: 'Trigger not found' }, { status: 404 });
    }

    const updatedTriggerData = { ...oldTrigger, ...validation.data };

    const orgDocRef = db.collection('organizations').doc(organization.id);

    if (folderId) {
        const updatedFolders = organization.folders.map(f => {
            if (f.id === folderId) {
                return {
                    ...f,
                    triggers: f.triggers.map(t => t.id === triggerId ? updatedTriggerData : t)
                };
            }
            return f;
        });
        await orgDocRef.update({ folders: updatedFolders });
    } else {
        const updatedTriggers = organization.triggers.map(t => t.id === triggerId ? updatedTriggerData : t);
        await orgDocRef.update({ triggers: updatedTriggers });
    }

    return NextResponse.json(updatedTriggerData);
});


export const DELETE = withAuthentication(async (req, context) => {
    const { organization } = req;
    const { triggerId } = context.params;

    const { trigger, folderId } = findTrigger(organization, triggerId);

    if (!trigger) {
        return NextResponse.json({ error: 'Trigger not found' }, { status: 404 });
    }

    const orgDocRef = db.collection('organizations').doc(organization.id);

    if (folderId) {
        const updatedFolders = organization.folders.map(f => {
            if (f.id === folderId) {
                return {
                    ...f,
                    triggers: f.triggers.filter(t => t.id !== triggerId)
                };
            }
            return f;
        });
        await orgDocRef.update({ folders: updatedFolders });
    } else {
        const updatedTriggers = organization.triggers.filter(t => t.id !== triggerId);
        await orgDocRef.update({ triggers: updatedTriggers });
    }

    return new NextResponse(null, { status: 204 });
});
