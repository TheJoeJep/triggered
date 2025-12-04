"use client";

import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { DocSidebar } from "@/components/docs/doc-sidebar";
import { OrganizationSwitcher } from "@/components/dashboard/organization-switcher";
import { ErrorBoundary } from "@/components/error-boundary";
import { Logo } from "@/components/ui/logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RestApiDocs } from "@/components/docs/tabs/rest-api-docs";
import { N8nDocs } from "@/components/docs/tabs/n8n-docs";
import { ZapierDocs } from "@/components/docs/tabs/zapier-docs";
import { MakeDocs } from "@/components/docs/tabs/make-docs";
import { Button } from "@/components/ui/button";

export default function ApiDocsPage() {
    return (
        <SidebarProvider>
            <div className="flex flex-row w-full bg-background h-screen overflow-hidden">
                <ErrorBoundary>
                    <DocSidebar />
                </ErrorBoundary>
                <SidebarInset className="overflow-hidden">
                    <div className="flex flex-col flex-1 h-full overflow-hidden">
                        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4 shrink-0">
                            <div className="flex items-center gap-2">
                                <SidebarTrigger className="md:hidden" />
                                <Logo className="h-6 w-6" />
                                <h1 className="text-xl font-bold font-headline tracking-tight">
                                    Triggered App
                                </h1>
                            </div>
                            <div className="flex items-center gap-4">
                                <Button variant="outline" asChild>
                                    <a href="/">
                                        Back to Dashboard
                                    </a>
                                </Button>
                                <ErrorBoundary fallback={<div className="text-red-500 text-xs">Org Switcher Error</div>}>
                                    <OrganizationSwitcher />
                                </ErrorBoundary>
                            </div>
                        </header>
                        <main className="flex-1 overflow-auto p-4 sm:px-6 sm:py-0">
                            <div className="mx-auto max-w-5xl space-y-8 py-8">
                                <Tabs defaultValue="rest" className="space-y-8">
                                    <TabsList>
                                        <TabsTrigger value="rest">REST API</TabsTrigger>
                                        <TabsTrigger value="n8n">n8n</TabsTrigger>
                                        <TabsTrigger value="zapier">Zapier</TabsTrigger>
                                        <TabsTrigger value="make">Make</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="rest">
                                        <RestApiDocs />
                                    </TabsContent>

                                    <TabsContent value="n8n">
                                        <N8nDocs />
                                    </TabsContent>

                                    <TabsContent value="zapier">
                                        <ZapierDocs />
                                    </TabsContent>

                                    <TabsContent value="make">
                                        <MakeDocs />
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </main>
                        <footer className="p-4 text-center text-sm text-muted-foreground shrink-0">
                            &copy; {new Date().getFullYear()} Triggered App
                        </footer>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
