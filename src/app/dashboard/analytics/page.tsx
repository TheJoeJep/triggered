
"use client";

import { useState } from "react";
import { FolderList } from "@/components/dashboard/folder-list";
import { AnalyticsView } from "@/components/dashboard/analytics-view";

export default function AnalyticsPage() {
    return (
        <div className="flex h-screen bg-black text-white overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 border-r border-white/10 hidden md:block">
                <FolderList />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <AnalyticsView />
            </div>
        </div>
    );
}
