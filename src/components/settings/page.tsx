
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { FolderList } from "@/components/dashboard/folder-list";
import { Clock } from "lucide-react";
import { SettingsForm } from "@/components/settings/settings-form";
import { OrganizationSwitcher } from "@/components/dashboard/organization-switcher";

export default function SettingsPage() {
  return (
     <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <SidebarProvider>
        <Sidebar>
          <FolderList />
        </Sidebar>
        <div className="flex flex-1 flex-col">
           <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
              <div className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold font-headline tracking-tight">
                  Webhook Time Machine
                </h1>
              </div>
              <OrganizationSwitcher />
          </header>
          <main className="flex-1 p-4 sm:px-6 sm:py-0">
             <div className="mx-auto max-w-5xl space-y-8 py-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-headline">Settings</h2>
                    <p className="text-muted-foreground">
                        Manage your account and application settings.
                    </p>
                </div>
                <SettingsForm />
            </div>
          </main>
        </div>
      </SidebarProvider>
       <footer className="p-4 text-center text-sm text-muted-foreground">
          Your reliable partner in webhook scheduling.
        </footer>
    </div>
  );
}
