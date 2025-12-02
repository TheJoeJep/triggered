"use client";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Hash } from "lucide-react";

const items = [
    {
        title: "Introduction",
        url: "#introduction",
    },
    {
        title: "Authentication",
        url: "#authentication",
    },
    {
        title: "Base URL",
        url: "#base-url",
    },
    {
        title: "Triggers",
        items: [
            { title: "Get All Triggers", url: "#get-all-triggers" },
            { title: "Create Trigger", url: "#create-trigger" },
            { title: "Get Trigger", url: "#get-trigger" },
            { title: "Update Trigger", url: "#update-trigger" },
            { title: "Delete Trigger", url: "#delete-trigger" },
            { title: "Ping Trigger", url: "#ping-trigger" },
        ]
    },
    {
        title: "Folders",
        items: [
            { title: "Get All Folders", url: "#get-all-folders" },
            { title: "Create Folder", url: "#create-folder" },
            { title: "Get Folder", url: "#get-folder" },
            { title: "Update Folder", url: "#update-folder" },
            { title: "Delete Folder", url: "#delete-folder" },
        ]
    }
];

export function DocSidebar() {
    const gettingStartedItems = items.filter(item => !item.items);
    const groupedItems = items.filter(item => item.items);

    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Getting Started</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {gettingStartedItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <a href={item.url}>
                                            <Hash className="mr-2 h-4 w-4" />
                                            <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {groupedItems.map((group) => (
                    <SidebarGroup key={group.title}>
                        <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items?.map((subItem) => (
                                    <SidebarMenuItem key={subItem.title}>
                                        <SidebarMenuButton asChild>
                                            <a href={subItem.url}>
                                                <Hash className="mr-2 h-4 w-4" />
                                                <span className="group-data-[collapsible=icon]:hidden">{subItem.title}</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
        </Sidebar>
    );
}
