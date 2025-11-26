
"use client";

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
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import type { Trigger, TriggerStatus, Schedule } from "@/lib/types";
import { TimeCountdown } from "./time-countdown";

type TriggerTableProps = {
  triggers: Trigger[];
  selectedTriggerId: string | null;
  onRowClick: (trigger: Trigger) => void;
  onEdit: (trigger: Trigger) => void;
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
  onDelete,
  onStatusChange,
  onTest,
  onShowHistory,
  onReset,
}: TriggerTableProps) {

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

  return (
    <TooltipProvider>
      <div className="rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px] sm:w-[250px]">Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Schedule</TableHead>
              <TableHead className="hidden lg:table-cell">Runs</TableHead>
              <TableHead className="hidden sm:table-cell">Next Run</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {triggers.length > 0 ? (
              triggers.map((trigger) => (
                <TableRow
                  key={trigger.id}
                  data-state={trigger.id === selectedTriggerId ? 'selected' : 'unselected'}
                  onClick={() => onRowClick(trigger)}
                  className="cursor-pointer"
                >
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{trigger.name}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">{trigger.method}</Badge>
                        <span className="max-w-[200px] truncate font-mono">
                          {trigger.url}
                        </span>
                        {trigger.payload && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button><Code2 className="h-4 w-4" /></button>
                            </TooltipTrigger>
                            <TooltipContent align="start" className="max-w-xs">
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
                  <TableCell className="hidden capitalize md:table-cell">
                    {formatSchedule(trigger.schedule)}
                    {trigger.limit && ` (limit: ${trigger.limit})`}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <span>{trigger.runCount || 0}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onShowHistory(trigger); }}>
                            <History className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View Execution History</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <TimeCountdown nextRun={trigger.nextRun} status={trigger.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {trigger.status === 'active' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); onStatusChange(trigger.id, 'paused'); }}>
                              <Pause className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Pause Trigger</TooltipContent>
                        </Tooltip>
                      )}
                      {trigger.status === 'paused' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); onStatusChange(trigger.id, 'active'); }}>
                              <Play className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Resume Trigger</TooltipContent>
                        </Tooltip>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => onTest(trigger)}>
                            <PlayCircle className="mr-2 h-4 w-4" />
                            <span>Test Trigger</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onEdit(trigger)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onReset(trigger)}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            <span>Reset to next minute</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onShowHistory(trigger)}>
                            <History className="mr-2 h-4 w-4" />
                            <span>History</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
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
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No triggers found. Create one to get started!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
