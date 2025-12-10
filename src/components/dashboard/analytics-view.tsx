
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrganizations } from "@/hooks/use-organizations";
import { PLAN_LIMITS } from "@/lib/constants";
import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, TooltipProps } from "recharts";
import { format, subDays, parseISO } from "date-fns";

export function AnalyticsView() {
    const { selectedOrganization, loading } = useOrganizations();
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        if (!selectedOrganization) return;

        // Prepare data for the last 30 days
        const today = new Date();
        const data = [];
        const dailyExecutions = selectedOrganization.usage?.dailyExecutions || {};

        for (let i = 29; i >= 0; i--) {
            const date = subDays(today, i);
            const dateKey = format(date, "yyyy-MM-dd");
            data.push({
                date: format(date, "MMM dd"),
                executions: dailyExecutions[dateKey] || 0,
            });
        }

        setChartData(data);
    }, [selectedOrganization]);

    if (loading) {
        return <div className="p-4 text-white">Loading analytics...</div>;
    }

    if (!selectedOrganization) {
        return <div className="p-4 text-white">Select an organization to view analytics.</div>;
    }

    const planId = selectedOrganization.planId || 'free';
    const limits = PLAN_LIMITS[planId];
    const usage = selectedOrganization.usage?.executionsThisMonth || 0;
    const usagePercent = Math.min((usage / limits.executionsPerMonth) * 100, 100);

    // Calculate active and failed triggers (approx)
    // We can count triggers with status 'failed'
    const allTriggers = [
        ...(selectedOrganization.triggers || []),
        ...(selectedOrganization.folders || []).flatMap(f => f.triggers)
    ];

    // Note: Since we moved to subcollections, `selectedOrganization.triggers` might be outdated if useOrganizations doesn't hydrate deep enough
    // But our hook *does* hydrate them :)

    const activeCount = allTriggers.filter(t => t.status === 'active').length;
    const failedCount = allTriggers.filter(t => t.status === 'failed').length;
    const totalCount = allTriggers.length;

    return (
        <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto">
            <h1 className="text-2xl font-bold font-headline text-white">Analytics Dashboard</h1>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-black/40 border-white/10 backdrop-blur">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-200">
                            Monthly Usage
                        </CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{usage}</div>
                        <p className="text-xs text-muted-foreground">
                            / {limits.executionsPerMonth} executions ({usagePercent.toFixed(1)}%)
                        </p>
                        <div className="mt-2 h-1 w-full bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${usagePercent}%` }} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-black/40 border-white/10 backdrop-blur">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-200">
                            Active Triggers
                        </CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{activeCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Total triggers: {totalCount}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-black/40 border-white/10 backdrop-blur">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-200">
                            Failed Triggers
                        </CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <rect width="20" height="14" x="2" y="5" rx="2" />
                            <path d="M2 10h20" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${failedCount > 0 ? "text-red-500" : "text-white"}`}>
                            {failedCount}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Needs attention
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-black/40 border-white/10 backdrop-blur">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-200">
                            Plan
                        </CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold capitalize text-white">{planId}</div>
                        <p className="text-xs text-muted-foreground">
                            {limits.triggers === Infinity ? "Unlimited" : limits.triggers} triggers allowed
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 h-96">
                <Card className="col-span-4 bg-black/40 border-white/10 backdrop-blur">
                    <CardHeader>
                        <CardTitle>Executions over time</CardTitle>
                        <CardDescription>
                            Daily execution volume for the last 30 days.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <XAxis
                                    dataKey="date"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                Date
                                                            </span>
                                                            <span className="font-bold text-muted-foreground">
                                                                {label}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                Executions
                                                            </span>
                                                            <span className="font-bold">
                                                                {payload[0].value}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        }
                                        return null
                                    }}
                                />
                                <Bar
                                    dataKey="executions"
                                    fill="currentColor"
                                    radius={[4, 4, 0, 0]}
                                    className="fill-primary"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-3 bg-black/40 border-white/10 backdrop-blur">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Latest 10 executions across all triggers.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-[300px] overflow-auto pr-2">
                            {(() => {
                                const allLogs = allTriggers.flatMap(t =>
                                    (t.executionHistory || []).map(log => ({ ...log, triggerName: t.name }))
                                ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                    .slice(0, 10);

                                if (allLogs.length === 0) {
                                    return <div className="text-sm text-gray-400">No executions recorded yet.</div>;
                                }

                                return allLogs.map((log) => (
                                    <div key={log.id} className="flex items-center">
                                        <div className={`ml-4 space-y-1`}>
                                            <p className="text-sm font-medium leading-none text-white">{log.triggerName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(parseISO(log.timestamp), "MMM dd, HH:mm:ss")} -
                                                <span className={log.status === 'success' ? "text-green-400 ml-1" : "text-red-400 ml-1"}>
                                                    {log.status}
                                                </span>
                                            </p>
                                        </div>
                                        <div className="ml-auto font-medium text-xs text-gray-500">
                                            {log.responseStatus || '-'}
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
