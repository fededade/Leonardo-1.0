import { initializeApp } from 'firebase/app';
// @ts-ignore
import { getFirestore } from 'firebase/firestore';
// @ts-ignore
import { getStorage } from 'firebase/storage';

// ------------------------------------------------------------------
// CONFIGURAZIONE TRAMITE VARIABILI D'AMBIENTE (VERCEL / .ENV)
// Le chiavi non sono più scritte qui, ma lette da import.meta.env
// ------------------------------------------------------------------

// Accesso sicuro a import.meta.env
const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

// Controllo se la configurazione è stata caricata correttamente
export const isConfigured = !!firebaseConfig.apiKey;

if (!isConfigured) {
    console.warn("Firebase Config Keys are missing. Make sure .env file exists or Vercel Env Vars are set.");
}

// Initialize Firebase only if configured to avoid crash
const app = isConfigured ? initializeApp(firebaseConfig) : undefined;

// Export instances (or undefined if not configured, managed by App.tsx checks)
export const db = app ? getFirestore(app) : undefined as any;
export const storage = app ? getStorage(app) : undefined as any;