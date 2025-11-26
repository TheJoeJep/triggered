import { PricingTable } from '@/components/billing/pricing-table';

export default function BillingPage() {
    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-2">Billing & Plans</h1>
            <p className="text-muted-foreground mb-8">Manage your subscription and billing details.</p>

            <PricingTable />
        </div>
    );
}
