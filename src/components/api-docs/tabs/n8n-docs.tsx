"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2 w-full sm:w-auto">
            <Copy className="h-4 w-4" />
            Copy n8n Node JSON
        </Button>
    );
};

export function N8nDocs() {
    return (
        <div className="space-y-12">
            <div id="introduction">
                <h2 className="text-3xl font-bold tracking-tight font-headline">n8n Integration</h2>
                <p className="text-muted-foreground mt-2">
                    Easily integrate Triggered App with your n8n workflows using the HTTP Request node.
                </p>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Setup</CardTitle>
                        <CardDescription>
                            Copy the pre-configured node JSON below and paste it directly into your n8n canvas (Ctrl+V / Cmd+V).
                            Remember to replace `YOUR_API_KEY` with your actual API key.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="p-4 border rounded-lg space-y-3">
                                <h4 className="font-medium">Get All Triggers</h4>
                                <p className="text-sm text-muted-foreground">Retrieve a list of all your triggers.</p>
                                <CopyN8nButton method="GET" url="/api/v1/triggers" />
                            </div>

                            <div className="p-4 border rounded-lg space-y-3">
                                <h4 className="font-medium">Create Trigger</h4>
                                <p className="text-sm text-muted-foreground">Create a new scheduled trigger.</p>
                                <CopyN8nButton
                                    method="POST"
                                    url="/api/v1/triggers"
                                    body={`{ "name": "n8n Trigger", "url": "https://...", "method": "POST", "schedule": { "type": "daily" }, "nextRun": "${new Date().toISOString()}" }`}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <h3 className="text-2xl font-bold tracking-tight">Manual Configuration</h3>
                    <p>If you prefer to configure the HTTP Request node manually:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                        <li>Add an <strong>HTTP Request</strong> node to your workflow.</li>
                        <li>Set the <strong>Method</strong> (GET, POST, etc.).</li>
                        <li>Set the <strong>URL</strong> to `https://triggeredapp.com/api/v1/...`.</li>
                        <li>Under <strong>Authentication</strong>, select <strong>Generic Credential Type</strong> &rarr; <strong>Header Auth</strong>.</li>
                        <li>Create a new credential with name `Authorization` and value `Bearer YOUR_API_KEY`.</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
