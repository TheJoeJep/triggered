"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

interface UpgradeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
}

export function UpgradeDialog({
    open,
    onOpenChange,
    title = "Upgrade Required",
    description = "You've reached the limits of your current plan. Upgrade to unlock more features and higher limits.",
}: UpgradeDialogProps) {
    const router = useRouter();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                        <p>
                            Upgrading gives you:
                        </p>
                        <ul className="list-disc pl-4 mt-2 space-y-1">
                            <li>More triggers</li>
                            <li>Faster execution intervals</li>
                            <li>Higher monthly execution limits</li>
                        </ul>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={() => {
                        onOpenChange(false);
                        router.push("/settings?tab=billing");
                    }}>
                        View Plans
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
