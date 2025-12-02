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
            </div>
        </div>
    );
}
