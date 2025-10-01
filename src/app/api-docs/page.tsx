import { Sidebar, SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { FolderList } from "@/components/dashboard/folder-list";
import { OrganizationSwitcher } from "@/components/dashboard/organization-switcher";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/ui/logo";

const CodeBlock = ({ children }: { children: React.ReactNode }) => (
    <pre className="bg-muted rounded-md p-4 text-sm font-mono overflow-x-auto">
        <code>{children}</code>
    </pre>
);

export default function ApiDocsPage() {
  return (
    <SidebarProvider>
      <div className="flex flex-row w-full min-h-screen">
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
              <div className="mx-auto max-w-5xl space-y-8 py-8">
                  <div>
                      <h2 className="text-3xl font-bold tracking-tight font-headline">API Documentation</h2>
                      <p className="text-muted-foreground">
                          Integrate Triggered App with your services like n8n or custom scripts.
                      </p>
                  </div>
                  <div className="space-y-8">
                      <Card>
                          <CardHeader>
                              <CardTitle>Authentication</CardTitle>
                              <CardDescription>
                                  All API requests must be authenticated using your organization's API key.
                              </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                              <p>
                                  You can find your API key in the <a href="/settings" className="text-primary underline">Settings</a> page for your selected organization.
                              </p>
                              <p>
                                  Include the API key in the `Authorization` header of your HTTP requests, using the `Bearer` scheme.
                              </p>
                              <CodeBlock>
                                  Authorization: Bearer your_api_key_here
                              </CodeBlock>
                          </CardContent>
                      </Card>

                      <Separator />
                      
                      <Card>
                         <CardHeader>
                           <CardTitle>Base URL</CardTitle>
                         </CardHeader>
                         <CardContent>
                           <p>The base URL for all API v1 endpoints is:</p>
                           <CodeBlock>/api/v1</CodeBlock>
                         </CardContent>
                      </Card>

                      <Separator />

                      <Card>
                          <CardHeader>
                              <CardTitle>Trigger Endpoints</CardTitle>
                              <CardDescription>
                                  Endpoints for managing your triggers.
                              </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-6">
                              <div className="space-y-2">
                                  <h3 className="font-semibold">Get All Triggers</h3>
                                  <p className="text-sm text-muted-foreground">
                                      Retrieves a list of all triggers within the authenticated organization, including those in folders.
                                  </p>
                                  <CodeBlock>
                                      <span className="font-bold text-green-600">GET</span> /api/v1/triggers
                                  </CodeBlock>
                              </div>
                              <div className="space-y-2">
                                  <h3 className="font-semibold">Create a Trigger</h3>
                                  <p className="text-sm text-muted-foreground">
                                      Creates a new trigger. To create a trigger inside a folder, include the `folderId`.
                                  </p>
                                  <CodeBlock>
                                      <span className="font-bold text-blue-600">POST</span> /api/v1/triggers
                                  </CodeBlock>
                                  <p className="text-sm text-muted-foreground">
                                      Example Request Body:
                                  </p>
                                  <CodeBlock>
                                    {`{
  "name": "Daily Report",
  "url": "https://example.com/webhook",
  "method": "POST",
  "schedule": { "type": "daily" },
  "nextRun": "2024-08-01T09:00:00.000Z",
  "folderId": "folder-1718821321" // Optional
}`}
                                  </CodeBlock>
                              </div>
                                <div className="space-y-2">
                                  <h3 className="font-semibold">Get a Specific Trigger</h3>
                                  <p className="text-sm text-muted-foreground">
                                      Retrieves a single trigger by its ID.
                                  </p>
                                  <CodeBlock>
                                      <span className="font-bold text-green-600">GET</span> /api/v1/triggers/{`{triggerId}`}
                                  </CodeBlock>
                              </div>
                               <div className="space-y-2">
                                  <h3 className="font-semibold">Update a Trigger</h3>
                                  <p className="text-sm text-muted-foreground">
                                      Updates an existing trigger. Note: You cannot move a trigger between folders with this endpoint.
                                  </p>
                                  <CodeBlock>
                                      <span className="font-bold text-orange-500">PUT</span> /api/v1/triggers/{`{triggerId}`}
                                  </CodeBlock>
                                   <p className="text-sm text-muted-foreground">
                                      Example Request Body (include only fields to update):
                                  </p>
                                   <CodeBlock>
                                    {`{
  "name": "Daily Sales Report",
  "status": "paused"
}`}
                                  </CodeBlock>
                              </div>
                              <div className="space-y-2">
                                  <h3 className="font-semibold">Delete a Trigger</h3>
                                  <p className="text-sm text-muted-foreground">
                                      Permanently deletes a trigger.
                                  </p>
                                  <CodeBlock>
                                      <span className="font-bold text-red-600">DELETE</span> /api/v1/triggers/{`{triggerId}`}
                                  </CodeBlock>
                              </div>
                               <div className="space-y-2">
                                  <h3 className="font-semibold">Ping a Trigger</h3>
                                  <p className="text-sm text-muted-foreground">
                                      Immediately sends a request to the trigger's URL, just like the "Test Trigger" button.
                                  </p>
                                  <CodeBlock>
                                      <span className="font-bold text-blue-600">POST</span> /api/v1/triggers/{`{triggerId}`}/ping
                                  </CodeBlock>
                              </div>
                          </CardContent>
                      </Card>
                      
                       <Separator />

                      <Card>
                          <CardHeader>
                              <CardTitle>Folder Endpoints</CardTitle>
                              <CardDescription>
                                  Endpoints for managing your folders.
                              </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-6">
                               <div className="space-y-2">
                                  <h3 className="font-semibold">Get All Folders</h3>
                                  <p className="text-sm text-muted-foreground">
                                      Retrieves a list of all folders and the triggers within them.
                                  </p>
                                  <CodeBlock>
                                      <span className="font-bold text-green-600">GET</span> /api/v1/folders
                                  </CodeBlock>
                              </div>
                              <div className="space-y-2">
                                  <h3 className="font-semibold">Create a Folder</h3>
                                  <p className="text-sm text-muted-foreground">
                                      Creates a new, empty folder.
                                  </p>
                                  <CodeBlock>
                                      <span className="font-bold text-blue-600">POST</span> /api/v1/folders
                                  </CodeBlock>
                                   <p className="text-sm text-muted-foreground">
                                      Example Request Body:
                                  </p>
                                   <CodeBlock>
                                    {`{
  "name": "Production Webhooks"
}`}
                                  </CodeBlock>
                              </div>
                                <div className="space-y-2">
                                  <h3 className="font-semibold">Get a Specific Folder</h3>
                                  <p className="text-sm text-muted-foreground">
                                      Retrieves a single folder by its ID.
                                  </p>
                                  <CodeBlock>
                                      <span className="font-bold text-green-600">GET</span> /api/v1/folders/{`{folderId}`}
                                  </CodeBlock>
                              </div>
                               <div className="space-y-2">
                                  <h3 className="font-semibold">Update a Folder</h3>
                                  <p className="text-sm text-muted-foreground">
                                      Updates a folder's name.
                                  </p>
                                  <CodeBlock>
                                      <span className="font-bold text-orange-500">PUT</span> /api/v1/folders/{`{folderId}`}
                                  </CodeBlock>
                                   <p className="text-sm text-muted-foreground">
                                      Example Request Body:
                                  </p>
                                   <CodeBlock>
                                    {`{
  "name": "Archived Webhooks"
}`}
                                  </CodeBlock>
                              </div>
                              <div className="space-y-2">
                                  <h3 className="font-semibold">Delete a Folder</h3>
                                  <p className="text-sm text-muted-foreground">
                                      Deletes a folder. This will fail if the folder contains any triggers.
                                  </p>
                                  <CodeBlock>
                                      <span className="font-bold text-red-600">DELETE</span> /api/v1/folders/{`{folderId}`}
                                  </CodeBlock>
                              </div>
                          </CardContent>
                      </Card>
                  </div>
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
