
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
import { Logo } from "@/components/ui/logo";
import { OrganizationSwitcher } from "@/components/dashboard/organization-switcher";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ErrorBoundary } from "@/components/error-boundary";
import { UpgradeDialog } from "@/components/upgrade-dialog";
import { PLAN_LIMITS } from "@/lib/constants";
import { TeamManagementDialog } from "./team-management-dialog";
import { useAuth } from "@/hooks/use-auth";

export function WebhookDashboard() {
  const { selectedOrganization, loading, addTriggerToFolder, addTriggerToOrganization, updateTrigger, deleteTrigger, updateTriggerStatus, testTrigger, resetTrigger, addMember, removeMember, updateMemberRole } = useOrganizations();
  const { selectedFolderId, setSelectedFolderId } = useSelectedFolder();
  const { user } = useAuth();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTeamOpen, setIsTeamOpen] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState<Trigger | null>(null);
  const [historyTrigger, setHistoryTrigger] = useState<Trigger | null>(null);
  const [highlightedTriggerId, setHighlightedTriggerId] = useState<string | null>(null);
  const [historyLogs, setHistoryLogs] = useState<ExecutionLog[]>([]); // Helper for legacy or fallback
  const { toast } = useToast();

  // New state for duplicate mode
  const [isDuplicateMode, setIsDuplicateMode] = useState(false);

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
          .catch(err => console.error("Cron poll error", err));
      }, 60000); // Poll every minute

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

    const currentPlan = selectedOrganization?.planId || 'free';
    const limits = PLAN_LIMITS[currentPlan];

    // Calculate total triggers (top-level + inside folders)
    const totalTriggers = (selectedOrganization?.triggers?.length || 0) +
      (selectedOrganization?.folders?.reduce((acc, folder) => acc + folder.triggers.length, 0) || 0);

    if (limits.triggers !== Infinity && totalTriggers >= limits.triggers) {
      setShowUpgradeDialog(true);
      return;
    }

    setSelectedTrigger(null);
    setIsDuplicateMode(false);
    setIsSheetOpen(true);
  };

  const handleDuplicate = (trigger: Trigger) => {
    if (!canCreateTriggers) return;

    const currentPlan = selectedOrganization?.planId || 'free';
    const limits = PLAN_LIMITS[currentPlan];

    // Calculate total triggers (top-level + inside folders)
    const totalTriggers = (selectedOrganization?.triggers?.length || 0) +
      (selectedOrganization?.folders?.reduce((acc, folder) => acc + folder.triggers.length, 0) || 0);

    if (limits.triggers !== Infinity && totalTriggers >= limits.triggers) {
      setShowUpgradeDialog(true);
      return;
    }

    setSelectedTrigger({ ...trigger, name: `Copy of ${trigger.name}` });
    setIsDuplicateMode(true);
    setIsSheetOpen(true);
  };

  const handleEdit = (trigger: Trigger) => {
    setSelectedTrigger(trigger);
    setIsDuplicateMode(false);
    setIsSheetOpen(true);
  };

  const handleManageTeam = () => {
    setIsTeamOpen(true);
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
    setHistoryTrigger(trigger);
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
      if (id && !isDuplicateMode) {
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
      setIsDuplicateMode(false);
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
      <div className="flex flex-col h-full gap-4 p-4 overflow-hidden">
        {/* Modal 1: Top Header & Actions */}
        <Card className="border-white/20 bg-black/40 backdrop-blur-md shrink-0">
          <CardContent className="p-6 flex flex-col gap-6">
            {/* Row 1: App Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="md:hidden" />
                <Logo className="h-6 w-6" />
                <h1 className="text-xl font-bold font-headline tracking-tight text-white">Triggered App</h1>
              </div>
              <ErrorBoundary fallback={<div className="text-red-500 text-xs">Org Switcher Error</div>}>
                <OrganizationSwitcher />
              </ErrorBoundary>
            </div>
            <Separator className="bg-white/10" />
            {/* Row 2: Dashboard Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedFolder && <Folder className="h-6 w-6 text-muted-foreground" />}
                <h2 className="text-2xl font-bold tracking-tight font-headline text-white">{viewName}</h2>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleManageTeam}>
                  <Users className="mr-2 h-4 w-4" />
                  Manage Team
                </Button>
                <Button onClick={handleCreateNew} size="lg" disabled={loading || !canCreateTriggers}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Trigger
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {!selectedOrganization ? (
          <Card className="flex-1 border-white/20 bg-black/40 backdrop-blur-md">
            <CardContent className="pt-6 h-full flex flex-col justify-center">
              <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center border-2 border-dashed border-white/10 rounded-lg">
                <h2 className="text-xl font-bold tracking-tight font-headline text-white">Welcome!</h2>
                <p className="text-gray-400">It looks like you're not part of any organization yet.</p>
                <p className="text-sm text-gray-500">Your initial organization is being created. This should only take a moment.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Modal 2: Folders */}
            {!selectedFolder && (
              <Card className="border-white/20 bg-black/40 backdrop-blur-md shrink-0 max-h-[300px] overflow-hidden flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle>Folders</CardTitle>
                </CardHeader>
                <CardContent className="overflow-y-auto">
                  {folders.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {folders.map(folder => (
                        <FolderCard
                          key={folder.id}
                          folder={folder}
                          onClick={() => setSelectedFolderId(folder.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No folders created yet.</div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Modal 3: Triggers */}
            <Card className="border-white/20 bg-black/40 backdrop-blur-md flex-1 overflow-hidden flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle>{selectedFolder ? "Scheduled Triggers" : "Individual Triggers"}</CardTitle>
                <CardDescription>
                  {selectedFolder
                    ? `An overview of all triggers in the "${selectedFolder.name}" folder.`
                    : "These triggers are not assigned to any folder."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-0">
                <div className="p-6 pt-0">
                  <TriggerTable
                    triggers={selectedFolder ? selectedFolder.triggers : topLevelTriggers}
                    selectedTriggerId={highlightedTriggerId}
                    onRowClick={handleRowClick}
                    onEdit={handleEdit}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    onTest={handleTest}
                    onShowHistory={handleShowHistory}
                    onReset={handleReset}
                  />
                  {!selectedFolder && topLevelTriggers.length === 0 && (
                    <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center border-2 border-dashed border-white/10 rounded-lg mt-4">
                      <h2 className="text-xl font-bold tracking-tight font-headline text-white">No Triggers Yet</h2>
                      <p className="text-gray-400">Click the "Create Trigger" button to get started.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
            setIsDuplicateMode(false);
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
        triggerId={historyTrigger?.id || null}
        organizationId={selectedOrganization?.id}
        initialLogs={historyTrigger?.executionHistory || []}
      />
      <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        title="Trigger Limit Reached"
        description={`You have reached the maximum number of triggers (${PLAN_LIMITS[selectedOrganization?.planId || 'free'].triggers}) for your current plan. Upgrade to create more.`}
      />
      {selectedOrganization && (
        <TeamManagementDialog
          isOpen={isTeamOpen}
          onOpenChange={setIsTeamOpen}
          organization={selectedOrganization}
          onAddMember={addMember}
          onRemoveMember={removeMember}
          onUpdateRole={updateMemberRole}
          currentUserId={user?.uid}
        />
      )}
    </>
  );
}
