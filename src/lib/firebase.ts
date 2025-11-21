
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "webhook-time-machine",
  "appId": "1:49831043903:web:aed56ce04686f71f62e98a",
  "storageBucket": "webhook-time-machine.appspot.com",
  "apiKey": "AIzaSyA8Q29KYnFL6mn1c30xrjoF4mndf1jjMUg",
  "authDomain": "webhook-time-machine.firebaseapp.com",
  "messagingSenderId": "49831043903"
};

// Initialize Firebase
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const googleProvider = new GoogleAuthProvider();

// Connect to emulators if in development, checking for window to ensure it's client-side
if (typeof window !== 'undefined' && window.location.hostname === "localhost") {
  // Point to the emulators. Note that this should only be called once.
  try {
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "localhost", 8080);
    console.log("Connected to Firebase emulators");
  } catch (error) {
    // This can happen with hot-reloading. We'll log it but it's usually safe to ignore.
    if ((error as any).code !== 'failed-precondition') {
        console.warn("Could not connect to Firebase emulators. This might be due to hot-reloading. Error:", error);
    }
  }
}


export { firebaseApp, auth, db, googleProvider };
