import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { withAuthentication } from '../middleware';
import type { Folder } from '@/lib/types';
import { z } from 'zod';

const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name cannot be empty."),
});

export const GET = withAuthentication(async (req) => {
    const { organization } = req;
    return NextResponse.json(organization.folders || []);
});

export const POST = withAuthentication(async (req) => {
    const { organization } = req;
    const body = await req.json();

    const validation = createFolderSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
    }

    const { name } = validation.data;
    
    const newFolder: Folder = {
        id: `folder-${Date.now()}`,
        name,
        triggers: [],
    };

    const orgDocRef = db.collection('organizations').doc(organization.id);
    await orgDocRef.update({
        folders: [...(organization.folders || []), newFolder]
    });

    return NextResponse.json(newFolder, { status: 201 });
});
