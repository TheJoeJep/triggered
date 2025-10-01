
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { withAuthentication, AuthenticatedRequest } from '../middleware';
import type { Trigger, Organization, Schedule } from '@/lib/types';
import { z } from 'zod';

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
    
    // Normalize the schedule data
    let finalSchedule: Schedule = triggerData.schedule;
    if ((triggerData.schedule as any).type === 'daily') {
        finalSchedule = { type: 'interval', amount: 1, unit: 'days' };
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
        await orgDocRef.update({ folders: updatedFolders });
    } else {
        await orgDocRef.update({
            triggers: [...organization.triggers, newTrigger]
        });
    }

    return NextResponse.json(newTrigger, { status: 201 });
});
