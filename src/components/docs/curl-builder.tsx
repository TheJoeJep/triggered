"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CurlBuilder() {
    const [method, setMethod] = useState("POST");
    const [endpoint, setEndpoint] = useState("/triggers");
    const [apiKey, setApiKey] = useState("YOUR_API_KEY");
    const [body, setBody] = useState(`{\n  "name": "My Trigger",\n  "url": "https://example.com/webhook",\n  "method": "POST",\n  "schedule": { "type": "daily" },\n  "nextRun": "${new Date().toISOString()}"\n}`);
    const { toast } = useToast();

    const generateCurl = () => {
        let curl = `curl -X ${method} "https://triggeredapp.com/api/v1${endpoint}" \\\n`;
        curl += `  -H "Authorization: Bearer ${apiKey}" \\\n`;
        curl += `  -H "Content-Type: application/json"`;

        if (method !== "GET" && method !== "DELETE" && body) {
            curl += ` \\\n  -d '${body.replace(/'/g, "'\\''")}'`;
        }

        return curl;
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generateCurl());
        toast({
            title: "Copied to clipboard",
            description: "cURL command copied to clipboard.",
        });
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Request Builder</CardTitle>
                <CardDescription>Generate a cURL command to test the API.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2 md:col-span-1">
                        <Label>Method</Label>
                        <Select value={method} onValueChange={setMethod}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="GET">GET</SelectItem>
                                <SelectItem value="POST">POST</SelectItem>
                                <SelectItem value="PUT">PUT</SelectItem>
                                <SelectItem value="DELETE">DELETE</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 md:col-span-3">
                        <Label>Endpoint</Label>
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-sm">/api/v1</span>
                            <Input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="/triggers" />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} type="password" placeholder="ta_..." />
                </div>

                {(method === "POST" || method === "PUT") && (
                    <div className="space-y-2">
                        <Label>Request Body (JSON)</Label>
                        <Textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            className="font-mono text-sm h-32"
                        />
                    </div>
                )}

                <div className="relative mt-4">
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm font-mono whitespace-pre-wrap break-all">
                        {generateCurl()}
                    </pre>
                    <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2"
                        onClick={handleCopy}
                    >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
