"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function MakeDocs() {
    return (
        <div className="space-y-12">
            <div id="introduction">
                <h2 className="text-3xl font-bold tracking-tight font-headline">Make (Integromat) Integration</h2>
                <p className="text-muted-foreground mt-2">
                    Automate your workflows by connecting Triggered App with Make.
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
                            In Make's <strong>HTTP</strong> module, add a header:
                        </p>
                        <ul className="list-disc list-inside ml-4 text-sm text-muted-foreground">
                            <li><strong>Name:</strong> Authorization</li>
                            <li><strong>Value:</strong> Bearer YOUR_API_KEY</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Using the HTTP Module</CardTitle>
                        <CardDescription>
                            Use Make's native HTTP module to make authenticated requests to the Triggered App API.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ol className="list-decimal list-inside space-y-4">
                            <li>
                                Create a new scenario and add the <strong>HTTP</strong> module.
                            </li>
                            <li>
                                Select <strong>Make a request</strong>.
                            </li>
                            <li>
                                In the <strong>URL</strong> field, enter the API endpoint (e.g., `https://triggeredapp.com/api/v1/triggers`).
                            </li>
                            <li>
                                Set the <strong>Method</strong> (e.g., POST, GET).
                            </li>
                            <li>
                                Add a <strong>Header</strong>:
                                <ul className="list-disc list-inside ml-6 mt-2 text-sm text-muted-foreground">
                                    <li><strong>Name</strong>: `Authorization`</li>
                                    <li><strong>Value</strong>: `Bearer YOUR_API_KEY`</li>
                                </ul>
                            </li>
                            <li>
                                For POST/PUT requests, set <strong>Body type</strong> to `Raw` and <strong>Content type</strong> to `JSON (application/json)`.
                            </li>
                            <li>
                                Enter your JSON payload in the <strong>Request content</strong> field.
                            </li>
                        </ol>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Folder API Endpoints</CardTitle>
                        <CardDescription>
                            You can also manage folders via Make using the following endpoints.
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
