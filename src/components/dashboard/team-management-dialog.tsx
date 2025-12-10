
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Organization, Member, Role } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2, Loader2, Shield } from "lucide-react";

type TeamManagementDialogProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    organization: Organization;
    onAddMember: (email: string, role: Role) => Promise<void>;
    onRemoveMember: (uid: string) => Promise<void>;
    onUpdateRole: (uid: string, role: Role) => Promise<void>;
    currentUserId: string | undefined;
};

export function TeamManagementDialog({
    isOpen,
    onOpenChange,
    organization,
    onAddMember,
    onRemoveMember,
    onUpdateRole,
    currentUserId
}: TeamManagementDialogProps) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<Role>("editor");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onAddMember(email, role);
            setEmail("");
            toast({ title: "Member Added", description: `${email} has been added to the team.` });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const isOwner = organization.members.find(m => m.uid === currentUserId)?.role === 'owner';

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Manage Team</DialogTitle>
                    <DialogDescription>
                        Invite team members and manage their roles.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Invite Form */}
                    {isOwner && (
                        <form onSubmit={handleAdd} className="flex gap-2 items-end">
                            <div className="grid gap-1 flex-1">
                                <label className="text-sm font-medium">Email Address</label>
                                <Input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="colleague@example.com"
                                    type="email"
                                    required
                                />
                            </div>
                            <div className="grid gap-1 w-24">
                                <label className="text-sm font-medium">Role</label>
                                <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="viewer">Viewer</SelectItem>
                                        <SelectItem value="editor">Editor</SelectItem>
                                        <SelectItem value="owner">Owner</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Invite"}
                            </Button>
                        </form>
                    )}

                    {/* Members List */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wider">Members</h3>
                        <div className="space-y-2">
                            {organization.members.map((member) => (
                                <div key={member.uid} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={member.photoURL || undefined} />
                                            <AvatarFallback>{member.displayName ? member.displayName[0] : member.email ? member.email[0] : 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium leading-none">{member.displayName || member.email}</p>
                                            <p className="text-xs text-muted-foreground">{member.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isOwner && member.uid !== currentUserId ? (
                                            <Select
                                                value={member.role}
                                                onValueChange={(v) => onUpdateRole(member.uid, v as Role)}
                                            >
                                                <SelectTrigger className="h-7 w-20 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="viewer">Viewer</SelectItem>
                                                    <SelectItem value="editor">Editor</SelectItem>
                                                    <SelectItem value="owner">Owner</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="text-xs px-2 py-1 bg-white/10 rounded capitalize flex items-center gap-1">
                                                {member.role === 'owner' && <Shield className="h-3 w-3" />}
                                                {member.role}
                                            </div>
                                        )}

                                        {isOwner && member.uid !== currentUserId && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                onClick={() => onRemoveMember(member.uid)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
