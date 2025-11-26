"use client";

import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { DocSidebar } from "@/components/api-docs/doc-sidebar";
import { OrganizationSwitcher } from "@/components/dashboard/organization-switcher";
import { ErrorBoundary } from "@/components/error-boundary";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const CopyN8nButton = ({ method, url, body }: { method: string, url: string, body?: string }) => {
    const { toast } = useToast();

    const handleCopy = () => {
        const n8nNode = {
            "nodes": [
                {
                    "parameters": {
                        "method": method,
                        "url": `https://triggeredapp.com${url}`,
                        "authentication": "genericCredentialType",
                        "genericAuthType": "httpHeaderAuth",
                        "sendHeaders": true,
                        "headerParameters": {
                            "parameters": [
                                {
                                    "name": "Authorization",
                                    "value": "Bearer YOUR_API_KEY"
                                }
                            ]
                        },
                        "options": {},
                        ...(body ? {
                            "sendBody": true,
                            "contentType": "json",
                            "bodyParameters": {
                                "parameters": [
                                    {
                                        "name": "body",
                                        "value": body
                                    }
                                ]
                            }
                        } : {})
                    },
                    "type": "n8n-nodes-base.httpRequest",
                    "typeVersion": 4.3,
                    "position": [
                        0,
                        0
                    ],
                    "id": generateUUID(),
                    "name": `API ${method} Request`
                }
            ],
            "connections": {},
            "pinData": {},
            "meta": {
                "instanceId": generateUUID()
            }
        };

        navigator.clipboard.writeText(JSON.stringify(n8nNode, null, 2));
        toast({
            title: "Copied to clipboard",
            description: "Paste this directly into your n8n workflow.",
        });
    };

    return (
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
            <Copy className="h-4 w-4" />
            Copy n8n Node
        </Button>
    );
};

const CodeBlock = ({ children, method, url, body }: { children: React.ReactNode, method?: string, url?: string, body?: string }) => (
    <div className="relative group">
        <pre className="bg-muted rounded-md p-4 text-sm font-mono overflow-x-auto">
            <code>{children}</code>
        </pre>
        {method && url && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <CopyN8nButton method={method} url={url} body={body} />
            </div>
        )}
    </div>
);

