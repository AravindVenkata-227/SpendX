
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Added

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

// Explicitly check if the API key is available.
// This is crucial for server-side rendering and server components.
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  console.error(
    "CRITICAL ERROR: Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is missing or undefined in the server environment."
  );
  // For debugging purposes, let's log available NEXT_PUBLIC_ prefixed environment variables.
  // This can help confirm if .env.local is being loaded at all or if there's a typo in the variable name.
  const availableNextPublicVars = Object.keys(process.env).filter(key => key.startsWith("NEXT_PUBLIC_"));
  if (availableNextPublicVars.length > 0) {
    console.error("Available NEXT_PUBLIC_ environment variables found:", availableNextPublicVars);
  } else {
    console.error("No NEXT_PUBLIC_ environment variables found in process.env. This suggests .env.local might not be loaded or is empty.");
  }
  // It's also useful to know if ANY environment variables are loaded, though be cautious with logging all of them if sensitive data might be present.
  // console.error("All available process.env keys (first 10):", Object.keys(process.env).slice(0, 10));


  throw new Error(
    "Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is missing or undefined. " +
    "Please ensure it is correctly set in your .env.local file (at the project root) and that you have RESTARTED your development server. " +
    "Verify the variable name is spelled exactly 'NEXT_PUBLIC_FIREBASE_API_KEY'."
  );
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);
const auth = getAuth(app); // Added

export { app, db, auth }; // Added auth
