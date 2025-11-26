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
          <main className="flex-1 h-full overflow-hidden">
            <WebhookDashboard />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
