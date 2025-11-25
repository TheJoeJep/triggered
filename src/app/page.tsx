import { Sidebar, SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { WebhookDashboard } from "@/components/dashboard/webhook-dashboard";
import { FolderList } from "@/components/dashboard/folder-list";
import { OrganizationSwitcher } from "@/components/dashboard/organization-switcher";
import { Logo } from "@/components/ui/logo";

export default async function Home() {
  return (
    <SidebarProvider>
      <div className="flex flex-row w-full bg-transparent min-h-screen gap-4">
        <Sidebar>
          <FolderList />
        </Sidebar>
        <SidebarInset>
          <div className="flex flex-col flex-1 p-4 gap-6">
            <header className="flex h-16 items-center justify-between gap-4 rounded-lg border border-white/20 bg-black/40 backdrop-blur-md px-6 shadow-[0_0_15px_rgba(255,95,31,0.1)]">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="md:hidden" />
                <Logo className="h-6 w-6" />
                <h1 className="text-xl font-bold font-headline tracking-tight text-white">
                  Triggered App
                </h1>
              </div>
              <OrganizationSwitcher />
            </header>
            <main className="flex-1">
              <WebhookDashboard />
            </main>

          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
