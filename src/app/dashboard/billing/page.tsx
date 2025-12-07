import { Sidebar, SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { FolderList } from "@/components/dashboard/folder-list";
import { PricingTable } from '@/components/billing/pricing-table';
import { OrganizationSwitcher } from "@/components/dashboard/organization-switcher";
import { Logo } from "@/components/ui/logo";

export default function BillingPage() {
    return (
        <SidebarProvider>
            <div className="flex flex-row w-full bg-background min-h-screen">
                <Sidebar>
                    <FolderList />
                </Sidebar>
                <SidebarInset>
                    <div className="flex flex-col flex-1">
                        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
                            <div className="flex items-center gap-2">
                                <SidebarTrigger className="md:hidden" />
                                <Logo className="h-6 w-6" />
                                <h1 className="text-xl font-bold font-headline tracking-tight">
                                    Triggered App
                                </h1>
                            </div>
                            <OrganizationSwitcher />
                        </header>
                        <main className="flex-1 p-4 sm:px-6 sm:py-0">
                            <div className="container mx-auto py-10 max-w-5xl">
                                <h1 className="text-3xl font-bold mb-2 font-headline tracking-tight">Billing & Plans</h1>
                                <p className="text-muted-foreground mb-8">Manage your subscription and billing details.</p>
                                <PricingTable />
                            </div>
                        </main>
                        <footer className="p-4 text-center text-sm text-muted-foreground">
                            &copy; {new Date().getFullYear()} Triggered App
                        </footer>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
