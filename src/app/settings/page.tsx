import { Sidebar, SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { FolderList } from "@/components/dashboard/folder-list";
import { SettingsForm } from "@/components/settings/settings-form";
import { OrganizationSwitcher } from "@/components/dashboard/organization-switcher";
import { Logo } from "@/components/ui/logo";

export default function SettingsPage() {
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
              <div className="space-y-8 max-w-5xl mx-auto py-8">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight font-headline">Settings</h2>
                  <p className="text-muted-foreground">
                    Manage your account and application settings.
                  </p>
                </div>
                <SettingsForm />
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
