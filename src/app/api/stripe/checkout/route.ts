import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { withUserAuthentication } from '@/lib/user-middleware';
import { db } from '@/lib/firebase-admin';
import { z } from 'zod';

const checkoutSchema = z.object({
    planId: z.enum(['hobbyist', 'pro', 'business']),
    interval: z.enum(['monthly', 'yearly']),
    redirectUrl: z.string().url(),
    organizationId: z.string(),
});

const getPriceId = (planId: 'hobbyist' | 'pro' | 'business', interval: 'monthly' | 'yearly') => {
    if (interval === 'yearly') {
        switch (planId) {
            case 'hobbyist': return process.env.STRIPE_PRICE_ID_HOBBYIST_YEARLY;
            case 'pro': return process.env.STRIPE_PRICE_ID_PRO_YEARLY;
            case 'business': return process.env.STRIPE_PRICE_ID_BUSINESS_YEARLY;
        }
    } else {
        switch (planId) {
            case 'hobbyist': return process.env.STRIPE_PRICE_ID_HOBBYIST;
            case 'pro': return process.env.STRIPE_PRICE_ID_PRO;
            case 'business': return process.env.STRIPE_PRICE_ID_BUSINESS;
        }
    }
};

export const POST = withUserAuthentication(async (req) => {
    const { user } = req;
    const body = await req.json();

    const validation = checkoutSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
    }

    const { planId, interval, redirectUrl, organizationId } = validation.data;
    const priceId = getPriceId(planId, interval);

    if (!priceId) {
        return NextResponse.json({ error: `Price ID for plan ${planId} (${interval}) is not configured.` }, { status: 500 });
    }

    // Verify organization access
    const orgDoc = await db.collection('organizations').doc(organizationId).get();
    if (!orgDoc.exists) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organization = orgDoc.data();
    if (!organization?.memberUids.includes(user.uid)) {
        return NextResponse.json({ error: 'Unauthorized: You are not a member of this organization' }, { status: 403 });
    }

    try {
        // Check if org already has a stripe customer ID
        let customerId = organization.stripeCustomerId;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email || undefined,
                name: organization.name,
                metadata: {
                    organizationId: organizationId,
                },
            });
            customerId = customer.id;

            // Update org with customer ID immediately
            await orgDoc.ref.update({ stripeCustomerId: customerId });
        }

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${redirectUrl}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${redirectUrl}?canceled=true`,
            client_reference_id: organizationId,
            allow_promotion_codes: true,
            subscription_data: {
                metadata: {
                    organizationId: organizationId,
                    planId: planId,
                },
            },
            metadata: {
                organizationId: organizationId,
                planId: planId,
            }
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
        console.error('Error creating checkout session:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
