"use client";

import { FormEvent, useEffect, useState } from "react";
import { Chrome, Loader2 } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile
} from "firebase/auth";
import { ensureClientProfile } from "@/lib/profile";
import { googleProvider, requireFirebase } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { AiAvatar, HoloPanel, SignalBadge } from "@/components/ui/premium";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { auth } = requireFirebase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      await ensureClientProfile();
      location.href = "/dashboard";
    });
    return unsubscribe;
  }, [auth]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (mode === "signup") {
        const response = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) await updateProfile(response.user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      await ensureClientProfile();
      location.href = "/dashboard";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    setMessage("");
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      await ensureClientProfile();
      location.href = "/dashboard";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    if (!email) {
      setMessage("Enter your email first, then request a reset link.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send reset email.");
    }
  }

  return (
    <HoloPanel className="mx-auto w-full max-w-md p-7">
      <div className="mb-6">
        <AiAvatar />
        <div className="mt-5"><SignalBadge>{mode === "login" ? "Secure clinical session" : "Create care identity"}</SignalBadge></div>
        <h1 className="mt-5 font-arcadiaDisplay text-heading font-light text-starlight">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-3 text-sm leading-6 text-silver">Use the same Firebase-backed MEDISENSE account across web and mobile.</p>
      </div>
      <form className="space-y-4" onSubmit={submit}>
        {mode === "signup" && (
          <input className="premium-input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
        )}
        <input className="premium-input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="premium-input" type="password" placeholder="Password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "login" ? "Sign in" : "Sign up"}
        </Button>
      </form>
      <Button type="button" variant="outline" className="mt-3 w-full" onClick={google} disabled={loading}>
        <Chrome className="h-4 w-4" />
        Continue with Google
      </Button>
      {mode === "login" && (
        <button className="mt-4 text-sm font-medium text-starlight" type="button" onClick={resetPassword}>
          Forgot password?
        </button>
      )}
      {message && <p className="mt-4 border border-lead/40 bg-graphite/70 p-3 text-sm text-starlight">{message}</p>}
    </HoloPanel>
  );
}
