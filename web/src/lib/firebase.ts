"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { browserLocalPersistence, GoogleAuthProvider, setPersistence, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { env, hasFirebaseConfig } from "@/lib/env";

const firebaseConfig = {
  apiKey: env.firebase.apiKey,
  authDomain: env.firebase.authDomain,
  projectId: env.firebase.projectId,
  storageBucket: env.firebase.storageBucket,
  messagingSenderId: env.firebase.messagingSenderId,
  appId: env.firebase.appId,
  measurementId: env.firebase.measurementId
};

export const firebaseApp = hasFirebaseConfig ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;
export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const db = firebaseApp ? getFirestore(firebaseApp) : null;
export const googleProvider = new GoogleAuthProvider();

if (auth) {
  void setPersistence(auth, browserLocalPersistence);
}

export function requireFirebase() {
  if (!auth || !db) {
    throw new Error("Firebase is not configured. Check NEXT_PUBLIC_FIREBASE_* values in .env.local.");
  }
  return { auth, db };
}
