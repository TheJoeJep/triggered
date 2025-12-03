"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CurlBuilder } from "../curl-builder";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CodeBlock = ({ children }: { children: React.ReactNode }) => {
    const { toast } = useToast();
    const handleCopy = () => {
        if (typeof children === 'string') {
            navigator.clipboard.writeText(children);
            toast({
                title: "Copied",
                description: "Code copied to clipboard",
            });
        }
    };

    return (
        <div className="relative group">
            <pre className="bg-muted rounded-md p-4 text-sm font-mono overflow-x-auto">
                <code>{children}</code>
            </pre>
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                onClick={handleCopy}
            >
                <Copy className="h-3 w-3" />
            </Button>
        </div>
    );
};

export function RestApiDocs() {
    return (
        <div className="space-y-12">
            <div id="introduction">
                <h2 className="text-3xl font-bold tracking-tight font-headline">REST API</h2>
                <p className="text-muted-foreground mt-2">
                    Directly interact with the Triggered App API using standard HTTP requests.
                </p>
            </div>

            <CurlBuilder />

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
                                Retrieves a list of all triggers within the authenticated organization.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CodeBlock>
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
                                        <TableCell>ISO 8601 datetime string.</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-mono">schedule</TableCell>
                                        <TableCell>object</TableCell>
                                        <TableCell>Yes</TableCell>
                                        <TableCell>Schedule configuration object.</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>

                            <div>
                                <p className="text-sm font-medium mb-2">Example Request Body</p>
                                <CodeBlock>
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
                                <CardTitle className="font-mono text-lg">/triggers/:id</CardTitle>
                            </div>
                            <CardDescription>
                                Retrieves a specific trigger by ID.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CodeBlock>
                                GET /api/v1/triggers/trigger_12345
                            </CodeBlock>
                        </CardContent>
                    </Card>
                </div>

                <div id="update-trigger" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-yellow-600 border-yellow-600">PUT</Badge>
                                <CardTitle className="font-mono text-lg">/triggers/:id</CardTitle>
                            </div>
                            <CardDescription>
                                Updates a trigger's details.
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
                                        <TableCell>No</TableCell>
                                        <TableCell>The new name of the trigger.</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-mono">status</TableCell>
                                        <TableCell>enum</TableCell>
                                        <TableCell>No</TableCell>
                                        <TableCell>"active" or "paused".</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>

                            <div>
                                <p className="text-sm font-medium mb-2">Example Request Body</p>
                                <CodeBlock>
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
                                <CardTitle className="font-mono text-lg">/triggers/:id</CardTitle>
                            </div>
                            <CardDescription>
                                Deletes a trigger.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CodeBlock>
                                DELETE /api/v1/triggers/trigger_12345
                            </CodeBlock>
                        </CardContent>
                    </Card>
                </div>

                <div id="test-trigger" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-blue-600 border-blue-600">POST</Badge>
                                <CardTitle className="font-mono text-lg">/triggers/:id/ping</CardTitle>
                            </div>
                            <CardDescription>
                                Immediately executes the trigger (Test Run).
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CodeBlock>
                                POST /api/v1/triggers/trigger_12345/ping
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
                                Retrieves a list of all folders within the authenticated organization.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CodeBlock>
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
                                Creates a new folder.
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
                                <CodeBlock>
                                    {`{
  "name": "Marketing Campaigns"
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
                                <CardTitle className="font-mono text-lg">/folders/:id</CardTitle>
                            </div>
                            <CardDescription>
                                Retrieves a specific folder by ID.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CodeBlock>
                                GET /api/v1/folders/folder_12345
                            </CodeBlock>
                        </CardContent>
                    </Card>
                </div>

                <div id="update-folder" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-yellow-600 border-yellow-600">PUT</Badge>
                                <CardTitle className="font-mono text-lg">/folders/:id</CardTitle>
                            </div>
                            <CardDescription>
                                Updates a folder's details.
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
                                        <TableCell>No</TableCell>
                                        <TableCell>The new name of the folder.</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>

                            <div>
                                <p className="text-sm font-medium mb-2">Example Request Body</p>
                                <CodeBlock>
                                    {`{
  "name": "Updated Marketing Campaigns"
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
                                <CardTitle className="font-mono text-lg">/folders/:id</CardTitle>
                            </div>
                            <CardDescription>
                                Deletes a folder. Note: This may delete all triggers within the folder.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CodeBlock>
                                DELETE /api/v1/folders/folder_12345
                            </CodeBlock>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
