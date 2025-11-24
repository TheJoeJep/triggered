
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

let dbInstance: admin.firestore.Firestore | undefined;
let authInstance: admin.auth.Auth | undefined;
let initError: string | null = null;

function initializeFirebaseAdmin() {
  if (dbInstance && authInstance) {
    return { db: dbInstance, auth: authInstance };
  }

  try {
    let app: admin.app.App;

    console.log(`[FirebaseAdmin] NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`[FirebaseAdmin] Existing apps: ${admin.apps.length}`);

    if (!admin.apps.length) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // Local development with Service Account
        console.log('[FirebaseAdmin] Initializing with service account...');
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else {
        // Local development with Emulators (Fallback) or ADC
        console.log('[FirebaseAdmin] Initializing for Emulators/ADC...');
        app = admin.initializeApp({ projectId: 'demo-project' });
      }
    } else {
      console.log('[FirebaseAdmin] Using existing default app.');
      app = admin.app();
    }

    console.log('[FirebaseAdmin] App initialized. Getting Firestore...');
    dbInstance = getFirestore(app);
    console.log(`[FirebaseAdmin] Firestore got: ${!!dbInstance}`);

    console.log('[FirebaseAdmin] Firestore got. Getting Auth...');
    authInstance = getAdminAuth(app);
    console.log('[FirebaseAdmin] Firebase Admin SDK initialized successfully.');

  } catch (error: any) {
    console.error('[CRITICAL-ERROR] Firebase Admin SDK initialization failed:', error);
    initError = error.message || String(error);
    // We don't re-throw, so db/auth might be undefined.
  }

  return { db: dbInstance, auth: authInstance };
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
