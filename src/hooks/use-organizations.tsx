"use client";

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, writeBatch, query, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Organization, Folder, Trigger, Member, UserData, TriggerStatus, Schedule, ExecutionLog } from '@/lib/types';
import { useAuth } from './use-auth';
import { useSelectedOrg } from './use-selected-org';
import axios from 'axios';
import { add, startOfMinute } from 'date-fns';

// Helper function to generate a secure random string for API keys
const generateApiKey = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let apiKey = '';
  for (let i = 0; i < length; i++) {
    apiKey += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ta_${apiKey}`; // "ta" prefix for "triggered app"
};


export function useOrganizations() {
  const { user, loading: authLoading } = useAuth();
  const { selectedOrgId, setSelectedOrgId } = useSelectedOrg();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrganizations = useCallback(async () => {
    if (!user) {
      setOrganizations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        console.warn("User document not found, cannot fetch organizations.");
        setOrganizations([]);
        return;
      }

      const userData = userSnap.data() as UserData;
      const orgIds = userData.organizations;

      if (!orgIds || orgIds.length === 0) {
        setOrganizations([]);
        return;
      }

      const orgPromises = orgIds.map(id => getDoc(doc(db, 'organizations', id)));
      const orgDocs = await Promise.all(orgPromises);
      const userOrgs = orgDocs.map(d => d.data() as Organization).filter(Boolean);

      setOrganizations(userOrgs);

      if (userOrgs.length > 0) {
        if (!selectedOrgId || !userOrgs.some(o => o.id === selectedOrgId)) {
          setSelectedOrgId(userOrgs[0].id);
        }
      } else {
        setSelectedOrgId(null);
      }

    } catch (error) {
      console.error("Error fetching organizations:", error);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  }, [user, selectedOrgId, setSelectedOrgId]);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    fetchOrganizations();
  }, [authLoading, user, fetchOrganizations]);

  const selectedOrganization = organizations.find(o => o.id === selectedOrgId) || null;

  const updateOrganizationData = useCallback(async (orgId: string, updatedData: Partial<Organization>) => {
    if (!user) return;
    const orgDocRef = doc(db, 'organizations', orgId);
    await updateDoc(orgDocRef, updatedData);

    await fetchOrganizations();

  }, [user, fetchOrganizations]);

  const addFolder = useCallback(async (name: string) => {
    if (!user || !selectedOrgId) return;
    console.log(`[ACTION] Adding folder: ${name}`);
    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name,
      triggers: [],
    };
    await updateDoc(doc(db, 'organizations', selectedOrgId), {
      folders: arrayUnion(newFolder)
    });

    setOrganizations(prevOrgs =>
      prevOrgs.map(org =>
        org.id === selectedOrgId
          ? { ...org, folders: [...(org.folders || []), newFolder] }
          : org
      )
    );
  }, [user, selectedOrgId]);

  const deleteFolder = useCallback(async (folderId: string) => {
    if (!user || !selectedOrganization) return;
    console.log(`[ACTION] Deleting folder: ${folderId}`);
    const folderToDelete = selectedOrganization.folders.find(f => f.id === folderId);
    if (folderToDelete) {
      await updateDoc(doc(db, 'organizations', selectedOrganization.id), {
        folders: arrayRemove(folderToDelete)
      });
      await fetchOrganizations();
    }
  }, [user, selectedOrganization, fetchOrganizations]);

  const createOrganization = useCallback(async (name: string) => {
    if (!user) return;
    console.log(`[ACTION] Creating organization: ${name}`);

    const batch = writeBatch(db);
    const newOrgRef = doc(collection(db, "organizations"));
    const orgId = newOrgRef.id;

    const newMember: Member = {
      uid: user.uid,
      email: user.email!,
      role: 'owner',
      displayName: user.displayName || user.email!,
      photoURL: user.photoURL || null,
    }

    const newOrganization: Organization = {
      id: orgId,
      name,
      owner: {
        uid: user.uid,
        photoURL: user.photoURL || null,
        email: user.email,
        displayName: user.displayName
      },
      members: [newMember],
      memberUids: [user.uid],
      folders: [],
      triggers: [],
      apiKey: generateApiKey(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
    };

    batch.set(newOrgRef, newOrganization);

    const userDocRef = doc(db, "users", user.uid);
    batch.update(userDocRef, {
      organizations: arrayUnion(orgId)
    });

    await batch.commit();
    await fetchOrganizations();
    setSelectedOrgId(orgId);
  }, [user, fetchOrganizations, setSelectedOrgId]);

  const addTriggerToFolder = useCallback(async (folderId: string, triggerData: Omit<Trigger, 'id' | 'status' | 'runCount' | 'executionHistory'>) => {
    if (!selectedOrganization || !user) return;

    let finalSchedule: Schedule = triggerData.schedule;
    if ((finalSchedule as any).type === 'daily') {
      finalSchedule = { type: 'interval', amount: 1, unit: 'days' };
    }

    console.log(`[ACTION] Creating new trigger "${triggerData.name}" in folder ${folderId} via API`);

    const token = await user.getIdToken();
    try {
      await axios.post('/api/dashboard/triggers', {
        ...triggerData,
        schedule: finalSchedule,
        orgId: selectedOrganization.id,
        folderId: folderId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchOrganizations();
    } catch (error: any) {
      console.error("Failed to create trigger via API:", error);
      throw new Error(error.response?.data?.error || error.message);
    }
  }, [selectedOrganization, user, fetchOrganizations]);

  const addTriggerToOrganization = useCallback(async (triggerData: Omit<Trigger, 'id' | 'status' | 'runCount' | 'executionHistory'>) => {
    if (!selectedOrganization || !user) return;

    let finalSchedule: Schedule = triggerData.schedule;
    if ((finalSchedule as any).type === 'daily') {
      finalSchedule = { type: 'interval', amount: 1, unit: 'days' };
    }

    console.log(`[ACTION] Creating new trigger "${triggerData.name}" in organization root via API`);

    const token = await user.getIdToken();
    try {
      await axios.post('/api/dashboard/triggers', {
        ...triggerData,
        schedule: finalSchedule,
        orgId: selectedOrganization.id,
        folderId: null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchOrganizations();
    } catch (error: any) {
      console.error("Failed to create trigger via API:", error);
      throw new Error(error.response?.data?.error || error.message);
    }
  }, [selectedOrganization, user, fetchOrganizations]);


  const updateTrigger = useCallback(async (folderId: string | null, triggerId: string, triggerData: Partial<Omit<Trigger, 'id'>>) => {
    if (!selectedOrganization) return;
    console.log(`[ACTION] Updating trigger: ${triggerId}`);

    if (folderId) {
      const updatedFolders = selectedOrganization.folders.map(folder => {
        if (folder.id === folderId) {
          return {
            ...folder,
            triggers: folder.triggers.map((t) =>
              t.id === triggerId ? { ...t, ...triggerData } as Trigger : t
            ),
          };
        }
        return folder;
      });
      await updateOrganizationData(selectedOrganization.id, { folders: updatedFolders });
    } else {
      const updatedTriggers = selectedOrganization.triggers.map(t =>
        t.id === triggerId ? { ...t, ...triggerData } as Trigger : t
      );
      await updateOrganizationData(selectedOrganization.id, { triggers: updatedTriggers });
    }
  }, [selectedOrganization, updateOrganizationData]);

  const updateTriggerStatus = useCallback(async (folderId: string | null, triggerId: string, status: TriggerStatus) => {
    if (!selectedOrganization) return;
    console.log(`[ACTION] Changing status for trigger ${triggerId} to ${status}`);

    const partialUpdate: Partial<Trigger> = { status };

    if (folderId) {
      const updatedFolders = selectedOrganization.folders.map(folder => {
        if (folder.id === folderId) {
          return {
            ...folder,
            triggers: folder.triggers.map((t) =>
              t.id === triggerId ? { ...t, ...partialUpdate } as Trigger : t
            ),
          };
        }
        return folder;
      });
      await updateOrganizationData(selectedOrganization.id, { folders: updatedFolders });
    } else {
      const updatedTriggers = selectedOrganization.triggers.map(t =>
        t.id === triggerId ? { ...t, ...partialUpdate } as Trigger : t
      );
      await updateOrganizationData(selectedOrganization.id, { triggers: updatedTriggers });
    }
  }, [selectedOrganization, updateOrganizationData]);


  const deleteTrigger = useCallback(async (folderId: string | null, triggerId: string) => {
    if (!selectedOrganization) return;
    console.log(`[ACTION] Deleting trigger: ${triggerId}`);

    if (folderId) {
      const updatedFolders = selectedOrganization.folders.map(folder =>
        folder.id === folderId
          ? { ...folder, triggers: folder.triggers.filter(t => t.id !== triggerId) }
          : folder
      );
      await updateOrganizationData(selectedOrganization.id, { folders: updatedFolders });
    } else {
      const updatedTriggers = selectedOrganization.triggers.filter(t => t.id !== triggerId);
      await updateOrganizationData(selectedOrganization.id, { triggers: updatedTriggers });
    }
  }, [selectedOrganization, updateOrganizationData]);

  const regenerateApiKey = useCallback(async () => {
    if (!selectedOrganization) return;
    console.log(`[ACTION] Regenerating API key for org: ${selectedOrganization.id}`);
    const newApiKey = generateApiKey();
    await updateOrganizationData(selectedOrganization.id, { apiKey: newApiKey });
  }, [selectedOrganization, updateOrganizationData]);

  const updateOrganizationTimezone = useCallback(async (timezone: string) => {
    if (!selectedOrganization) return;
    console.log(`[ACTION] Updating timezone for org ${selectedOrganization.id} to ${timezone}`);
    await updateOrganizationData(selectedOrganization.id, { timezone });
  }, [selectedOrganization, updateOrganizationData]);

  const testTrigger = useCallback(async (trigger: Trigger, folderId: string | null) => {
    console.log(`[ACTION] Testing trigger: ${trigger.id} at URL: ${trigger.url}`);

    const logEntry: Omit<ExecutionLog, 'id'> = {
      timestamp: new Date().toISOString(),
      status: 'failed',
      requestPayload: trigger.payload,
      triggerMode: 'test',
    };

    try {
      const response = await axios({
        method: trigger.method,
        url: trigger.url,
        data: trigger.payload,
        headers: {
          'Content-Type': 'application/json',
          'X-Trigger-Mode': 'test'
        },
        timeout: trigger.timeout || 5000,
      });
      console.log(`[ACTION] Test for trigger ${trigger.id} was successful.`);

      logEntry.status = 'success';
      logEntry.responseStatus = response.status;
      logEntry.responseBody = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

      const newLog: ExecutionLog = {
        ...logEntry,
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      const updatedHistory = [newLog, ...(trigger.executionHistory || [])].slice(0, 20);
      await updateTrigger(folderId, trigger.id, { executionHistory: updatedHistory });

      return true;
    } catch (error: any) {
      console.error(`[ACTION-ERROR] Failed to execute test for trigger ${trigger.id}:`, error);

      logEntry.status = 'failed';
      logEntry.error = error.message;
      if (error.response) {
        logEntry.responseStatus = error.response.status;
        logEntry.responseBody = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data);
      }

      const newLog: ExecutionLog = {
        ...logEntry,
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      const updatedHistory = [newLog, ...(trigger.executionHistory || [])].slice(0, 20);
      await updateTrigger(folderId, trigger.id, { executionHistory: updatedHistory });

      return false;
    }
  }, [updateTrigger]);

  const resetTrigger = useCallback(async (folderId: string | null, triggerId: string) => {
    if (!selectedOrganization) return;

    const now = new Date();
    const nextMinute = startOfMinute(add(now, { minutes: 1 }));

    console.log(`[ACTION] Resetting trigger ${triggerId} to next minute: ${nextMinute.toISOString()}`);

    // Find the trigger to get current history
    let currentTrigger: Trigger | undefined;
    if (folderId) {
      const folder = selectedOrganization.folders.find(f => f.id === folderId);
      currentTrigger = folder?.triggers.find(t => t.id === triggerId);
    } else {
      currentTrigger = selectedOrganization.triggers.find(t => t.id === triggerId);
    }

    const newLog: ExecutionLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now.toISOString(),
      status: 'reset',
      triggerMode: 'manual',
    };

    const partialUpdate: Partial<Trigger> = {
      runCount: 0,
      nextRun: nextMinute.toISOString(),
      status: 'active',
      executionHistory: [newLog, ...(currentTrigger?.executionHistory || [])].slice(0, 20),
    };

    await updateTrigger(folderId, triggerId, partialUpdate);

  }, [selectedOrganization, updateTrigger]);


  return { organizations, selectedOrganization, loading: authLoading || loading, addFolder, deleteFolder, addTriggerToFolder, addTriggerToOrganization, updateTrigger, updateTriggerStatus, deleteTrigger, createOrganization, regenerateApiKey, testTrigger, updateOrganizationTimezone, resetTrigger };
}
