"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { useOrganizations } from '@/hooks/use-organizations';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { useAuth } from '@/hooks/use-auth';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const PLANS = [
    {
        id: 'free',
        name: 'Free',
        monthlyPrice: '$0',
        yearlyPrice: '$0',
        description: 'For hobbyists and testing.',
        features: ['3 Triggers', '100 Executions/mo', '15-min Interval', 'Community Support'],
    },
    {
        id: 'hobbyist',
        name: 'Hobbyist',
        monthlyPrice: '$7',
        yearlyPrice: '$70',
        description: 'For serious personal projects.',
        features: ['5 Triggers', '5,000 Executions/mo', '1-min Interval', 'Email Support'],
    },
    {
        id: 'pro',
        name: 'Pro',
        monthlyPrice: '$20',
        yearlyPrice: '$200',
        description: 'For power users and small teams.',
        features: ['25 Triggers', '20,000 Executions/mo', '1-min Interval', 'Team Access', 'Priority Support'],
    },
    {
        id: 'business',
        name: 'Business',
        monthlyPrice: '$49',
        yearlyPrice: '$490',
        description: 'For scaling businesses.',
        features: ['Unlimited Triggers', '100,000 Executions/mo', '1-min Interval', 'Team Access', 'Priority Support', 'SLA'],
    },
];

export function PricingTable() {
    const { selectedOrganization } = useOrganizations();
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState<string | null>(null);
    const [isYearly, setIsYearly] = useState(false);

    const handleSubscribe = async (planId: string) => {
        if (!selectedOrganization || !user) return;
        setLoading(planId);

        try {
            const token = await user.getIdToken();
            const { data } = await axios.post('/api/stripe/checkout', {
                planId,
                interval: isYearly ? 'yearly' : 'monthly',
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
        <div className="flex flex-col items-center">
            <div className="flex items-center space-x-4 mb-8">
                <Label htmlFor="billing-mode" className={`cursor-pointer ${!isYearly ? 'font-bold' : ''}`}>Monthly</Label>
                <Switch id="billing-mode" checked={isYearly} onCheckedChange={setIsYearly} />
                <Label htmlFor="billing-mode" className={`cursor-pointer ${isYearly ? 'font-bold' : ''}`}>
                    Yearly <span className="text-xs text-green-500 ml-1">(Save ~16%)</span>
                </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                {PLANS.map((plan) => {
                    const isCurrent = currentPlanId === plan.id;
                    const isFree = plan.id === 'free';
                    const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
                    const period = isYearly ? '/year' : '/mo';

                    return (
                        <Card key={plan.id} className={`flex flex-col ${isCurrent ? 'border-primary shadow-lg' : ''}`}>
                            <CardHeader>
                                <CardTitle>{plan.name}</CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="text-3xl font-bold mb-4">
                                    {price}
                                    <span className="text-sm font-normal text-muted-foreground">{period}</span>
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
                                        disabled={!!loading || isFree} // Users can switch to paid plans from free, or between paid plans via portal usually, but here we initiate checkout for new subs/upgrades
                                    >
                                        {loading === plan.id ? 'Loading...' : (isFree ? 'Downgrade' : 'Upgrade')}
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
