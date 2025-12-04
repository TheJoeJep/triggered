"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function ZapierDocs() {
    return (
        <div className="space-y-12">
            <div id="introduction">
                <h2 className="text-3xl font-bold tracking-tight font-headline">Zapier Integration</h2>
                <p className="text-muted-foreground mt-2">
                    Connect Triggered App to thousands of other apps using Zapier.
                </p>
            </div>

            <div id="authentication" className="space-y-4">
                <h3 className="text-2xl font-bold tracking-tight">Authentication</h3>
                <p>
                    All API requests must be authenticated using your organization's API key.
                    You can find your API key in the <a href="/settings" className="text-primary underline">Settings</a> page.
                </p>
                <Card>
                    <CardContent className="pt-6">
                        <p className="mb-4">
                            In Zapier's <strong>Webhooks by Zapier</strong> action, add a header:
                        </p>
                        <ul className="list-disc list-inside ml-4 text-sm text-muted-foreground">
                            <li><strong>Key:</strong> Authorization</li>
                            <li><strong>Value:</strong> Bearer YOUR_API_KEY</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Using Webhooks by Zapier</CardTitle>
                        <CardDescription>
                            Since Triggered App provides a REST API, you can use the "Webhooks by Zapier" app to interact with it.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ol className="list-decimal list-inside space-y-4">
                            <li>
                                <strong>Create a Zap</strong> and choose <strong>Webhooks by Zapier</strong> as the action app.
                            </li>
                            <li>
                                Select the <strong>Custom Request</strong> event (or POST/GET depending on your need).
                            </li>
                            <li>
                                In the <strong>Method</strong> field, select the appropriate HTTP method (e.g., POST to create a trigger).
                            </li>
                            <li>
                                In the <strong>URL</strong> field, enter the API endpoint (e.g., `https://triggeredapp.com/api/v1/triggers`).
                            </li>
                            <li>
                                In the <strong>Headers</strong> section, add:
                                <ul className="list-disc list-inside ml-6 mt-2 text-sm text-muted-foreground">
                                    <li><strong>Authorization</strong>: `Bearer YOUR_API_KEY`</li>
                                    <li><strong>Content-Type</strong>: `application/json`</li>
                                </ul>
                            </li>
                            <li>
                                If creating or updating, add your JSON payload in the <strong>Data</strong> field.
                            </li>
                        </ol>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Trigger API Endpoints</CardTitle>
                        <CardDescription>
                            Manage your triggers using these endpoints.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="p-4 border rounded-lg">
                                <h4 className="font-medium">Get All Triggers</h4>
                                <p className="text-sm text-muted-foreground mb-2">Method: GET</p>
                                <code className="text-xs bg-muted p-1 rounded">https://triggeredapp.com/api/v1/triggers</code>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <h4 className="font-medium">Create Trigger</h4>
                                <p className="text-sm text-muted-foreground mb-2">Method: POST</p>
                                <code className="text-xs bg-muted p-1 rounded">https://triggeredapp.com/api/v1/triggers</code>
                                <p className="text-xs text-muted-foreground mt-2">Body: {`{ "name": "...", "url": "...", ... }`}</p>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <h4 className="font-medium">Get Trigger</h4>
                                <p className="text-sm text-muted-foreground mb-2">Method: GET</p>
                                <code className="text-xs bg-muted p-1 rounded">https://triggeredapp.com/api/v1/triggers/:id</code>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <h4 className="font-medium">Update Trigger</h4>
                                <p className="text-sm text-muted-foreground mb-2">Method: PUT</p>
                                <code className="text-xs bg-muted p-1 rounded">https://triggeredapp.com/api/v1/triggers/:id</code>
                                <p className="text-xs text-muted-foreground mt-2">Body: {`{ "name": "New Name" }`}</p>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <h4 className="font-medium">Delete Trigger</h4>
                                <p className="text-sm text-muted-foreground mb-2">Method: DELETE</p>
                                <code className="text-xs bg-muted p-1 rounded">https://triggeredapp.com/api/v1/triggers/:id</code>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <h4 className="font-medium">Test Trigger (Ping)</h4>
                                <p className="text-sm text-muted-foreground mb-2">Method: POST</p>
                                <code className="text-xs bg-muted p-1 rounded">https://triggeredapp.com/api/v1/triggers/:id/ping</code>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Folder API Endpoints</CardTitle>
                        <CardDescription>
                            You can also manage folders via Zapier using the following endpoints.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="p-4 border rounded-lg">
                                <h4 className="font-medium">Get All Folders</h4>
                                <p className="text-sm text-muted-foreground mb-2">Method: GET</p>
                                <code className="text-xs bg-muted p-1 rounded">https://triggeredapp.com/api/v1/folders</code>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <h4 className="font-medium">Create Folder</h4>
                                <p className="text-sm text-muted-foreground mb-2">Method: POST</p>
                                <code className="text-xs bg-muted p-1 rounded">https://triggeredapp.com/api/v1/folders</code>
                                <p className="text-xs text-muted-foreground mt-2">Body: {`{ "name": "Folder Name" }`}</p>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <h4 className="font-medium">Get Folder</h4>
                                <p className="text-sm text-muted-foreground mb-2">Method: GET</p>
                                <code className="text-xs bg-muted p-1 rounded">https://triggeredapp.com/api/v1/folders/:id</code>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <h4 className="font-medium">Update Folder</h4>
                                <p className="text-sm text-muted-foreground mb-2">Method: PUT</p>
                                <code className="text-xs bg-muted p-1 rounded">https://triggeredapp.com/api/v1/folders/:id</code>
                                <p className="text-xs text-muted-foreground mt-2">Body: {`{ "name": "New Name" }`}</p>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <h4 className="font-medium">Delete Folder</h4>
                                <p className="text-sm text-muted-foreground mb-2">Method: DELETE</p>
                                <code className="text-xs bg-muted p-1 rounded">https://triggeredapp.com/api/v1/folders/:id</code>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
