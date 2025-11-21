
import * as admin from 'firebase-admin';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// This is a server-side only file.

let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // Local development: Use the service account from .env.local
      console.log('Initializing Firebase Admin SDK with service account...');
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized successfully (local).');
    } else {
      // Production (App Hosting): Use Application Default Credentials
      console.log('Initializing Firebase Admin SDK for App Hosting...');
      admin.initializeApp();
      console.log('Firebase Admin SDK initialized successfully (App Hosting).');
    }
    db = getFirestore();
    auth = getAdminAuth();
  } catch (error: any) {
     console.error('[CRITICAL-ERROR] Firebase Admin SDK initialization failed:', error.message);
     // Do not exit process, just log the error. The app will run but backend features will fail.
  }
} else {
    // If already initialized, just get the instances
    db = getFirestore();
    auth = getAdminAuth();
}


// Export the initialized services.
export { db, auth, admin as adminSDK };
