import { NextResponse } from 'next/server';
import { withAuthentication, AuthenticatedRequest, AuthenticatedContext } from '../../../middleware';
import type { Trigger } from '@/lib/types';
import axios from 'axios';

const findTrigger = (organization: AuthenticatedRequest['organization'], triggerId: string): Trigger | null => {
    let trigger = organization.triggers.find(t => t.id === triggerId);
    if (trigger) return trigger;
    for (const folder of organization.folders) {
        trigger = folder.triggers.find(t => t.id === triggerId);
        if (trigger) return trigger;
    }
    return null;
};

export const POST = withAuthentication(async (req, context) => {
    const { organization } = req;
    const { triggerId } = context.params;

    const trigger = findTrigger(organization, triggerId);

    if (!trigger) {
        return NextResponse.json({ error: 'Trigger not found' }, { status: 404 });
    }

    try {
        const response = await axios({
            method: trigger.method,
            url: trigger.url,
            data: trigger.payload,
            headers: { 'Content-Type': 'application/json' },
            timeout: trigger.timeout || 5000,
        });
        
        return NextResponse.json({
            success: true,
            status: response.status,
            data: response.data
        }, { status: 200 });

    } catch (error: any) {
        let errorResponse: any = { success: false, message: error.message };
        if (error.response) {
            errorResponse.status = error.response.status;
            errorResponse.data = error.response.data;
        }
         return NextResponse.json(errorResponse, { status: error.response?.status || 500 });
    }
});
