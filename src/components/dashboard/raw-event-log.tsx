
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ExecutionLog } from "@/lib/types";
import { format } from "date-fns";

type FlattenedLog = ExecutionLog & {
    triggerName: string;
    triggerId: string;
};

type RawEventLogProps = {
  logs: FlattenedLog[];
};

export function RawEventLog({ logs }: RawEventLogProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Raw Event Log</CardTitle>
        <CardDescription>A chronological stream of all trigger execution events.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border h-96 overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[200px]">Timestamp</TableHead>
                <TableHead>Trigger Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">
                      {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss.SSS")}
                    </TableCell>
                    <TableCell className="font-medium">{log.triggerName}</TableCell>
                    <TableCell>
                      <Badge variant={log.status === 'success' ? 'default' : 'destructive'} className="capitalize">
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                        {log.status === 'success' ? `Responded with HTTP ${log.responseStatus}` : log.error}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No trigger events recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
