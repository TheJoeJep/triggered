import { Sidebar, SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { WebhookDashboard } from "@/components/dashboard/webhook-dashboard";
import { FolderList } from "@/components/dashboard/folder-list";
import { OrganizationSwitcher } from "@/components/dashboard/organization-switcher";
import { Logo } from "@/components/ui/logo";

export default async function Home() {
  return (
    <SidebarProvider>
      <div className="flex flex-row w-full bg-transparent min-h-screen">
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
              <WebhookDashboard />
            </main>
            <footer className="p-4 text-center text-sm text-muted-foreground">
              Your reliable partner in webhook scheduling.
            </footer>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
