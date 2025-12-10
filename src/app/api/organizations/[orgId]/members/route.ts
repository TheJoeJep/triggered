import { NextRequest, NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase-admin';
import { z } from 'zod';

const addMemberSchema = z.object({
    email: z.string().email(),
    role: z.enum(['editor', 'viewer', 'owner']),
});

const updateMemberSchema = z.object({
    uid: z.string(),
    role: z.enum(['editor', 'viewer', 'owner']),
});

const deleteMemberSchema = z.object({
    uid: z.string(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;
    try {
        const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
        if (!idToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decodedToken = await auth.verifyIdToken(idToken);
        const requesterUid = decodedToken.uid;

        const body = await req.json();
        const { email, role } = addMemberSchema.parse(body);

        const orgRef = db.collection('organizations').doc(orgId);
        const orgDoc = await orgRef.get();

        if (!orgDoc.exists) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

        const orgData = orgDoc.data();
        const currentMembers = orgData?.members || [];

        // Check permission (Owner only for now)
        const requesterMember = currentMembers.find((m: any) => m.uid === requesterUid);
        if (!requesterMember || requesterMember.role !== 'owner') {
            return NextResponse.json({ error: 'Only owners can add members' }, { status: 403 });
        }

        // Lookup User
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(email);
        } catch (error) {
            return NextResponse.json({ error: 'User not found. Please ask them to sign up first.' }, { status: 404 });
        }

        // Check if already member
        if (currentMembers.find((m: any) => m.uid === userRecord.uid)) {
            return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
        }

        const newMember = {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            photoURL: userRecord.photoURL,
            role: role
        };

        // Transactional update
        await db.runTransaction(async (t) => {
            const doc = await t.get(orgRef);
            const members = doc.data()?.members || [];
            const memberUids = doc.data()?.memberUids || [];

            t.update(orgRef, {
                members: [...members, newMember],
                memberUids: [...memberUids, userRecord.uid]
            });
        });

        return NextResponse.json({ success: true, member: newMember });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;
    try {
        const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
        if (!idToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decodedToken = await auth.verifyIdToken(idToken);
        const requesterUid = decodedToken.uid;

        const body = await req.json();
        const { uid, role } = updateMemberSchema.parse(body);

        const orgRef = db.collection('organizations').doc(orgId);
        const orgDoc = await orgRef.get();
        if (!orgDoc.exists) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

        const orgData = orgDoc.data();
        const currentMembers = orgData?.members || [];
        const requesterMember = currentMembers.find((m: any) => m.uid === requesterUid);

        if (!requesterMember || requesterMember.role !== 'owner') {
            return NextResponse.json({ error: 'Only owners can update roles' }, { status: 403 });
        }

        if (uid === requesterUid) {
            return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
        }

        const updatedMembers = currentMembers.map((m: any) =>
            m.uid === uid ? { ...m, role } : m
        );

        await orgRef.update({ members: updatedMembers });

        return NextResponse.json({ success: true, members: updatedMembers });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;
    try {
        const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
        if (!idToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decodedToken = await auth.verifyIdToken(idToken);
        const requesterUid = decodedToken.uid;

        const body = await req.json();
        const { uid } = deleteMemberSchema.parse(body);

        const orgRef = db.collection('organizations').doc(orgId);
        const orgDoc = await orgRef.get();
        if (!orgDoc.exists) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

        const orgData = orgDoc.data();
        const currentMembers = orgData?.members || [];
        const requesterMember = currentMembers.find((m: any) => m.uid === requesterUid);

        if (!requesterMember || requesterMember.role !== 'owner') {
            // Allow leaving logic? For now strict owner management.
            // If user wants to leave, they remove themselves?
            if (uid !== requesterUid) {
                return NextResponse.json({ error: 'Only owners can remove members' }, { status: 403 });
            }
        }

        // Prevent removing the LAST owner
        const owners = currentMembers.filter((m: any) => m.role === 'owner');
        if (owners.length === 1 && owners[0].uid === uid) {
            return NextResponse.json({ error: 'Cannot remove the last owner' }, { status: 400 });
        }

        const updatedMembers = currentMembers.filter((m: any) => m.uid !== uid);
        const updatedMemberUids = (orgData?.memberUids || []).filter((id: string) => id !== uid);

        await orgRef.update({
            members: updatedMembers,
            memberUids: updatedMemberUids
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
