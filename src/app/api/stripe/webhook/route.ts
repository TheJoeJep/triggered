import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/firebase-admin';
import Stripe from 'stripe';

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            throw new Error('STRIPE_WEBHOOK_SECRET is missing');
        }
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error: any) {
        console.error(`Webhook signature verification failed: ${error.message}`);
        return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutSessionCompleted(session);
                break;
            }
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionUpdated(subscription);
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionDeleted(subscription);
                break;
            }
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    } catch (error: any) {
        console.error(`Error handling webhook event ${event.type}:`, error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const organizationId = session.client_reference_id;
    const subscriptionId = session.subscription as string;
    const customerId = session.customer as string;

    if (!organizationId) {
        console.error('Organization ID missing in checkout session');
        return;
    }

    // Retrieve the subscription to get the plan details if needed, 
    // but we can also rely on metadata if we passed it.
    // For simplicity, let's assume we trust the metadata or fetch subscription.
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const planId = session.metadata?.planId || 'pro'; // Fallback or logic to map price ID to plan ID

    await db.collection('organizations').doc(organizationId).update({
        stripeCustomerId: customerId,
        subscriptionId: subscriptionId,
        planId: planId as any,
        subscriptionStatus: subscription.status,
    });
    console.log(`Updated organization ${organizationId} with subscription ${subscriptionId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    // Find organization by stripeCustomerId
    const orgsSnapshot = await db.collection('organizations')
        .where('stripeCustomerId', '==', customerId)
        .limit(1)
        .get();

    if (orgsSnapshot.empty) {
        console.error(`Organization not found for customer ${customerId}`);
        return;
    }

    const orgDoc = orgsSnapshot.docs[0];

    // Determine planId from the active price ID
    const priceId = subscription.items.data[0]?.price.id;
    let planId = 'free';

    if (priceId === process.env.STRIPE_PRICE_ID_HOBBYIST || priceId === process.env.STRIPE_PRICE_ID_HOBBYIST_YEARLY) {
        planId = 'hobbyist';
    } else if (priceId === process.env.STRIPE_PRICE_ID_PRO || priceId === process.env.STRIPE_PRICE_ID_PRO_YEARLY) {
        planId = 'pro';
    } else if (priceId === process.env.STRIPE_PRICE_ID_BUSINESS || priceId === process.env.STRIPE_PRICE_ID_BUSINESS_YEARLY) {
        planId = 'business';
    } else {
        // Fallback to metadata if price ID is unknown (legacy or unmatched)
        // Or keep existing plan if we can't determine
        planId = subscription.metadata.planId || orgDoc.data().planId || 'free';
        console.warn(`Unknown price ID ${priceId}, falling back to metadata/previous planId: ${planId}`);
    }

    await orgDoc.ref.update({
        subscriptionStatus: subscription.status,
        planId: planId,
        subscriptionId: subscription.id,
    });
    console.log(`Updated subscription status for organization ${orgDoc.id} to ${subscription.status} (Plan: ${planId})`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    const orgsSnapshot = await db.collection('organizations')
        .where('stripeCustomerId', '==', customerId)
        .limit(1)
        .get();

    if (orgsSnapshot.empty) {
        console.error(`Organization not found for customer ${customerId}`);
        return;
    }

    const orgDoc = orgsSnapshot.docs[0];

    await orgDoc.ref.update({
        subscriptionStatus: 'canceled',
        planId: 'free', // Revert to free plan
        subscriptionId: null, // Optional: keep history or clear
    });
    console.log(`Subscription canceled for organization ${orgDoc.id}, reverted to free plan.`);
}
