
"use client"

import React, { useState } from "react";
import {
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarSeparator,
    SidebarGroupLabel,
    SidebarGroupAction,
    useSidebar,
    SidebarMenuAction,
} from "@/components/ui/sidebar";
import { Folder, LogOut, Settings, Plus, Trash2, LayoutDashboard, Code, ChevronsLeft, BarChart, CreditCard } from "lucide-react";
import { useSelectedFolder } from "@/hooks/use-selected-folder";
import { useAuth } from "@/hooks/use-auth";
import { AddFolderDialog } from "./add-folder-dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { useRouter, usePathname } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useOrganizations } from "@/hooks/use-organizations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Button } from "../ui/button";


export function FolderList() {
    const { selectedOrganization, addFolder, deleteFolder, loading: orgLoading } = useOrganizations();
    const { selectedFolderId, setSelectedFolderId } = useSelectedFolder();
    const { user, signOut } = useAuth();
    const { toggleSidebar, state } = useSidebar();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();


    const folders = selectedOrganization?.folders || [];

    const handleAddFolder = async (name: string) => {
        if (!selectedOrganization) {
            toast({
                title: "No Organization Selected",
                description: "You must be in an organization to add a folder.",
                variant: "destructive"
            });
            return;
        }
        await addFolder(name);
        toast({
            title: "Folder Created",
            description: `The "${name}" folder has been successfully created.`,
        });
    };

    const handleDeleteFolder = async (folderId: string) => {
        await deleteFolder(folderId);
        // If the deleted folder was the one being viewed, go back to dashboard
        if (selectedFolderId === folderId) {
            setSelectedFolderId(null);
            router.push('/');
        }
        toast({
            title: "Folder Deleted",
            description: "The folder has been deleted.",
            variant: "destructive"
        });
    };

    const handleDashboardClick = () => {
        setSelectedFolderId(null);
        router.push('/');
    };



    return (
        <>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/')} className="h-auto py-2" tooltip="Profile">
                            <Avatar className="h-7 w-7">
                                <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} />
                                <AvatarFallback>
                                    {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <span className="font-semibold">{user?.displayName || user?.email}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarSeparator />
            <SidebarContent>
                <SidebarGroup>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                isActive={pathname === '/' && selectedFolderId === null}
                                onClick={handleDashboardClick}
                                tooltip="Dashboard"
                            >
                                <LayoutDashboard />
                                <span>Dashboard</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton isActive={pathname === '/analytics'} onClick={() => router.push('/analytics')} tooltip="Analytics">
                                <BarChart />
                                <span>Analytics</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
                <SidebarSeparator />
                <SidebarGroup>
                    <SidebarGroupLabel className="flex items-center justify-between">
                        <span>Folders</span>
                        <SidebarGroupAction asChild>
                            <button onClick={() => setIsAddDialogOpen(true)} disabled={!selectedOrganization || orgLoading}>
                                <Plus />
                                <span className="sr-only">Add Folder</span>
                            </button>
                        </SidebarGroupAction>
                    </SidebarGroupLabel>
                    <SidebarMenu>
                        {orgLoading ? (
                            [...Array(3)].map((_, i) => (
                                <SidebarMenuItem key={i}>
                                    <SidebarMenuButton>
                                        <Folder />
                                        <div className="h-4 w-32 rounded bg-muted-foreground/20 animate-pulse" />
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))
                        ) : folders.length > 0 ? folders.map((folder) => (
                            <SidebarMenuItem key={folder.id}>
                                <SidebarMenuButton
                                    isActive={folder.id === selectedFolderId}
                                    onClick={() => {
                                        setSelectedFolderId(folder.id);
                                        router.push('/');
                                    }}
                                    tooltip={folder.name}
                                >
                                    <Folder />
                                    <span>{folder.name}</span>
                                </SidebarMenuButton>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <SidebarMenuAction showOnHover>
                                            <Trash2 className="text-destructive/70 hover:text-destructive" />
                                            <span className="sr-only">Delete Folder</span>
                                        </SidebarMenuAction>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the folder and all the triggers inside it.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteFolder(folder.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </SidebarMenuItem>
                        )) : (
                            selectedOrganization && <div className="px-2 text-sm text-muted-foreground group-data-[collapsible=icon]:hidden">No folders yet.</div>
                        )}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarSeparator />
            <SidebarFooter>
                <SidebarMenu>

                    <SidebarMenuItem>
                        <SidebarMenuButton isActive={pathname === '/settings'} onClick={() => router.push('/settings')} tooltip="Settings">
                            <Settings />
                            <span>Settings</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton isActive={pathname === '/dashboard/billing'} onClick={() => router.push('/dashboard/billing')} tooltip="Billing">
                            <CreditCard />
                            <span>Billing</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton isActive={pathname === '/docs'} tooltip="API Docs" asChild>
                            <a href="/docs" target="_blank" rel="noopener noreferrer">
                                <Code />
                                <span className="group-data-[collapsible=icon]:hidden">API Docs</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={signOut} tooltip="Sign Out">
                            <LogOut />
                            <span>Sign Out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <SidebarSeparator />
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={toggleSidebar} tooltip={state === 'expanded' ? 'Collapse' : 'Expand'}>
                            <ChevronsLeft />
                            <span>Collapse</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <AddFolderDialog isOpen={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAddFolder={handleAddFolder} />
        </>
    );
}
