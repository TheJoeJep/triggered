import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { withAuthentication, AuthenticatedContext } from '../../middleware';
import type { Folder } from '@/lib/types';
import { z } from 'zod';

export const GET = withAuthentication(async (req, context) => {
    const { organization } = req;
    const { folderId } = context.params;

    const folder = organization.folders.find(f => f.id === folderId);

    if (!folder) {
        return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    return NextResponse.json(folder);
});

const updateFolderSchema = z.object({
    name: z.string().min(1, "Folder name cannot be empty.").optional(),
});


export const PUT = withAuthentication(async (req, context) => {
    const { organization } = req;
    const { folderId } = context.params;
    const body = await req.json();

    const validation = updateFolderSchema.safeParse(body);
    if (!validation.success || Object.keys(body).length === 0) {
        return NextResponse.json({ error: 'Invalid or empty request body', details: validation.error?.flatten() }, { status: 400 });
    }
    
    const { name } = validation.data;

    let folderToUpdate: Folder | undefined;
    const updatedFolders = organization.folders.map(f => {
        if (f.id === folderId) {
            folderToUpdate = { ...f, name: name || f.name };
            return folderToUpdate;
        }
        return f;
    });

    if (!folderToUpdate) {
        return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    const orgDocRef = db.collection('organizations').doc(organization.id);
    await orgDocRef.update({ folders: updatedFolders });

    return NextResponse.json(folderToUpdate);
});


export const DELETE = withAuthentication(async (req, context) => {
    const { organization } = req;
    const { folderId } = context.params;
    
    const folder = organization.folders.find(f => f.id === folderId);
    if (!folder) {
        return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    if (folder.triggers && folder.triggers.length > 0) {
        return NextResponse.json({ error: 'Cannot delete a folder that contains triggers. Please remove the triggers first.' }, { status: 400 });
    }

    const updatedFolders = organization.folders.filter(f => f.id !== folderId);
    const orgDocRef = db.collection('organizations').doc(organization.id);
    await orgDocRef.update({ folders: updatedFolders });

    return new NextResponse(null, { status: 204 });
});
