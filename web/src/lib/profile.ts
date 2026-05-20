"use client";

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { requireFirebase } from "@/lib/firebase";

export async function ensureClientProfile() {
  const { auth, db } = requireFirebase();
  const user = auth.currentUser;
  if (!user) return null;

  const ref = doc(db, "users", user.uid);
  const snapshot = await getDoc(ref);
  const now = serverTimestamp();
  const base = {
    userId: user.uid,
    fullName: user.displayName ?? user.email?.split("@")[0] ?? "MEDISENSE user",
    email: user.email ?? "",
    profileImage: user.photoURL ?? "",
    updatedAt: now,
    lastSeenAt: now
  };

  await setDoc(ref, snapshot.exists() ? base : { ...base, createdAt: now }, { merge: true });
  return user.uid;
}
