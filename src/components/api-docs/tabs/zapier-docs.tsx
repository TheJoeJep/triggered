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
            </div>
        </div>
    );
}
