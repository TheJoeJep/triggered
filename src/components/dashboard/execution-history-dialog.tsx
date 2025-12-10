
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ExecutionLog } from "@/lib/types";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

type ExecutionHistoryDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  triggerId: string | null;
  organizationId: string | undefined;
  initialLogs?: ExecutionLog[]; // Optional fallback/initial
};

export function ExecutionHistoryDialog({
  isOpen,
  onOpenChange,
  triggerId,
  organizationId,
  initialLogs = [],
}: ExecutionHistoryDialogProps) {
  const [logs, setLogs] = useState<ExecutionLog[]>(initialLogs);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchLogs() {
      if (!isOpen || !triggerId || !organizationId) return;

      setLoading(true);
      try {
        const logsRef = collection(db, "organizations", organizationId, "triggers", triggerId, "logs");
        const q = query(logsRef, orderBy("timestamp", "desc"), limit(50));
        const snapshot = await getDocs(q);

        const fetchedLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExecutionLog));

        // Merge with initialLogs if needed? No, subcollection is source of truth.
        // But if subcollection is empty (legacy), we might want to fallback to initialLogs?
        // Let's check.
        if (fetchedLogs.length === 0 && initialLogs.length > 0) {
          setLogs(initialLogs);
        } else {
          setLogs(fetchedLogs);
        }

      } catch (error) {
        console.error("Failed to fetch logs:", error);
        // Fallback or leave as is
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, [isOpen, triggerId, organizationId, initialLogs]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Execution History</DialogTitle>
          <DialogDescription>
            {loading ? "Loading logs..." : `Showing the last ${logs.length} trigger executions.`}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-6 py-4">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) :
              logs.length > 0 ? (
                logs.map((log) => (
                  <div key={log.id} className="p-4 border border-white/10 bg-white/5 rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {log.timestamp ? format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss 'UTC'") : "Unknown Time"}
                        </h3>
                        {log.triggerMode && (
                          <Badge variant="outline" className="text-xs uppercase tracking-wider">
                            {log.triggerMode}
                          </Badge>
                        )}
                      </div>
                      <Badge
                        variant={
                          log.status === 'success' ? 'default' :
                            log.status === 'failed' ? 'destructive' :
                              'secondary' // for reset
                        }
                        className="capitalize"
                      >
                        {log.status} {log.responseStatus && `(${log.responseStatus})`}
                      </Badge>
                    </div>

                    {log.status === 'reset' && (
                      <div className="text-sm text-muted-foreground">
                        Trigger run count reset and scheduled for next minute.
                      </div>
                    )}

                    {log.requestPayload && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">Request Payload</h4>
                        <pre className="bg-black/50 p-2 rounded-md text-xs overflow-x-auto text-gray-300">
                          <code>{JSON.stringify(log.requestPayload, null, 2)}</code>
                        </pre>
                      </div>
                    )}

                    {log.responseBody && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">Response Body</h4>
                        <pre className="bg-black/50 p-2 rounded-md text-xs overflow-x-auto text-gray-300">
                          <code>{log.responseBody}</code>
                        </pre>
                      </div>
                    )}

                    {log.error && (
                      <div>
                        <h4 className="font-medium text-sm mb-1 text-destructive">Error</h4>
                        <p className="text-destructive text-xs">{log.error}</p>
                      </div>
                    )}

                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-16">
                  No execution history found.
                </div>
              )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
