"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Bell, Loader2, Moon, Save, Shield, Trash2, UserRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { sendPasswordResetEmail, signOut } from "firebase/auth";
import { apiGet, apiPatch } from "@/lib/api";
import { requireFirebase } from "@/lib/firebase";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type UserSettings = {
  email_notifications: boolean;
  report_alerts: boolean;
  symptom_reminders: boolean;
  theme: "light" | "system";
};

const fallbackSettings: UserSettings = {
  email_notifications: true,
  report_alerts: true,
  symptom_reminders: false,
  theme: "light"
};

export function SettingsClient() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["settings"], queryFn: () => apiGet<{ settings: UserSettings }>("/settings") });
  const [message, setMessage] = useState("");
  const settings = data?.settings ?? fallbackSettings;

  const update = useMutation({
    mutationFn: (payload: Partial<UserSettings>) => apiPatch<{ settings: UserSettings }>("/settings", payload),
    onSuccess: async () => {
      setMessage("Settings saved.");
      await refetch();
    },
    onError: (err) => setMessage(err instanceof Error ? err.message : "Unable to save settings.")
  });

  async function resetPassword() {
    const { auth } = requireFirebase();
    const email = auth.currentUser?.email;
    if (!email) {
      setMessage("Sign in again before requesting a password reset.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send reset email.");
    }
  }

  async function logout() {
    await signOut(requireFirebase().auth);
    location.href = "/login";
  }

  async function deleteAccount() {
    setMessage("Account deletion requires a secure server-side admin flow. Contact support or add a service-role protected endpoint before enabling this action.");
  }

  if (isLoading) return <Card className="h-48 animate-pulse" />;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {error && <Card className="border-red-100 bg-red-50 text-sm text-red-700 lg:col-span-2">Settings could not be loaded from Firestore. Sign in again, check Firebase rules, and try again.</Card>}
      <Card>
        <UserRound className="mb-4 h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">Account settings</h2>
        <p className="mt-2 text-sm text-slate-600">Manage the profile connected to your authenticated MEDISENSE account.</p>
        <Link href="/profile" className={buttonStyles({ className: "mt-4", variant: "outline" })}>Open profile</Link>
      </Card>
      <Card>
        <Shield className="mb-4 h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">Security settings</h2>
        <p className="mt-2 text-sm text-slate-600">Use Firebase secure sessions and reset your password by email.</p>
        <Button className="mt-4" variant="outline" onClick={resetPassword}>Send reset email</Button>
        <Button className="ml-2 mt-4" onClick={logout}>Logout</Button>
      </Card>
      <Card>
        <Bell className="mb-4 h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">Notification preferences</h2>
        <div className="mt-4 space-y-3">
          <Toggle label="Email notifications" checked={settings.email_notifications} onChange={(value) => update.mutate({ email_notifications: value })} />
          <Toggle label="Report alerts" checked={settings.report_alerts} onChange={(value) => update.mutate({ report_alerts: value })} />
          <Toggle label="Symptom reminders" checked={settings.symptom_reminders} onChange={(value) => update.mutate({ symptom_reminders: value })} />
        </div>
      </Card>
      <Card>
        <Moon className="mb-4 h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">Theme preferences</h2>
        <select className="mt-4 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 outline-primary" value={settings.theme} onChange={(event) => update.mutate({ theme: event.target.value as UserSettings["theme"] })}>
          <option value="light">Light medical theme</option>
          <option value="system">Use system preference</option>
        </select>
      </Card>
      <Card className="lg:col-span-2">
        <Trash2 className="mb-4 h-5 w-5 text-red-500" />
        <h2 className="text-lg font-bold">Delete account</h2>
        <p className="mt-2 text-sm text-slate-600">Deletion must be handled by a protected backend admin endpoint to remove auth and database records together.</p>
        <Button className="mt-4" variant="outline" onClick={deleteAccount}>Request deletion</Button>
      </Card>
      {message && <Card className="text-sm text-slate-700 lg:col-span-2">{update.isPending && <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />}<Save className="mr-2 inline h-4 w-4 text-primary" />{message}</Card>}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-lg bg-white/70 p-3 text-sm font-semibold text-slate-700">
      {label}
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}
