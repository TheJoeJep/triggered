
import admin from 'firebase-admin';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// This is a server-side only file.

// This is a server-side only file.

if (process.env.NODE_ENV === 'development') {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  }
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  }
}

let dbInstanceNamed: admin.firestore.Firestore | undefined;
let authInstance: admin.auth.Auth | undefined;
let initError: string | null = null;

function initializeFirebaseAdmin() {
  if (dbInstanceNamed && authInstance) {
    return { db: dbInstanceNamed, auth: authInstance };
  }

  try {
    let app: admin.app.App;

    console.log(`[FirebaseAdmin] NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`[FirebaseAdmin] Existing apps: ${admin.apps.length}`);

    const appName = 'trigger-app';
    const existingApp = admin.apps.find(a => a?.name === appName);

    if (!existingApp) {
      if (process.env.NODE_ENV === 'development') {
        // Local development with Emulators
        console.log('[FirebaseAdmin] Initializing for Local Emulators...');
        app = admin.initializeApp({ projectId: 'demo-project' }, appName);
      } else {
        // Production - Use Application Default Credentials
        console.log('[FirebaseAdmin] Initializing for Production...');
        app = admin.initializeApp({}, appName);
      }
    } else {
      console.log('[FirebaseAdmin] Using existing app.');
      app = existingApp;
    }

    console.log('[FirebaseAdmin] App initialized. Getting Firestore...');
    dbInstanceNamed = getFirestore(app);
    console.log(`[FirebaseAdmin] Firestore got: ${!!dbInstanceNamed}`);

    console.log('[FirebaseAdmin] Firestore got. Getting Auth...');
    authInstance = getAdminAuth(app);
    console.log('[FirebaseAdmin] Firebase Admin SDK initialized successfully.');

  } catch (error: any) {
    console.error('[CRITICAL-ERROR] Firebase Admin SDK initialization failed:', error);
    initError = error.message || String(error);
    // We don't re-throw, so db/auth might be undefined.
  }

  return { db: dbInstanceNamed, auth: authInstance };
}

// Export a proxy or getter to ensure initialization happens on access
export const db = new Proxy({}, {
  get: (_target, prop) => {
    const result = initializeFirebaseAdmin();
    if (!result.db) throw new Error(`Firestore not initialized. Error: ${initError}`);
    return (result.db as any)[prop];
  }
}) as admin.firestore.Firestore;

export const auth = new Proxy({}, {
  get: (_target, prop) => {
    const result = initializeFirebaseAdmin();
    if (!result.auth) throw new Error(`Auth not initialized. Error: ${initError}`);
    return (result.auth as any)[prop];
  }
}) as admin.auth.Auth;

export { admin as adminSDK, initError };
