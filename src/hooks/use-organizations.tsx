"use client";

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, writeBatch, query, getDocs, where, setDoc, deleteDoc } from 'firebase/firestore';
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

  // Helper to migrate legacy triggers (embedded in arrays) to subcollection
  const migrateLegacyTriggers = useCallback(async (org: Organization) => {
    try {
      const batch = writeBatch(db);
      let hasChanges = false;

      // Migrate top-level triggers
      if (org.triggers && org.triggers.length > 0) {
        console.log(`[MIGRATION] Migrating ${org.triggers.length} top-level triggers for org ${org.id}`);
        org.triggers.forEach(t => {
          const newRef = doc(db, 'organizations', org.id, 'triggers', t.id);
          // Ensure field completeness
          const triggerData = { ...t, orgId: org.id, folderId: null };
          batch.set(newRef, triggerData);
        });
        hasChanges = true;
      }

      // Migrate folder triggers
      const migratedFolders = org.folders.map(f => {
        if (f.triggers && f.triggers.length > 0) {
          console.log(`[MIGRATION] Migrating ${f.triggers.length} triggers in folder ${f.id}`);
          f.triggers.forEach(t => {
            const newRef = doc(db, 'organizations', org.id, 'triggers', t.id);
            const triggerData = { ...t, orgId: org.id, folderId: f.id };
            batch.set(newRef, triggerData);
          });
          hasChanges = true;
          return { ...f, triggers: [] }; // Clear triggers from folder
        }
        return f;
      });

      if (hasChanges) {
        // Update Org Doc to clear legacy arrays
        const orgRef = doc(db, 'organizations', org.id);
        batch.update(orgRef, {
          triggers: [], // Clear top-level
          folders: migratedFolders // Update folders with empty trigger arrays
        });
        await batch.commit();
        console.log(`[MIGRATION] Successfully migrated triggers for org ${org.id}`);
      }

    } catch (error) {
      console.error(`[MIGRATION-ERROR] Failed to migrate triggers for org ${org.id}:`, error);
    }
  }, []);

  // Helper to hydrate an organization with its triggers from subcollection
  const hydrateOrganizationTriggers = useCallback(async (org: Organization) => {
    try {
      // 1. Check for legacy triggers and migrate if needed
      if ((org.triggers && org.triggers.length > 0) || (org.folders && org.folders.some(f => f.triggers && f.triggers.length > 0))) {
        await migrateLegacyTriggers(org);
        // After migration, the Org Doc in DB is updated. 
        // We can proceed to fetch from subcollection. 
        // Note: The 'org' variable here still has the old data, but 'getDocs' below fetches new data from subcollection.
        // We assume migration succeeded.
      }

      const triggersSnapshot = await getDocs(collection(db, 'organizations', org.id, 'triggers'));
      const allTriggers = triggersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trigger));

      // Distribute triggers to folders or top-level
      // Note: We use 'org.folders' from the doc, but if we just migrated, we updated it in DB but 'org' var is stale.
      // However, we only care about folder IDs here.
      const hydratedFolders = org.folders.map(folder => ({
        ...folder,
        triggers: allTriggers.filter(t => t.folderId === folder.id)
      }));

      const topLevelTriggers = allTriggers.filter(t => !t.folderId);

      return {
        ...org,
        folders: hydratedFolders,
        triggers: topLevelTriggers
      };
    } catch (error) {
      console.error(`Failed to hydrate triggers for org ${org.id}:`, error);
      return org;
    }
  }, [migrateLegacyTriggers]);

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
      let userOrgs = orgDocs.map(d => ({ id: d.id, ...d.data() } as Organization)).filter(o => o.name);

      if (userOrgs.length > 0) {
        // Hydrate triggers for all organizations to ensure smooth switching
        userOrgs = await Promise.all(userOrgs.map(hydrateOrganizationTriggers));

        setOrganizations(userOrgs);

        if (!selectedOrgId || !userOrgs.some(o => o.id === selectedOrgId)) {
          setSelectedOrgId(userOrgs[0].id);
        }
      } else {
        setOrganizations([]);
        setSelectedOrgId(null);
      }

    } catch (error) {
      console.error("Error fetching organizations:", error);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  }, [user, selectedOrgId, setSelectedOrgId, hydrateOrganizationTriggers]);

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

    // Safety check: remove triggers from update payload to prevent overwriting subcollection with empty array or stale data
    // cast to any to deconstruct
    const { triggers, folders, ...safeData } = updatedData as any;

    // If folders are being updated (metadata), strip triggers from them before saving
    let safeFolders = undefined;
    if (folders) {
      safeFolders = folders.map((f: Folder) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { triggers, ...folderMeta } = f;
        return { ...folderMeta, triggers: [] }; // Save with empty triggers array
      });
    }

    const dataToSave = { ...safeData };
    if (safeFolders) dataToSave.folders = safeFolders;

    await updateDoc(orgDocRef, dataToSave);

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

    // Save to Org Doc without triggers
    const folderToSave = { ...newFolder, triggers: [] };

    await updateDoc(doc(db, 'organizations', selectedOrgId), {
      folders: arrayUnion(folderToSave)
    });

    await fetchOrganizations();
  }, [user, selectedOrgId, fetchOrganizations]);

  const deleteFolder = useCallback(async (folderId: string) => {
    if (!user || !selectedOrganization) return;
    console.log(`[ACTION] Deleting folder: ${folderId}`);

    const folderToDelete = selectedOrganization.folders.find(f => f.id === folderId);

    if (folderToDelete) {
      // Construct the object exactly as it is in Firestore (empty triggers) for arrayRemove
      const firestoreFolder = { id: folderToDelete.id, name: folderToDelete.name, triggers: [] };

      await updateDoc(doc(db, 'organizations', selectedOrganization.id), {
        folders: arrayRemove(firestoreFolder)
      });

      // Batch delete all triggers in this folder from subcollection
      const triggersToDelete = folderToDelete.triggers;
      if (triggersToDelete.length > 0) {
        const batch = writeBatch(db);
        triggersToDelete.forEach(t => {
          batch.delete(doc(db, 'organizations', selectedOrganization.id, 'triggers', t.id));
        });
        await batch.commit();
      }

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
      triggers: [], // Empty in doc
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

    console.log(`[ACTION] Creating new trigger "${triggerData.name}" in folder ${folderId}`);

    // Create new trigger in subcollection
    const newTriggerRef = doc(collection(db, 'organizations', selectedOrganization.id, 'triggers'));
    const newTrigger: Trigger = {
      id: newTriggerRef.id,
      ...triggerData,
      schedule: finalSchedule,
      status: 'active',
      folderId: folderId,
      orgId: selectedOrganization.id,
      runCount: 0,
      executionHistory: [],
      nextRun: new Date().toISOString()
    };

    await setDoc(newTriggerRef, newTrigger);
    await fetchOrganizations();

  }, [selectedOrganization, user, fetchOrganizations]);

  const addTriggerToOrganization = useCallback(async (triggerData: Omit<Trigger, 'id' | 'status' | 'runCount' | 'executionHistory'>) => {
    if (!selectedOrganization || !user) return;

    let finalSchedule: Schedule = triggerData.schedule;
    if ((finalSchedule as any).type === 'daily') {
      finalSchedule = { type: 'interval', amount: 1, unit: 'days' };
    }

    console.log(`[ACTION] Creating new trigger "${triggerData.name}" in organization root`);

    const newTriggerRef = doc(collection(db, 'organizations', selectedOrganization.id, 'triggers'));
    const newTrigger: Trigger = {
      id: newTriggerRef.id,
      ...triggerData,
      schedule: finalSchedule,
      status: 'active',
      folderId: null,
      orgId: selectedOrganization.id,
      runCount: 0,
      executionHistory: [],
      nextRun: new Date().toISOString()
    };

    await setDoc(newTriggerRef, newTrigger);
    await fetchOrganizations();

  }, [selectedOrganization, user, fetchOrganizations]);


  const updateTrigger = useCallback(async (folderId: string | null, triggerId: string, triggerData: Partial<Omit<Trigger, 'id'>>) => {
    if (!selectedOrganization) return;
    console.log(`[ACTION] Updating trigger: ${triggerId}`);

    const triggerRef = doc(db, 'organizations', selectedOrganization.id, 'triggers', triggerId);
    await updateDoc(triggerRef, triggerData);

    await fetchOrganizations();
  }, [selectedOrganization, fetchOrganizations]);


  const updateTriggerStatus = useCallback(async (folderId: string | null, triggerId: string, status: TriggerStatus) => {
    if (!selectedOrganization) return;
    console.log(`[ACTION] Changing status for trigger ${triggerId} to ${status}`);

    const triggerRef = doc(db, 'organizations', selectedOrganization.id, 'triggers', triggerId);
    await updateDoc(triggerRef, { status });

    await fetchOrganizations();
  }, [selectedOrganization, fetchOrganizations]);


  const deleteTrigger = useCallback(async (folderId: string | null, triggerId: string) => {
    if (!selectedOrganization) return;
    console.log(`[ACTION] Deleting trigger: ${triggerId}`);

    const triggerRef = doc(db, 'organizations', selectedOrganization.id, 'triggers', triggerId);
    await deleteDoc(triggerRef);

    await fetchOrganizations();
  }, [selectedOrganization, fetchOrganizations]);

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
      const response = await axios.post('/api/test-trigger', {
        url: trigger.url,
        method: trigger.method,
        headers: {
          'Content-Type': 'application/json',
          'X-Trigger-Mode': 'test'
        },
        payload: trigger.payload,
        timeout: trigger.timeout || 10000,
      });

      const { success, status, data, duration, error, statusText } = response.data;

      console.log(`[ACTION] Test for trigger ${trigger.id} completed. Success: ${success}`);

      if (success) {
        logEntry.status = 'success';
        logEntry.responseStatus = status;
        logEntry.responseBody = typeof data === 'string' ? data : JSON.stringify(data);
      } else {
        logEntry.status = 'failed';
        logEntry.responseStatus = status;
        logEntry.error = error || statusText || "Unknown Error";
        logEntry.responseBody = typeof data === 'string' ? data : JSON.stringify(data);
      }

      const newLog: ExecutionLog = {
        ...logEntry,
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      const triggerRef = doc(db, 'organizations', selectedOrganization!.id, 'triggers', trigger.id);

      const updatedHistory = [newLog, ...(trigger.executionHistory || [])].slice(0, 20);
      await updateDoc(triggerRef, { executionHistory: updatedHistory });

      await fetchOrganizations();

      return success;
    } catch (error: any) {
      console.error(`[ACTION-ERROR] Failed to execute test for trigger ${trigger.id}:`, error);
      return false;
    }
  }, [selectedOrganization, fetchOrganizations]);

  const resetTrigger = useCallback(async (folderId: string | null, triggerId: string) => {
    if (!selectedOrganization) return;
    const now = new Date();
    const nextMinute = startOfMinute(add(now, { minutes: 1 }));

    console.log(`[ACTION] Resetting trigger ${triggerId} to next minute: ${nextMinute.toISOString()}`);

    const triggerRef = doc(db, 'organizations', selectedOrganization!.id, 'triggers', triggerId);

    // Add a 'reset' log entry
    // Note: We are writing to the Trigger document `executionHistory` Array directly here. 
    // This is legacy behavior but acceptable for now as 'reset' is a rare admin action.
    // Ideally this should go to the subcollection too in the future.
    // For now, let's just update the status/runCount.

    await updateDoc(triggerRef, {
      nextRun: nextMinute.toISOString(),
      status: 'active',
      runCount: 0,
      // executionHistory: arrayUnion(resetLog) // Optional
    });

    await fetchOrganizations();
  }, [selectedOrganization, fetchOrganizations]);

  const addMember = useCallback(async (email: string, role: Role) => {
    if (!selectedOrganization || !auth.currentUser) return;
    const token = await auth.currentUser.getIdToken();
    try {
      await axios.post(`/api/organizations/${selectedOrganization.id}/members`, { email, role }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchOrganizations();
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message);
    }
  }, [selectedOrganization, fetchOrganizations]);

  const removeMember = useCallback(async (uid: string) => {
    if (!selectedOrganization || !auth.currentUser) return;
    const token = await auth.currentUser.getIdToken();
    try {
      await axios.delete(`/api/organizations/${selectedOrganization.id}/members`, {
        data: { uid },
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchOrganizations();
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message);
    }
  }, [selectedOrganization, fetchOrganizations]);

  const updateMemberRole = useCallback(async (uid: string, role: Role) => {
    if (!selectedOrganization || !auth.currentUser) return;
    const token = await auth.currentUser.getIdToken();
    try {
      await axios.put(`/api/organizations/${selectedOrganization.id}/members`, { uid, role }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchOrganizations();
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message);
    }
  }, [selectedOrganization, fetchOrganizations]);

  return {
    organizations,
    selectedOrganization,
    loading: authLoading || loading,
    addFolder,
    deleteFolder,
    addTriggerToFolder,
    addTriggerToOrganization,
    updateTrigger,
    updateTriggerStatus,
    deleteTrigger,
    createOrganization,
    regenerateApiKey,
    testTrigger,
    updateOrganizationTimezone,
    resetTrigger,
    addMember,
    removeMember,
    updateMemberRole
  };
}
