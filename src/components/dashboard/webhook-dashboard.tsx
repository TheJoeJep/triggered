
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle, Users, Folder } from "lucide-react";
import { TriggerTable } from "@/components/dashboard/trigger-table";
import type { Trigger, TriggerStatus, ExecutionLog } from "@/lib/types";
import { CreateTriggerSheet } from "./create-trigger-sheet";
import { useToast } from "@/hooks/use-toast";
import { useSelectedFolder } from "@/hooks/use-selected-folder";
import { useOrganizations } from "@/hooks/use-organizations";
import { ExecutionHistoryDialog } from "./execution-history-dialog";
import { Separator } from "@/components/ui/separator";
import { FolderCard } from "./folder-card";

export function WebhookDashboard() {
  const { selectedOrganization, loading, addTriggerToFolder, addTriggerToOrganization, updateTrigger, deleteTrigger, updateTriggerStatus, testTrigger, resetTrigger } = useOrganizations();
  const { selectedFolderId, setSelectedFolderId } = useSelectedFolder();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState<Trigger | null>(null);
  const [highlightedTriggerId, setHighlightedTriggerId] = useState<string | null>(null);
  const [historyLogs, setHistoryLogs] = useState<ExecutionLog[]>([]);
  const { toast } = useToast();

  const folders = selectedOrganization?.folders || [];
  const topLevelTriggers = selectedOrganization?.triggers || [];

  useEffect(() => {
    if (loading || !selectedOrganization) return;

    if (selectedFolderId === undefined) {
      setSelectedFolderId(null);
    }
  }, [selectedOrganization, selectedFolderId, setSelectedFolderId, loading]);

  // Poll the cron endpoint in development mode to simulate the cron job
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        fetch('/api/cron')
          .then(res => res.json())
          .then(data => console.log('[DEV-POLLER] Cron triggered:', data))
          .catch(err => console.error('[DEV-POLLER] Cron trigger failed:', err));
      }, 10000); // Poll every 10 seconds

      return () => clearInterval(interval);
    }
  }, []);

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  const viewName = selectedFolder ? selectedFolder.name : selectedOrganization?.name || 'Dashboard';
  const canCreateTriggers = !!selectedOrganization;


  const handleCreateNew = () => {
    if (!canCreateTriggers) {
      toast({
        title: "No Organization Selected",
        description: "Please create or select an organization before adding a trigger.",
        variant: "destructive"
      });
      return;
    }
    setSelectedTrigger(null);
    setIsSheetOpen(true);
  };

  const handleEdit = (trigger: Trigger) => {
    setSelectedTrigger(trigger);
    setIsSheetOpen(true);
  };

  const handleRowClick = (trigger: Trigger) => {
    if (highlightedTriggerId === trigger.id) {
      // Second click, open edit sheet
      handleEdit(trigger);
    } else {
      // First click, just highlight
      setHighlightedTriggerId(trigger.id);
    }
  };

  const handleShowHistory = (trigger: Trigger) => {
    setHistoryLogs(trigger.executionHistory || []);
    setIsHistoryOpen(true);
  }

  const handleDelete = async (id: string) => {
    if (!selectedOrganization) return;
    await deleteTrigger(selectedFolderId, id);
    if (selectedFolderId && selectedFolder && selectedFolder.triggers.length === 1 && selectedFolder.triggers[0].id === id) {
      setSelectedFolderId(null);
    }
    toast({
      title: "Trigger Deleted",
      description: "The webhook trigger has been successfully deleted.",
      variant: "destructive"
    });
  };

  const handleSave = async (triggerData: Omit<Trigger, 'id' | 'status' | 'runCount' | 'executionHistory'>, folderId: string | null, id?: string) => {
    if (!selectedOrganization) return;

    try {
      if (id) {
        // Editing is simpler - we assume folder doesn't change.
        // A more complex implementation could handle moving triggers between folders.
        await updateTrigger(folderId, id, triggerData);
        toast({
          title: "Trigger Updated",
          description: "Your webhook trigger has been successfully updated.",
        });
      } else {
        if (folderId) {
          await addTriggerToFolder(folderId, triggerData);
        } else {
          await addTriggerToOrganization(triggerData);
        }
        toast({
          title: "Trigger Created",
          description: "Your new webhook trigger is now active.",
        });
      }
      setIsSheetOpen(false);
    } catch (error: any) {
      console.error("Failed to save trigger:", error);
      toast({
        title: "Error Saving Trigger",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (id: string, status: TriggerStatus) => {
    if (!selectedOrganization) return;
    await updateTriggerStatus(selectedFolderId, id, status);
    toast({
      title: "Trigger Status Updated",
      description: `The trigger has been ${status}.`,
    });
  };

  const handleTest = async (trigger: Trigger) => {
    toast({
      title: "Testing Trigger...",
      description: `Sending a ${trigger.method} request to the webhook.`,
    });
    const success = await testTrigger(trigger, selectedFolderId);
    if (success) {
      toast({
        title: "Test Successful",
        description: "The webhook endpoint responded with a success status.",
      });
    } else {
      toast({
        title: "Test Failed",
        description: "The webhook endpoint responded with an error. Check the console for details.",
        variant: "destructive",
      });
    }
  };

  const handleReset = async (trigger: Trigger) => {
    if (!selectedOrganization) return;
    await resetTrigger(selectedFolderId, trigger.id);
    toast({
      title: "Trigger Reset",
      description: `The trigger has been rescheduled to run in the next minute.`,
    });
  };


  if (loading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {selectedFolder && <Folder className="h-6 w-6 text-muted-foreground" />}
            <h2 className="text-2xl font-bold tracking-tight font-headline">{viewName}</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Manage Team
            </Button>
            <Button onClick={handleCreateNew} size="lg" disabled={loading || !canCreateTriggers}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Trigger
            </Button>
          </div>
        </div>

        {!selectedOrganization && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center h-[200px] space-y-4 p-8 text-center border-2 border-dashed border-white/10 rounded-lg">
                <h2 className="text-xl font-bold tracking-tight font-headline text-white">Welcome!</h2>
                <p className="text-gray-400">It looks like you're not part of any organization yet.</p>
                <p className="text-sm text-gray-500">Your initial organization is being created. This should only take a moment.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedOrganization && (
          <>
            {selectedFolder ? (
              <Card>
                <CardHeader>
                  <CardTitle>Scheduled Triggers</CardTitle>
                  <CardDescription>An overview of all triggers in the &quot;{selectedFolder.name}&quot; folder.</CardDescription>
                </CardHeader>
                <CardContent>
                  <TriggerTable
                    triggers={selectedFolder.triggers}
                    selectedTriggerId={highlightedTriggerId}
                    onRowClick={handleRowClick}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    onTest={handleTest}
                    onShowHistory={handleShowHistory}
                    onReset={handleReset}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {folders.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Folders</CardTitle>
                      <CardDescription>Organize your triggers into folders for better management.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {folders.map(folder => (
                        <FolderCard
                          key={folder.id}
                          folder={folder}
                          onClick={() => setSelectedFolderId(folder.id)}
                        />
                      ))}
                    </CardContent>
                  </Card>
                )}

                {(folders.length > 0 && topLevelTriggers.length > 0) && <Separator />}

                {topLevelTriggers.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Individual Triggers</CardTitle>
                      <CardDescription>These triggers are not assigned to any folder.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <TriggerTable
                        triggers={topLevelTriggers}
                        selectedTriggerId={highlightedTriggerId}
                        onRowClick={handleRowClick}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onStatusChange={handleStatusChange}
                        onTest={handleTest}
                        onShowHistory={handleShowHistory}
                        onReset={handleReset}
                      />
                    </CardContent>
                  </Card>
                )}

                {folders.length === 0 && topLevelTriggers.length === 0 && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center justify-center h-[200px] space-y-4 p-8 text-center border-2 border-dashed border-white/10 rounded-lg">
                        <h2 className="text-xl font-bold tracking-tight font-headline text-white">No Triggers Yet</h2>
                        <p className="text-gray-400">Click the "Create Trigger" button to get started.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <CreateTriggerSheet
        isOpen={isSheetOpen}
        onOpenChange={(isOpen) => {
          setIsSheetOpen(isOpen);
          if (!isOpen) {
            // Clear selection when sheet closes
            setHighlightedTriggerId(null);
          }
        }}
        onSave={handleSave}
        trigger={selectedTrigger}
        folders={folders}
        currentFolderId={selectedFolderId}
      />
      <ExecutionHistoryDialog
        isOpen={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        logs={historyLogs}
      />
    </>
  );
}
