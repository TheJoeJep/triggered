import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { withUserAuthentication } from '@/lib/user-middleware';
import { db } from '@/lib/firebase-admin';
import { z } from 'zod';

const portalSchema = z.object({
    returnUrl: z.string().url(),
    organizationId: z.string(),
});

export const POST = withUserAuthentication(async (req) => {
    const { user } = req;
    const body = await req.json();

    const validation = portalSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
    }

    const { returnUrl, organizationId } = validation.data;

    // Verify organization access
    const orgDoc = await db.collection('organizations').doc(organizationId).get();
    if (!orgDoc.exists) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organization = orgDoc.data();
    if (!organization?.memberUids.includes(user.uid)) {
        return NextResponse.json({ error: 'Unauthorized: You are not a member of this organization' }, { status: 403 });
    }

    if (!organization.stripeCustomerId) {
        return NextResponse.json({ error: 'No billing account found for this organization.' }, { status: 400 });
    }

    try {
        const session = await stripe.billingPortal.sessions.create({
            customer: organization.stripeCustomerId,
            return_url: returnUrl,
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Error creating portal session:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