export default function ApiDocsPage() {
    return (
        <SidebarProvider>
            <div className="flex flex-row w-full min-h-screen">
                <ErrorBoundary>
                    <DocSidebar />
                </ErrorBoundary>
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
                            <ErrorBoundary fallback={<div className="text-red-500 text-xs">Org Switcher Error</div>}>
                                <OrganizationSwitcher />
                            </ErrorBoundary>
                        </header>
                        <main className="flex-1 p-4 sm:px-6 sm:py-0">
                            <div className="mx-auto max-w-5xl space-y-12 py-8">
                                <div id="introduction">
                                    <h2 className="text-3xl font-bold tracking-tight font-headline">API Documentation</h2>
                                    <p className="text-muted-foreground mt-2">
                                        Integrate Triggered App with your services like n8n, Zapier, or custom scripts.
                                        This API follows RESTful principles and uses JSON for request and response bodies.
                                    </p>
                                </div>

                                <Separator />

                                <div id="authentication" className="space-y-4">
                                    <h3 className="text-2xl font-bold tracking-tight">Authentication</h3>
                                    <p>
                                        All API requests must be authenticated using your organization's API key.
                                        You can find your API key in the <a href="/settings" className="text-primary underline">Settings</a> page.
                                    </p>
                                    <Card>
                                        <CardContent className="pt-6">
                                            <p className="mb-4">
                                                Include the API key in the `Authorization` header of your HTTP requests, using the `Bearer` scheme.
                                            </p>
                                            <CodeBlock>
                                                Authorization: Bearer ta_abcdef123456...
                                            </CodeBlock>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div id="base-url" className="space-y-4">
                                    <h3 className="text-2xl font-bold tracking-tight">Base URL</h3>
                                    <p>The base URL for all API v1 endpoints is:</p>
                                    <Card>
                                        <CardContent className="pt-6">
                                            <CodeBlock>https://triggeredapp.com/api/v1</CodeBlock>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Separator />

                                <div className="space-y-8">
                                    <h3 className="text-2xl font-bold tracking-tight">Triggers</h3>

                                    <div id="get-all-triggers" className="space-y-4">
                                        <Card>
                                            <CardHeader>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-green-600 border-green-600">GET</Badge>
                                                    <CardTitle className="font-mono text-lg">/triggers</CardTitle>
                                                </div>
                                                <CardDescription>
                                                    Retrieves a list of all triggers within the authenticated organization, including those in folders.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <CodeBlock method="GET" url="/api/v1/triggers">
                                                    GET /api/v1/triggers
                                                </CodeBlock>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div id="create-trigger" className="space-y-4">
                                        <Card>
                                            <CardHeader>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-blue-600 border-blue-600">POST</Badge>
                                                    <CardTitle className="font-mono text-lg">/triggers</CardTitle>
                                                </div>
                                                <CardDescription>
                                                    Creates a new trigger.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Field</TableHead>
                                                            <TableHead>Type</TableHead>
                                                            <TableHead>Required</TableHead>
                                                            <TableHead>Description</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        <TableRow>
                                                            <TableCell className="font-mono">name</TableCell>
                                                            <TableCell>string</TableCell>
                                                            <TableCell>Yes</TableCell>
                                                            <TableCell>The display name of the trigger.</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-mono">url</TableCell>
                                                            <TableCell>string</TableCell>
                                                            <TableCell>Yes</TableCell>
                                                            <TableCell>The valid URL to call when triggered.</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-mono">method</TableCell>
                                                            <TableCell>enum</TableCell>
                                                            <TableCell>Yes</TableCell>
                                                            <TableCell>One of: "GET", "POST", "PUT", "DELETE".</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-mono">nextRun</TableCell>
                                                            <TableCell>string</TableCell>
                                                            <TableCell>Yes</TableCell>
                                                            <TableCell>ISO 8601 datetime string (e.g., "2024-12-25T10:00:00Z").</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-mono">schedule</TableCell>
                                                            <TableCell>object</TableCell>
                                                            <TableCell>Yes</TableCell>
                                                            <TableCell>
                                                                <div className="space-y-1">
                                                                    <p><span className="font-mono text-xs">type</span>: "one-time" | "interval" | "daily"</p>
                                                                    <p><span className="font-mono text-xs">amount</span>: number (required for interval)</p>
                                                                    <p><span className="font-mono text-xs">unit</span>: "seconds" | "minutes" | "hours" | "days" | "weeks" | "months" | "years" (required for interval)</p>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-mono">folderId</TableCell>
                                                            <TableCell>string</TableCell>
                                                            <TableCell>No</TableCell>
                                                            <TableCell>The ID of the folder to place this trigger in.</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-mono">payload</TableCell>
                                                            <TableCell>object</TableCell>
                                                            <TableCell>No</TableCell>
                                                            <TableCell>JSON object to send as the body of the webhook request.</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-mono">limit</TableCell>
                                                            <TableCell>number</TableCell>
                                                            <TableCell>No</TableCell>
                                                            <TableCell>Maximum number of times this trigger should run.</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-mono">timeout</TableCell>
                                                            <TableCell>number</TableCell>
                                                            <TableCell>No</TableCell>
                                                            <TableCell>Request timeout in milliseconds.</TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>

                                                <div>
                                                    <p className="text-sm font-medium mb-2">Example Request Body</p>
                                                    <CodeBlock method="POST" url="/api/v1/triggers" body={`{
  "name": "Daily Report",
  "url": "https://example.com/webhook",
  "method": "POST",
  "schedule": { "type": "daily" },
  "nextRun": "2024-08-01T09:00:00.000Z",
  "payload": { "source": "triggered-app" }
}`}>
                                                        {`{
  "name": "Daily Report",
  "url": "https://example.com/webhook",
  "method": "POST",
  "schedule": { "type": "daily" },
  "nextRun": "2024-08-01T09:00:00.000Z",
  "payload": { "source": "triggered-app" }
}`}
                                                    </CodeBlock>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div id="get-trigger" className="space-y-4">
                                        <Card>
                                            <CardHeader>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-green-600 border-green-600">GET</Badge>
                                                    <CardTitle className="font-mono text-lg">/triggers/{`{triggerId}`}</CardTitle>
                                                </div>
                                                <CardDescription>
                                                    Retrieves a single trigger by its ID.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <CodeBlock method="GET" url="/api/v1/triggers/{triggerId}">
                                                    GET /api/v1/triggers/{`{triggerId}`}
                                                </CodeBlock>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div id="update-trigger" className="space-y-4">
                                        <Card>
                                            <CardHeader>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-orange-500 border-orange-500">PUT</Badge>
                                                    <CardTitle className="font-mono text-lg">/triggers/{`{triggerId}`}</CardTitle>
                                                </div>
                                                <CardDescription>
                                                    Updates an existing trigger. All fields are optional; only provided fields will be updated.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Field</TableHead>
                                                            <TableHead>Type</TableHead>
                                                            <TableHead>Description</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        <TableRow>
                                                            <TableCell className="font-mono">name</TableCell>
                                                            <TableCell>string</TableCell>
                                                            <TableCell>The display name of the trigger.</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-mono">url</TableCell>
                                                            <TableCell>string</TableCell>
                                                            <TableCell>The valid URL to call when triggered.</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-mono">method</TableCell>
                                                            <TableCell>enum</TableCell>
                                                            <TableCell>One of: "GET", "POST", "PUT", "DELETE".</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-mono">nextRun</TableCell>
                                                            <TableCell>string</TableCell>
                                                            <TableCell>ISO 8601 datetime string.</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-mono">schedule</TableCell>
                                                            <TableCell>object</TableCell>
                                                            <TableCell>
                                                                The schedule object (type, amount, unit).
                                                            </TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-mono">payload</TableCell>
                                                            <TableCell>object</TableCell>
                                                            <TableCell>JSON object to send as the body.</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-mono">limit</TableCell>
                                                            <TableCell>number</TableCell>
                                                            <TableCell>Maximum number of runs.</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-mono">timeout</TableCell>
                                                            <TableCell>number</TableCell>
                                                            <TableCell>Request timeout in milliseconds.</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-mono">status</TableCell>
                                                            <TableCell>enum</TableCell>
                                                            <TableCell>One of: "active", "paused".</TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>

                                                <div>
                                                    <p className="text-sm font-medium mb-2">Example Request Body</p>
                                                    <CodeBlock method="PUT" url="/api/v1/triggers/{triggerId}" body={`{
  "name": "Updated Report Name",
  "status": "paused"
}`}>
                                                        {`{
  "name": "Updated Report Name",
  "status": "paused"
}`}
                                                    </CodeBlock>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div id="delete-trigger" className="space-y-4">
                                        <Card>
                                            <CardHeader>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-red-600 border-red-600">DELETE</Badge>
                                                    <CardTitle className="font-mono text-lg">/triggers/{`{triggerId}`}</CardTitle>
                                                </div>
                                                <CardDescription>
                                                    Permanently deletes a trigger.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <CodeBlock method="DELETE" url="/api/v1/triggers/{triggerId}">
                                                    DELETE /api/v1/triggers/{`{triggerId}`}
                                                </CodeBlock>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div id="ping-trigger" className="space-y-4">
                                        <Card>
                                            <CardHeader>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-blue-600 border-blue-600">POST</Badge>
                                                    <CardTitle className="font-mono text-lg">/triggers/{`{triggerId}`}/ping</CardTitle>
                                                </div>
                                                <CardDescription>
                                                    Immediately sends a request to the trigger's URL, regardless of its schedule or status. This is useful for testing.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <CodeBlock method="POST" url="/api/v1/triggers/{triggerId}/ping">
                                                    POST /api/v1/triggers/{`{triggerId}`}/ping
                                                </CodeBlock>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-8">
                                    <h3 className="text-2xl font-bold tracking-tight">Folders</h3>

                                    <div id="get-all-folders" className="space-y-4">
                                        <Card>
                                            <CardHeader>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-green-600 border-green-600">GET</Badge>
                                                    <CardTitle className="font-mono text-lg">/folders</CardTitle>
                                                </div>
                                                <CardDescription>
                                                    Retrieves a list of all folders and the triggers within them.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <CodeBlock method="GET" url="/api/v1/folders">
                                                    GET /api/v1/folders
                                                </CodeBlock>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div id="create-folder" className="space-y-4">
                                        <Card>
                                            <CardHeader>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-blue-600 border-blue-600">POST</Badge>
                                                    <CardTitle className="font-mono text-lg">/folders</CardTitle>
                                                </div>
                                                <CardDescription>
                                                    Creates a new, empty folder.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Field</TableHead>
                                                            <TableHead>Type</TableHead>
                                                            <TableHead>Required</TableHead>
                                                            <TableHead>Description</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        <TableRow>
                                                            <TableCell className="font-mono">name</TableCell>
                                                            <TableCell>string</TableCell>
                                                            <TableCell>Yes</TableCell>
                                                            <TableCell>The name of the folder.</TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                                <div>
                                                    <p className="text-sm font-medium mb-2">Example Request Body</p>
                                                    <CodeBlock method="POST" url="/api/v1/folders" body={`{
  "name": "Production Webhooks"
}`}>
                                                        {`{
  "name": "Production Webhooks"
}`}
                                                    </CodeBlock>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div id="get-folder" className="space-y-4">
                                        <Card>
                                            <CardHeader>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-green-600 border-green-600">GET</Badge>
                                                    <CardTitle className="font-mono text-lg">/folders/{`{folderId}`}</CardTitle>
                                                </div>
                                                <CardDescription>
                                                    Retrieves a single folder by its ID.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <CodeBlock method="GET" url="/api/v1/folders/{folderId}">
                                                    GET /api/v1/folders/{`{folderId}`}
                                                </CodeBlock>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div id="update-folder" className="space-y-4">
                                        <Card>
                                            <CardHeader>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-orange-500 border-orange-500">PUT</Badge>
                                                    <CardTitle className="font-mono text-lg">/folders/{`{folderId}`}</CardTitle>
                                                </div>
                                                <CardDescription>
                                                    Updates a folder's name.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Field</TableHead>
                                                            <TableHead>Type</TableHead>
                                                            <TableHead>Required</TableHead>
                                                            <TableHead>Description</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        <TableRow>
                                                            <TableCell className="font-mono">name</TableCell>
                                                            <TableCell>string</TableCell>
                                                            <TableCell>Yes</TableCell>
                                                            <TableCell>The new name of the folder.</TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                                <div>
                                                    <p className="text-sm font-medium mb-2">Example Request Body</p>
                                                    <CodeBlock method="PUT" url="/api/v1/folders/{folderId}" body={`{
  "name": "Archived Webhooks"
}`}>
                                                        {`{
  "name": "Archived Webhooks"
}`}
                                                    </CodeBlock>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div id="delete-folder" className="space-y-4">
                                        <Card>
                                            <CardHeader>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-red-600 border-red-600">DELETE</Badge>
                                                    <CardTitle className="font-mono text-lg">/folders/{`{folderId}`}</CardTitle>
                                                </div>
                                                <CardDescription>
                                                    Deletes a folder. This will fail if the folder contains any triggers.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <CodeBlock method="DELETE" url="/api/v1/folders/{folderId}">
                                                    DELETE /api/v1/folders/{`{folderId}`}
                                                </CodeBlock>
                                            </CardContent>
                                        </Card>
                                    </div>
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
