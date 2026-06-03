import { firebaseDb, firebaseDbReady } from "@/lib/firebase-db";
import { localDb } from "@/lib/local-db";

const provider = import.meta.env.VITE_DATA_PROVIDER;
const wantsFirebase = provider === "firebase";

if (wantsFirebase && !firebaseDbReady) {
  console.warn(
    "[Data] VITE_DATA_PROVIDER=firebase, mas as variáveis VITE_FIREBASE_* ainda não estão completas. Fallback para localStorage.",
  );
}

export const dataStore = wantsFirebase && firebaseDbReady ? firebaseDb : localDb;
export const isUsingFirebase = wantsFirebase && firebaseDbReady;
