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
import { HoloPanel, SignalBadge } from "@/components/ui/premium";

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
      {error && <Card className="text-sm text-starlight lg:col-span-2">Settings could not be loaded from Firestore. Sign in again, check Firebase rules, and try again.</Card>}
      <HoloPanel>
        <UserRound className="mb-4 h-5 w-5 text-starlight" />
        <SignalBadge>Account</SignalBadge>
        <h2 className="mt-4 font-arcadiaDisplay text-heading-sm font-light text-starlight">Account settings</h2>
        <p className="mt-2 text-sm text-silver">Manage the profile connected to your authenticated MEDISENSE account.</p>
        <Link href="/profile" className={buttonStyles({ className: "mt-4", variant: "outline" })}>Open profile</Link>
      </HoloPanel>
      <HoloPanel>
        <Shield className="mb-4 h-5 w-5 text-starlight" />
        <SignalBadge>Security</SignalBadge>
        <h2 className="mt-4 font-arcadiaDisplay text-heading-sm font-light text-starlight">Security settings</h2>
        <p className="mt-2 text-sm text-silver">Use Firebase secure sessions and reset your password by email.</p>
        <Button className="mt-4" variant="outline" onClick={resetPassword}>Send reset email</Button>
        <Button className="ml-2 mt-4" onClick={logout}>Logout</Button>
      </HoloPanel>
      <HoloPanel>
        <Bell className="mb-4 h-5 w-5 text-starlight" />
        <h2 className="font-arcadiaDisplay text-heading-sm font-light text-starlight">Notification preferences</h2>
        <div className="mt-4 space-y-3">
          <Toggle label="Email notifications" checked={settings.email_notifications} onChange={(value) => update.mutate({ email_notifications: value })} />
          <Toggle label="Report alerts" checked={settings.report_alerts} onChange={(value) => update.mutate({ report_alerts: value })} />
          <Toggle label="Symptom reminders" checked={settings.symptom_reminders} onChange={(value) => update.mutate({ symptom_reminders: value })} />
        </div>
      </HoloPanel>
      <HoloPanel>
        <Moon className="mb-4 h-5 w-5 text-starlight" />
        <h2 className="font-arcadiaDisplay text-heading-sm font-light text-starlight">Theme preferences</h2>
        <select className="premium-input mt-4" value={settings.theme} onChange={(event) => update.mutate({ theme: event.target.value as UserSettings["theme"] })}>
          <option value="light">Command-center dark</option>
          <option value="system">Use system preference</option>
        </select>
      </HoloPanel>
      <HoloPanel className="lg:col-span-2">
        <Trash2 className="mb-4 h-5 w-5 text-starlight" />
        <h2 className="font-arcadiaDisplay text-heading-sm font-light text-starlight">Delete account</h2>
        <p className="mt-2 text-sm text-silver">Deletion must be handled by a protected backend admin endpoint to remove auth and database records together.</p>
        <Button className="mt-4" variant="outline" onClick={deleteAccount}>Request deletion</Button>
      </HoloPanel>
      {message && <Card className="text-sm text-starlight lg:col-span-2">{update.isPending && <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />}<Save className="mr-2 inline h-4 w-4 text-starlight" />{message}</Card>}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between border border-lead/35 bg-graphite/40 p-3 text-sm font-medium text-silver">
      {label}
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}
