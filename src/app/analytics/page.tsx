
"use client";

import { Sidebar, SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { FolderList } from "@/components/dashboard/folder-list";
import { OrganizationSwitcher } from "@/components/dashboard/organization-switcher";
import { useOrganizations } from "@/hooks/use-organizations";
import { TriggerAnalyticsChart } from "@/components/dashboard/trigger-analytics-chart";
import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { RawEventLog } from "@/components/dashboard/raw-event-log";
import type { ExecutionLog, Trigger } from "@/lib/types";

type FlattenedLog = ExecutionLog & {
    triggerName: string;
    triggerId: string;
};

export default function AnalyticsPage() {
    const { selectedOrganization, loading } = useOrganizations();

    const allTriggers = useMemo(() => {
        if (!selectedOrganization) return [];
        const triggersFromFolders = selectedOrganization.folders.flatMap(f => f.triggers);
        return [...triggersFromFolders, ...selectedOrganization.triggers];
    }, [selectedOrganization]);
    
    const flattenedLogs = useMemo((): FlattenedLog[] => {
        if (!allTriggers) return [];
        
        const logs: FlattenedLog[] = [];
        allTriggers.forEach((trigger: Trigger) => {
            if (trigger.executionHistory) {
                trigger.executionHistory.forEach((log: ExecutionLog) => {
                    logs.push({
                        ...log,
                        triggerName: trigger.name,
                        triggerId: trigger.id
                    });
                });
            }
        });

        // Sort logs by timestamp in descending order (most recent first)
        return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [allTriggers]);

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
                    Webhook Time Machine
                  </h1>
                </div>
                <OrganizationSwitcher />
            </header>
            <main className="flex-1 p-4 sm:px-6 sm:py-0">
              <div className="mx-auto max-w-7xl space-y-8 py-8">
                  <div>
                      <h2 className="text-3xl font-bold tracking-tight font-headline">Trigger Analytics</h2>
                      <p className="text-muted-foreground">
                          Visualize the activation history of your triggers over time.
                      </p>
                  </div>
                  
                  {loading ? (
                     <Card>
                        <CardHeader>
                            <CardTitle>Trigger Activations</CardTitle>
                            <CardDescription>A line chart showing successful trigger activations over time.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-96 flex items-center justify-center">
                                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        </CardContent>
                    </Card>
                  ) : (
                    <>
                      <TriggerAnalyticsChart allTriggers={allTriggers} />
                      <RawEventLog logs={flattenedLogs} />
                    </>
                  )}
              </div>
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
