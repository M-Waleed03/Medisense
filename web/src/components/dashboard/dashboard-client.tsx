"use client";

import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Bot, FileText, HeartPulse } from "lucide-react";
import { apiGet } from "@/lib/api";
import { percent } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { ChatMessage, ReportRecord, SymptomRecord, UserProfile } from "@/types/medisense";

type History = { symptoms: SymptomRecord[]; reports: ReportRecord[]; messages: ChatMessage[] };

export function DashboardClient() {
  const { data, isLoading, error } = useQuery({ queryKey: ["history"], queryFn: () => apiGet<History>("/history") });
  const { data: profileData } = useQuery({ queryKey: ["dashboard-profile"], queryFn: () => apiGet<{ profile: UserProfile }>("/profile"), retry: 1 });
  const symptoms = data?.symptoms ?? [];
  const reports = data?.reports ?? [];
  const messages = data?.messages ?? [];
  const profile = profileData?.profile;
  const latest = symptoms[0];
  const profileFields = [profile?.name, profile?.age, profile?.gender, profile?.blood_group, profile?.height_cm, profile?.weight_kg, profile?.emergency_contact];
  const profileCompletion = profile ? Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100) : 0;
  const confidenceData = symptoms.slice(0, 8).reverse().map((item, index) => ({ name: `Check ${index + 1}`, confidence: Math.round((item.confidence_score ?? 0) * 100) }));
  const reportData = reports.slice(0, 10).reverse().map((item, index) => ({
    name: `Report ${index + 1}`,
    platelets: item.platelets ?? undefined,
    wbc: item.wbc ?? undefined,
    hemoglobin: item.hemoglobin ?? undefined
  }));

  if (isLoading) return <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Card key={i} className="h-32 animate-pulse" />)}</div>;
  if (error) return <Card className="text-red-700">Unable to load dashboard. Sign in again or apply the Supabase schema migration, then refresh.</Card>;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Latest risk" value={latest?.predicted_disease ?? "No checks"} icon={HeartPulse} />
        <Metric title="Confidence" value={latest ? percent(latest.confidence_score) : "0%"} icon={Activity} />
        <Metric title="Latest platelets" value={reports[0]?.platelets ? reports[0].platelets.toLocaleString() : "No reports"} icon={FileText} />
        <Metric title="Profile complete" value={`${profileCompletion}%`} icon={Bot} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <h2 className="mb-4 text-lg font-bold">Prediction confidence</h2>
          {confidenceData.length > 0 ? <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={confidenceData}>
                <defs>
                  <linearGradient id="confidence" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="confidence" stroke="#3B82F6" fill="url(#confidence)" />
              </AreaChart>
            </ResponsiveContainer>
          </div> : <EmptyState text="Run a symptom check to start building your prediction history." />}
        </Card>
        <Card>
          <h2 className="text-lg font-bold">Recent guidance</h2>
          <div className="mt-4 space-y-3">
            {symptoms.slice(0, 4).map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-100 bg-white/70 p-3">
                <p className="font-semibold">{item.predicted_disease}</p>
                <p className="mt-1 text-sm text-slate-600">{item.recommendations}</p>
              </div>
            ))}
            {symptoms.length === 0 && <p className="text-sm text-slate-600">Run a symptom check to populate guidance.</p>}
          </div>
        </Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold">Health summary</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p>Name: {profile?.name ?? "Complete your profile"}</p>
            <p>Blood group: {profile?.blood_group ?? "Not set"}</p>
            <p>Allergies: {profile?.allergies?.length ? profile.allergies.join(", ") : "None recorded"}</p>
            <p>Emergency contact: {profile?.emergency_contact ?? "Not set"}</p>
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-bold">Recent chatbot history</h2>
          <div className="mt-4 space-y-3">
            {messages.slice(0, 3).map((item) => <p key={item.id} className="rounded-lg bg-white/70 p-3 text-sm text-slate-700">{item.user_message}</p>)}
            {messages.length === 0 && <EmptyState text="Ask the chatbot a health question to save conversation history." />}
          </div>
        </Card>
      </div>
      <Card>
        <h2 className="mb-4 text-lg font-bold">CBC trends from reports</h2>
        {reportData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="platelets" stroke="#3B82F6" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="wbc" stroke="#14B8A6" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="hemoglobin" stroke="#8B5CF6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-slate-600">Upload reports to build platelet, WBC, and hemoglobin trends from real OCR output.</p>
        )}
      </Card>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-slate-200 bg-white/60 p-6 text-sm text-slate-500">{text}</div>;
}

function Metric({ title, value, icon: Icon }: { title: string; value: string; icon: typeof HeartPulse }) {
  return (
    <Card>
      <Icon className="mb-4 h-5 w-5 text-primary" />
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </Card>
  );
}
