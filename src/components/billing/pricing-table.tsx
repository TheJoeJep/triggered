"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { useOrganizations } from '@/hooks/use-organizations';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const PLANS = [
    {
        id: 'free',
        name: 'Free',
        price: '$0',
        description: 'For hobbyists and testing.',
        features: ['3 Triggers', '100 Executions/mo', '15-min Interval', 'Community Support'],
        current: false,
    },
    {
        id: 'hobbyist',
        name: 'Hobbyist',
        price: '$7',
        period: '/mo',
        description: 'For serious personal projects.',
        features: ['5 Triggers', '5,000 Executions/mo', '1-min Interval', 'Email Support'],
        current: false,
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$20',
        period: '/mo',
        description: 'For power users and small teams.',
        features: ['25 Triggers', '20,000 Executions/mo', '1-min Interval', 'Team Access', 'Priority Support'],
        current: false,
    },
    {
        id: 'business',
        name: 'Business',
        price: '$49',
        period: '/mo',
        description: 'For scaling businesses.',
        features: ['Unlimited Triggers', '100,000 Executions/mo', '1-min Interval', 'Team Access', 'Priority Support', 'SLA'],
        current: false,
    },
];

import { useAuth } from '@/hooks/use-auth';

// ... (PLANS array remains same)

export function PricingTable() {
    const { selectedOrganization } = useOrganizations();
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState<string | null>(null);

    const handleSubscribe = async (planId: string) => {
        if (!selectedOrganization || !user) return;
        setLoading(planId);

        try {
            const token = await user.getIdToken();
            const { data } = await axios.post('/api/stripe/checkout', {
                planId,
                redirectUrl: window.location.href,
                organizationId: selectedOrganization.id,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error: any) {
            console.error('Checkout error:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Failed to start checkout.',
                variant: 'destructive',
            });
        } finally {
            setLoading(null);
        }
    };

    const handleManageSubscription = async () => {
        if (!selectedOrganization || !user) return;
        setLoading('manage');
        try {
            const token = await user.getIdToken();
            const { data } = await axios.post('/api/stripe/portal', {
                returnUrl: window.location.href,
                organizationId: selectedOrganization.id,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error: any) {
            console.error('Portal error:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Failed to open portal.',
                variant: 'destructive',
            });
        } finally {
            setLoading(null);
        }
    };

    const currentPlanId = selectedOrganization?.planId || 'free';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan) => {
                const isCurrent = currentPlanId === plan.id;
                const isFree = plan.id === 'free';

                return (
                    <Card key={plan.id} className={`flex flex-col ${isCurrent ? 'border-primary shadow-lg' : ''}`}>
                        <CardHeader>
                            <CardTitle>{plan.name}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="text-3xl font-bold mb-4">
                                {plan.price}
                                <span className="text-sm font-normal text-muted-foreground">{plan.period}</span>
                            </div>
                            <ul className="space-y-2">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center text-sm">
                                        <Check className="h-4 w-4 mr-2 text-green-500" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            {isCurrent ? (
                                isFree ? (
                                    <Button className="w-full" disabled>Current Plan</Button>
                                ) : (
                                    <Button className="w-full" variant="outline" onClick={handleManageSubscription} disabled={loading === 'manage'}>
                                        {loading === 'manage' ? 'Loading...' : 'Manage Subscription'}
                                    </Button>
                                )
                            ) : (
                                <Button
                                    className="w-full"
                                    variant={plan.id === 'pro' ? 'default' : 'outline'}
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={!!loading || isFree} // Can't "subscribe" to free plan directly if on paid, usually managed via portal downgrade
                                >
                                    {loading === plan.id ? 'Loading...' : (isFree ? 'Downgrade' : 'Upgrade')}
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}
