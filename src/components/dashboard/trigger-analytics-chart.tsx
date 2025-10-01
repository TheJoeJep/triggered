
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import type { Trigger } from '@/lib/types';
import { format, startOfMinute, startOfHour, startOfDay, sub, eachDayOfInterval, eachHourOfInterval, eachMinuteOfInterval } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

type TriggerAnalyticsChartProps = {
    allTriggers: Trigger[];
};

type ChartData = {
    date: string; // This will be the formatted timestamp
    timestamp: number; // This will be the raw timestamp for sorting
    [triggerId: string]: number | string;
};

type Timeframe = 'minute' | 'hourly' | 'daily';
type TimeWindowUnit = 'hours' | 'days' | 'weeks' | 'months';


const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
};

function TriggerControls({ 
    allTriggers, 
    hiddenTriggers, 
    setHiddenTriggers, 
    triggerColors, 
    setTriggerColors,
    timeframe,
    setTimeframe,
    yAxisMax,
    setYAxisMax,
    timeWindowValue,
    setTimeWindowValue,
    timeWindowUnit,
    setTimeWindowUnit,
}: any) {
    const toggleTriggerVisibility = (triggerId: string) => {
        setHiddenTriggers((prev: any) => {
            const newSet = new Set(prev);
            if (newSet.has(triggerId)) {
                newSet.delete(triggerId);
            } else {
                newSet.add(triggerId);
            }
            return newSet;
        });
    };

    const handleColorChange = (triggerId: string, color: string) => {
        setTriggerColors((prev: any) => ({ ...prev, [triggerId]: color }));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Chart Controls</CardTitle>
                <CardDescription>Configure the chart's display and toggle trigger visibility.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label>Time Window</Label>
                        <div className="flex gap-2">
                            <Input 
                                id="time-window-value"
                                type="number"
                                value={timeWindowValue}
                                onChange={(e) => setTimeWindowValue(Number(e.target.value))}
                                placeholder="e.g. 7"
                                className="w-24"
                            />
                             <Select value={timeWindowUnit} onValueChange={setTimeWindowUnit}>
                                <SelectTrigger id="time-window-unit">
                                    <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hours">Hours</SelectItem>
                                    <SelectItem value="days">Days</SelectItem>
                                    <SelectItem value="weeks">Weeks</SelectItem>
                                    <SelectItem value="months">Months</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="group-by">Group By</Label>
                        <Select value={timeframe} onValueChange={setTimeframe}>
                            <SelectTrigger id="group-by">
                                <SelectValue placeholder="Select timeframe" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="hourly">Hourly</SelectItem>
                                <SelectItem value="minute">Minute</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                 <div className="space-y-2">
                    <Label htmlFor="y-axis-max">Y-Axis Max</Label>
                    <Input 
                        id="y-axis-max"
                        type="number"
                        value={yAxisMax}
                        onChange={(e) => setYAxisMax(e.target.value === '' ? 'auto' : Number(e.target.value))}
                        placeholder="auto"
                    />
                </div>
                
                 <div className="space-y-2">
                    <Label>Trigger Visibility</Label>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 rounded-md border p-2">
                        {allTriggers.length > 0 ? allTriggers.map((trigger: Trigger) => (
                            <div key={trigger.id} className="flex items-center justify-between p-2">
                                <span className="text-sm font-medium">{trigger.name}</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={triggerColors[trigger.id] || '#000000'}
                                        onChange={(e) => handleColorChange(trigger.id, e.target.value)}
                                        className="w-8 h-8 p-0 border-none rounded-md cursor-pointer"
                                        style={{ backgroundColor: triggerColors[trigger.id] || '#000000' }}
                                        title={`Change color for ${trigger.name}`}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => toggleTriggerVisibility(trigger.id)}
                                        className="h-8 w-8"
                                        title={hiddenTriggers.has(trigger.id) ? `Show ${trigger.name}` : `Hide ${trigger.name}`}
                                    >
                                        {hiddenTriggers.has(trigger.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No triggers found.</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}


export function TriggerAnalyticsChart({ allTriggers }: TriggerAnalyticsChartProps) {
    const [hiddenTriggers, setHiddenTriggers] = useState<Set<string>>(new Set());
    const [triggerColors, setTriggerColors] = useState<Record<string, string>>({});
    const [timeframe, setTimeframe] = useState<Timeframe>('daily');
    const [yAxisMax, setYAxisMax] = useState<number | 'auto'>(100);
    const [timeWindowValue, setTimeWindowValue] = useState<number>(7);
    const [timeWindowUnit, setTimeWindowUnit] = useState<TimeWindowUnit>('days');


    useEffect(() => {
        const initialColors: Record<string, string> = {};
        allTriggers.forEach(trigger => {
            initialColors[trigger.id] = stringToColor(trigger.id + trigger.name);
        });
        setTriggerColors(initialColors);
    }, [allTriggers]);

    const chartData = useMemo(() => {
        const now = new Date();
        const windowStartDate = sub(now, { [timeWindowUnit]: timeWindowValue });

        const getGroupKey = (date: Date): Date => {
            switch(timeframe) {
                case 'minute': return startOfMinute(date);
                case 'hourly': return startOfHour(date);
                case 'daily': 
                default:
                    return startOfDay(date);
            }
        }
        
        // 1. Initialize data points for the entire time window with 0 counts
        const timelineData: { [timestamp: number]: { [triggerId: string]: number } } = {};
        
        const interval = { start: windowStartDate, end: now };
        let dateArray: Date[] = [];

        try {
             switch (timeframe) {
                case 'minute':
                    dateArray = eachMinuteOfInterval(interval);
                    break;
                case 'hourly':
                    dateArray = eachHourOfInterval(interval);
                    break;
                case 'daily':
                default:
                    dateArray = eachDayOfInterval(interval);
                    break;
            }
        } catch (error) {
            console.error("Error creating date interval:", error);
            dateArray = [];
        }


        dateArray.forEach(date => {
            const timestamp = getGroupKey(date).getTime();
            if (!timelineData[timestamp]) {
                timelineData[timestamp] = {};
                allTriggers.forEach(trigger => {
                    timelineData[timestamp][trigger.id] = 0;
                });
            }
        });

        // 2. Aggregate actual execution data
        allTriggers.forEach(trigger => {
            if (trigger.executionHistory) {
                trigger.executionHistory.forEach(log => {
                    const logDate = new Date(log.timestamp);
                    if (log.status === 'success' && logDate >= windowStartDate) {
                        const groupKey = getGroupKey(logDate);
                        const timestamp = groupKey.getTime();

                        if (timelineData[timestamp]) {
                           if (!timelineData[timestamp][trigger.id]) {
                                timelineData[timestamp][trigger.id] = 0;
                           }
                           timelineData[timestamp][trigger.id]++;
                        }
                    }
                });
            }
        });

        // 3. Format for recharts
        const getFormatString = () => {
            switch(timeframe) {
                case 'minute': return 'MMM d, HH:mm';
                case 'hourly': return 'MMM d, HH:00';
                case 'daily': 
                default:
                    return 'yyyy-MM-dd';
            }
        }

        const formattedData: ChartData[] = Object.keys(timelineData)
            .map(timestampStr => {
                const timestamp = Number(timestampStr);
                const entry: ChartData = { 
                    date: format(new Date(timestamp), getFormatString()),
                    timestamp: timestamp,
                    ...timelineData[timestamp] // Add all trigger counts
                };
                return entry;
            }).sort((a, b) => a.timestamp - b.timestamp);

        return formattedData;
    }, [allTriggers, timeframe, timeWindowValue, timeWindowUnit]);

    const hasActivations = useMemo(() => 
        chartData.some(d => Object.keys(d).some(key => key !== 'date' && key !== 'timestamp' && d[key] > 0)),
    [chartData]);

    if (allTriggers.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Trigger Activations</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="h-96 flex items-center justify-center text-muted-foreground">
                        No triggers found in this organization. Create one to see analytics.
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Trigger Activations</CardTitle>
                    <CardDescription>A line chart showing successful trigger activations over time.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-96 w-full relative">
                        <ResponsiveContainer>
                            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} domain={[0, yAxisMax]} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--background))',
                                        borderColor: 'hsl(var(--border))',
                                        fontSize: '12px'
                                    }}
                                />
                                {allTriggers.map(trigger => (
                                    !hiddenTriggers.has(trigger.id) && (
                                        <Line
                                            key={trigger.id}
                                            type="monotone"
                                            dataKey={trigger.id}
                                            name={trigger.name}
                                            stroke={triggerColors[trigger.id] || '#8884d8'}
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    )
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                        {!hasActivations && (
                             <div className="absolute inset-0 flex items-center justify-center text-muted-foreground -z-10 pointer-events-none">
                                No successful trigger activations recorded for this time window.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <TriggerControls 
                allTriggers={allTriggers}
                hiddenTriggers={hiddenTriggers}
                setHiddenTriggers={setHiddenTriggers}
                triggerColors={triggerColors}
                setTriggerColors={setTriggerColors}
                timeframe={timeframe}
                setTimeframe={setTimeframe}
                yAxisMax={yAxisMax}
                setYAxisMax={setYAxisMax}
                timeWindowValue={timeWindowValue}
                setTimeWindowValue={setTimeWindowValue}
                timeWindowUnit={timeWindowUnit}
                setTimeWindowUnit={setTimeWindowUnit}
            />
        </div>
    );
}
