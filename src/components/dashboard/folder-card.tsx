
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Folder } from "lucide-react";
import type { Folder as FolderType } from "@/lib/types";

type FolderCardProps = {
    folder: FolderType;
    onClick: () => void;
};

export function FolderCard({ folder, onClick }: FolderCardProps) {
    const triggerCount = folder.triggers.length;

    return (
        <Card
            className="hover:shadow-[0_0_25px_rgba(255,95,31,0.3)] hover:border-primary transition-all cursor-pointer bg-black/40 backdrop-blur-md border-white/10"
            onClick={onClick}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{folder.name}</CardTitle>
                <Folder className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-sm text-muted-foreground">
                    {triggerCount} {triggerCount === 1 ? 'trigger' : 'triggers'}
                </div>
            </CardContent>
        </Card>
    );
}
