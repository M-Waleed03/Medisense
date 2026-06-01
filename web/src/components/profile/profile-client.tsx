"use client";

import Image from "next/image";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Save, UploadCloud } from "lucide-react";
import { apiGet, apiPatch, apiUpload } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HoloPanel, SignalBadge } from "@/components/ui/premium";
import type { UserProfile } from "@/types/medisense";

export function ProfileClient() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["profile"], queryFn: () => apiGet<{ profile: UserProfile }>("/profile") });
  const profile = data?.profile;
  const [form, setForm] = useState<Partial<UserProfile>>({});
  const [message, setMessage] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const update = useMutation({
    mutationFn: (payload: Partial<UserProfile>) => apiPatch<{ profile: UserProfile }>("/profile", payload),
    onSuccess: async () => {
      setMessage("Profile saved securely.");
      await refetch();
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Unable to save profile.")
  });

  const value = <K extends keyof UserProfile>(key: K) => (form[key] ?? profile?.[key] ?? "") as string | number;

  function setField(key: keyof UserProfile, next: string) {
    setForm((current) => ({ ...current, [key]: next === "" ? null : next }));
  }

  function setList(key: "medical_conditions" | "allergies", next: string) {
    setForm((current) => ({ ...current, [key]: next.split(",").map((item) => item.trim()).filter(Boolean) }));
  }

  async function uploadAvatar(file: File | null) {
    if (!file || !profile) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setMessage("Profile photo must be PNG, JPG, or WEBP.");
      return;
    }
    setUploadingAvatar(true);
    try {
      const uploaded = await apiUpload<{ secureUrl: string }>("/profile-image", file);
      await update.mutateAsync({ profileImage: uploaded.secureUrl });
      setMessage("Profile photo updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to upload profile photo.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  if (isLoading) return <Card className="h-72 max-w-4xl animate-pulse" />;
  if (error) return <Card className="max-w-4xl text-sm text-starlight">Profile could not be loaded from Firestore. Sign in again, check Firebase rules, and refresh.</Card>;

  return (
    <HoloPanel className="max-w-5xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <SignalBadge>Patient identity graph</SignalBadge>
          <h2 className="mt-4 font-arcadiaDisplay text-heading font-light text-starlight">Health profile</h2>
          <p className="mt-2 text-sm text-silver">This information is stored in Firestore and used to personalize history and guidance.</p>
        </div>
        <Button onClick={() => update.mutate(form)} disabled={update.isPending}>
          {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </Button>
      </div>
      <div className="mb-6 flex flex-col gap-4 border border-lead/35 bg-graphite/35 p-4 sm:flex-row sm:items-center">
        <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-[4px] border border-ghost-blue/15 bg-graphite text-3xl font-medium text-starlight">
          {profile?.avatar_url ? (
            <div className="relative h-full w-full">
              <Image src={profile.avatar_url} alt="Profile photo" fill className="object-cover" />
            </div>
          ) : (
            (profile?.name?.slice(0, 1) ?? "M")
          )}
        </div>
        <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-pill border border-lead/45 bg-transparent px-5 text-sm font-medium text-silver hover:bg-ghost-blue/10 hover:text-starlight">
          {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          Upload profile photo
          <input className="hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => uploadAvatar(event.target.files?.[0] ?? null)} />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Full name" value={value("name")} onChange={(next) => setField("name", next)} />
        <Field label="Email" value={profile?.email ?? ""} disabled />
        <Field label="Age" type="number" value={value("age")} onChange={(next) => setField("age", next)} />
        <Field label="Gender" value={value("gender")} onChange={(next) => setField("gender", next)} />
        <Field label="Weight (kg)" type="number" value={value("weight_kg")} onChange={(next) => setField("weight_kg", next)} />
        <Field label="Height (cm)" type="number" value={value("height_cm")} onChange={(next) => setField("height_cm", next)} />
        <Field label="Blood group" value={value("blood_group")} onChange={(next) => setField("blood_group", next)} />
        <Field label="Phone" value={value("phone")} onChange={(next) => setField("phone", next)} />
        <Field label="Medical conditions" value={(form.medical_conditions ?? profile?.medical_conditions ?? []).join(", ")} onChange={(next) => setList("medical_conditions", next)} />
        <Field label="Allergies" value={(form.allergies ?? profile?.allergies ?? []).join(", ")} onChange={(next) => setList("allergies", next)} />
        <Field label="Emergency contact" value={value("emergency_contact")} onChange={(next) => setField("emergency_contact", next)} />
        <Field label="Address" value={value("address")} onChange={(next) => setField("address", next)} />
      </div>
      {message && <p className="mt-5 border border-lead/40 bg-graphite/60 p-3 text-sm text-starlight">{message}</p>}
    </HoloPanel>
  );
}

function Field({ label, value, onChange, disabled, type = "text" }: { label: string; value: string | number; onChange?: (value: string) => void; disabled?: boolean; type?: string }) {
  return (
    <label className="block text-sm font-medium text-silver">
      {label}
      <input
        className="premium-input disabled:opacity-60"
        type={type}
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </label>
  );
}
