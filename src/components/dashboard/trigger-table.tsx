"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Play,
  Pause,
  Trash2,
  Edit,
  Code2,
  PlayCircle,
  History,
  RefreshCw,
  PlusCircle,
  Search,
  Filter
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { Trigger, TriggerStatus, Schedule } from "@/lib/types";
import { TimeCountdown } from "./time-countdown";

type TriggerTableProps = {
  triggers: Trigger[];
  selectedTriggerId: string | null;
  onRowClick: (trigger: Trigger) => void;
  onEdit: (trigger: Trigger) => void;
  onDuplicate: (trigger: Trigger) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TriggerStatus) => void;
  onTest: (trigger: Trigger) => void;
  onShowHistory: (trigger: Trigger) => void;
  onReset: (trigger: Trigger) => void;
};


function formatSchedule(schedule: Schedule) {
  switch (schedule.type) {
    case "one-time":
      return "One-time";
    case "interval":
      return `Every ${schedule.amount} ${schedule.unit}`;
  }
}


export function TriggerTable({
  triggers,
  selectedTriggerId,
  onRowClick,
  onEdit,
  onDuplicate,
  onDelete,
  onStatusChange,
  onTest,
  onShowHistory,
  onReset,
}: TriggerTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TriggerStatus | "all">("all");

  const getStatusBadge = (status: TriggerStatus) => {
    let badgeVariant: "default" | "secondary" | "destructive" | "outline" =
      "default";
    switch (status) {
      case "active":
        badgeVariant = "default";
        break;
      case "paused":
        badgeVariant = "secondary";
        break;
      case "completed":
        badgeVariant = "outline";
        break;
      case "failed":
        badgeVariant = "destructive";
        break;
      case "archived":
        badgeVariant = "secondary";
        break;
    }
    return (
      <Badge variant={badgeVariant} className="capitalize">
        {status}
      </Badge>
    );
  };

  const filteredTriggers = triggers.filter(trigger => {
    const matchesSearch = trigger.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trigger.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || trigger.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search triggers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TriggerStatus | "all")}>
            <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-black/90 border-white/10 text-white backdrop-blur-xl">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border border-white/10">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-white/5 border-white/10">
                <TableHead className="w-[200px] sm:w-[250px] text-gray-400">Name</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="hidden md:table-cell text-gray-400">Schedule</TableHead>
                <TableHead className="hidden lg:table-cell text-gray-400">Runs</TableHead>
                <TableHead className="hidden sm:table-cell text-gray-400">Next Run</TableHead>
                <TableHead className="text-right text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTriggers.length > 0 ? (
                filteredTriggers.map((trigger) => (
                  <TableRow
                    key={trigger.id}
                    data-state={trigger.id === selectedTriggerId ? 'selected' : 'unselected'}
                    onClick={() => onRowClick(trigger)}
                    className="cursor-pointer hover:bg-white/5 border-white/10 data-[state=selected]:bg-white/10"
                  >
                    <TableCell className="font-medium text-white">
                      <div className="flex flex-col">
                        <span>{trigger.name}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs border-white/20 text-gray-400">{trigger.method}</Badge>
                          <span className="max-w-[200px] truncate font-mono text-gray-500">
                            {trigger.url}
                          </span>
                          {trigger.payload && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button onClick={(e) => e.stopPropagation()}><Code2 className="h-3 w-3 text-gray-500 hover:text-white transition-colors" /></button>
                              </TooltipTrigger>
                              <TooltipContent align="start" className="max-w-xs bg-black/90 border-white/10 text-white">
                                <pre className="text-xs whitespace-pre-wrap break-all">
                                  {JSON.stringify(trigger.payload, null, 2)}
                                </pre>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(trigger.status)}</TableCell>
                    <TableCell className="hidden capitalize md:table-cell text-gray-300">
                      {formatSchedule(trigger.schedule)}
                      {trigger.limit && ` (limit: ${trigger.limit})`}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-gray-300">
                      <div className="flex items-center gap-2">
                        <span>{trigger.runCount || 0}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/10 hover:text-white" onClick={(e) => { e.stopPropagation(); onShowHistory(trigger); }}>
                              <History className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-black/90 border-white/10 text-white">View Execution History</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-gray-300">
                      <TimeCountdown nextRun={trigger.nextRun} status={trigger.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {trigger.status === 'active' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10" onClick={(e) => { e.stopPropagation(); onStatusChange(trigger.id, 'paused'); }}>
                                <Pause className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-black/90 border-white/10 text-white">Pause Trigger</TooltipContent>
                          </Tooltip>
                        )}
                        {trigger.status === 'paused' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10" onClick={(e) => { e.stopPropagation(); onStatusChange(trigger.id, 'active'); }}>
                                <Play className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-black/90 border-white/10 text-white">Resume Trigger</TooltipContent>
                          </Tooltip>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-white/10 hover:text-white" onClick={(e) => e.stopPropagation()}>
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()} className="bg-black/90 border-white/10 text-white backdrop-blur-xl">
                            <DropdownMenuItem onClick={() => onTest(trigger)} className="focus:bg-white/10 focus:text-white cursor-pointer">
                              <PlayCircle className="mr-2 h-4 w-4" />
                              <span>Test Trigger</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem onClick={() => onEdit(trigger)} className="focus:bg-white/10 focus:text-white cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDuplicate(trigger)} className="focus:bg-white/10 focus:text-white cursor-pointer">
                              <PlusCircle className="mr-2 h-4 w-4" />
                              <span>Duplicate</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onReset(trigger)} className="focus:bg-white/10 focus:text-white cursor-pointer">
                              <RefreshCw className="mr-2 h-4 w-4" />
                              <span>Reset to next minute</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onShowHistory(trigger)} className="focus:bg-white/10 focus:text-white cursor-pointer">
                              <History className="mr-2 h-4 w-4" />
                              <span>History</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                              onClick={() => onDelete(trigger.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent border-white/10">
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {searchTerm || statusFilter !== 'all'
                      ? "No triggers match your search."
                      : "No triggers found. Create one to get started!"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
}
