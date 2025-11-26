
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  EmailAuthProvider,
  linkWithCredential,
  signOut as firebaseSignOut,
  User
} from "firebase/auth";
import { auth, googleProvider, db } from "@/lib/firebase";
import { doc, setDoc, getDoc, writeBatch, collection } from "firebase/firestore";
import type { Organization, Folder, Member, Trigger, UserData } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<boolean>;
  signUpWithEmail: (email: string, pass: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<boolean>;
  linkPassword: (password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to generate a secure random string for API keys
const generateApiKey = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let apiKey = '';
  for (let i = 0; i < length; i++) {
    apiKey += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ta_${apiKey}`; // "ta" prefix for "triggered app"
};


const createInitialUserData = async (user: User) => {
  const userDocRef = doc(db, "users", user.uid);
  console.log("Creating initial data for new user:", user.uid);

  const batch = writeBatch(db);

  const displayName = user.displayName || user.email?.split('@')[0] || 'New User';

  if (!user.displayName) {
    await updateProfile(user, { displayName });
  }

  const newOrgRef = doc(collection(db, "organizations"));
  const orgId = newOrgRef.id;

  const welcomeTrigger: Omit<Trigger, 'id' | 'status' | 'runCount' | 'executionHistory'> = {
    name: "Welcome Trigger",
    url: "https://api.example.com/v1/sync",
    method: "POST",
    nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    schedule: { type: "interval", amount: 1, unit: "days" },
    payload: { "message": "Welcome to Triggered App!" },
  };

  const initialFolder: Folder = {
    id: `folder-${Date.now()}`,
    name: "My First Project",
    triggers: [{ ...welcomeTrigger, id: `trigger-${Date.now()}`, status: "active", runCount: 0, executionHistory: [] }],
  };

  const newMember: Member = {
    uid: user.uid,
    email: user.email!,
    role: 'owner',
    displayName: displayName,
    photoURL: user.photoURL || null,
  }

  const newOrganization: Organization = {
    id: orgId,
    name: `${displayName}'s Organization`,
    owner: {
      uid: user.uid,
      photoURL: user.photoURL || null,
      email: user.email,
      displayName: displayName,
    },
    members: [newMember],
    memberUids: [user.uid],
    folders: [initialFolder],
    triggers: [],
    apiKey: generateApiKey(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
  };

  batch.set(newOrgRef, newOrganization);

  const userData: UserData = {
    uid: user.uid,
    email: user.email,
    displayName: displayName,
    photoURL: user.photoURL,
    organizations: [orgId],
  };

  batch.set(userDocRef, userData);

  try {
    await batch.commit();
    console.log("Initial data created successfully for user:", user.uid);
  } catch (e) {
    console.error("Failed to create initial user data", e);
    throw e;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      try {
        if (firebaseUser) {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            try {
              await createInitialUserData(firebaseUser);
              const freshUser = auth.currentUser;
              await freshUser?.reload(); // Reload to get updated profile info
              setUser(auth.currentUser);
            } catch (e) {
              console.error("Failed to create and set initial user data", e);
              await firebaseSignOut(auth);
              setUser(null);
            }
          } else {
            setUser(firebaseUser);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error in auth state change handler:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google: ", error);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      return true;
    } catch (error) {
      console.error("Error signing in with email: ", error);
      return false;
    }
  }

  const signUpWithEmail = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      return true;
    } catch (error) {
      console.error("Error signing up with email: ", error);
      return false;
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const updateDisplayName = async (name: string) => {
    if (!user) return false;
    try {
      await updateProfile(user, { displayName: name });
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { displayName: name }, { merge: true });

      const updatedUser = Object.assign(Object.create(Object.getPrototypeOf(user)), user);
      updatedUser.displayName = name;
      setUser(updatedUser);
      return true;
    } catch (error) {
      console.error("Error updating display name: ", error);
      return false;
    }
  }

  const linkPassword = async (password: string) => {
    if (!user || !user.email) return false;
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await linkWithCredential(user, credential);
      return true;
    } catch (error) {
      console.error("Error linking password: ", error);
      return false;
    }
  }

  const value = { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, updateDisplayName, linkPassword };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
