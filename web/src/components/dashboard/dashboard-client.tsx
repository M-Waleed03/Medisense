"use client";

import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Bot, FileText, HeartPulse, ShieldCheck, Sparkles, TrendingUp, UserRound } from "lucide-react";
import { apiGet } from "@/lib/api";
import { percent } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { ChatMessage, ReportRecord, SymptomRecord, UserProfile } from "@/types/medisense";

type RecommendationRecord = { id: string; title?: string; message?: string; text?: string; created_at: string };
type TextSymptomRecord = { id: string; text?: string; result?: { predictedDisease?: string; confidence?: number }; created_at: string };
type History = {
  symptoms: SymptomRecord[];
  textSymptoms: TextSymptomRecord[];
  reports: ReportRecord[];
  messages: ChatMessage[];
  recommendations: RecommendationRecord[];
};

export function DashboardClient() {
  const { data, isLoading, error } = useQuery({ queryKey: ["history"], queryFn: () => apiGet<History>("/history") });
  const { data: profileData } = useQuery({ queryKey: ["dashboard-profile"], queryFn: () => apiGet<{ profile: UserProfile }>("/profile"), retry: 1 });
  const symptoms = data?.symptoms ?? [];
  const textSymptoms = data?.textSymptoms ?? [];
  const reports = data?.reports ?? [];
  const messages = data?.messages ?? [];
  const recommendations = data?.recommendations ?? [];
  const profile = profileData?.profile;
  const latest = symptoms[0];
  const latestText = textSymptoms[0];
  const latestReport = reports[0];
  const profileFields = [profile?.name, profile?.age, profile?.gender, profile?.blood_group, profile?.height_cm, profile?.weight_kg, profile?.emergency_contact];
  const profileCompletion = profile ? Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100) : 0;
  const confidenceData = symptoms.slice(0, 8).reverse().map((item, index) => ({ name: `Check ${index + 1}`, confidence: Math.round((item.confidence_score ?? 0) * 100) }));
  const reportData = reports.slice(0, 10).reverse().map((item, index) => ({
    name: `R${index + 1}`,
    platelets: item.platelets ?? undefined,
    wbc: item.wbc ?? undefined,
    hemoglobin: item.hemoglobin ?? undefined
  }));
  const riskSummary = latest?.risk_level ?? latestReport?.riskLevel ?? "No risk signal yet";
  const generatedRecommendations = [
    latest?.recommendations,
    latestReport?.diagnosis,
    latestText?.result?.predictedDisease ? `Text symptoms suggest ${latestText.result.predictedDisease}.` : null
  ].filter(Boolean) as string[];
  const recommendationItems = recommendations.length > 0
    ? recommendations.slice(0, 4).map((item) => item.message ?? item.text ?? item.title ?? "Recommendation saved")
    : generatedRecommendations.slice(0, 4);

  if (isLoading) return <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Card key={i} className="h-32 animate-pulse" />)}</div>;
  if (error) return <Card className="text-red-700">Unable to load dashboard from Firestore. Sign in again, check Firebase rules, then refresh.</Card>;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Risk summary" value={riskSummary} icon={ShieldCheck} tone="blue" />
        <Metric title="Latest prediction" value={latest?.predicted_disease ?? latestText?.result?.predictedDisease ?? "No checks"} icon={HeartPulse} tone="teal" />
        <Metric title="Latest report" value={latestReport?.diagnosis ? latestReport.diagnosis.slice(0, 34) : "No reports"} icon={FileText} tone="purple" />
        <Metric title="Profile complete" value={`${profileCompletion}%`} icon={UserRound} tone="slate" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.75fr]">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-white/80 bg-white/70 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">Prediction confidence</h2>
                <p className="mt-1 text-sm text-slate-500">Real symptom checks saved under your authenticated Firebase user.</p>
              </div>
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="p-5">
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
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="confidence" stroke="#3B82F6" fill="url(#confidence)" />
                </AreaChart>
              </ResponsiveContainer>
            </div> : <EmptyState text="Run a symptom check to start building your prediction confidence chart." />}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-bold">Recommendations</h2>
          <div className="mt-4 space-y-3">
            {recommendationItems.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-lg border border-slate-100 bg-white/72 p-3 text-sm leading-6 text-slate-700">
                {item}
              </div>
            ))}
            {recommendationItems.length === 0 && <EmptyState text="Recommendations appear after symptom checks, report analysis, or saved recommendation records." />}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <TrendCard title="Platelet graph" data={reportData} dataKey="platelets" stroke="#3B82F6" empty="Upload CBC reports to build platelet trends from real OCR output." />
        <TrendCard title="WBC graph" data={reportData} dataKey="wbc" stroke="#14B8A6" empty="Upload CBC reports to build WBC trends from real OCR output." />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Timeline title="Symptom history" icon={Activity} items={symptoms.slice(0, 4).map((item) => `${item.predicted_disease} - ${percent(item.confidence_score)} confidence`)} empty="No structured symptom checks yet." />
        <Timeline title="Report history" icon={FileText} items={reports.slice(0, 4).map((item) => `${item.file_name ?? "Report"} - ${item.riskLevel ?? "low"} risk`)} empty="No medical reports uploaded yet." />
        <Timeline title="Chatbot history" icon={Bot} items={messages.slice(0, 4).map((item) => item.user_message)} empty="Ask MEDISENSE a question to save chatbot history." />
      </div>

      <Card>
        <h2 className="text-lg font-bold">Health profile snapshot</h2>
        <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
          <Snapshot label="Name" value={profile?.name ?? "Complete profile"} />
          <Snapshot label="Blood group" value={profile?.blood_group ?? "Not set"} />
          <Snapshot label="Allergies" value={profile?.allergies?.length ? profile.allergies.join(", ") : "None recorded"} />
          <Snapshot label="Emergency contact" value={profile?.emergency_contact ?? "Not set"} />
        </div>
      </Card>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-slate-200 bg-white/60 p-6 text-sm text-slate-500">{text}</div>;
}

function Metric({ title, value, icon: Icon, tone }: { title: string; value: string; icon: typeof HeartPulse; tone: "blue" | "teal" | "purple" | "slate" }) {
  const toneClass = tone === "teal" ? "bg-teal-50 text-teal-600" : tone === "purple" ? "bg-violet-50 text-violet-600" : tone === "slate" ? "bg-slate-100 text-slate-700" : "bg-blue-50 text-primary";
  return (
    <Card>
      <span className={`mb-4 grid h-11 w-11 place-items-center rounded-lg ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 line-clamp-2 text-2xl font-black leading-tight">{value}</p>
    </Card>
  );
}

function TrendCard({ title, data, dataKey, stroke, empty }: { title: string; data: Array<Record<string, string | number | undefined>>; dataKey: "platelets" | "wbc"; stroke: string; empty: string }) {
  const usable = data.some((item) => item[dataKey] !== undefined);
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold">{title}</h2>
        <TrendingUp className="h-5 w-5 text-primary" />
      </div>
      {usable ? (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey={dataKey} stroke={stroke} strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : <EmptyState text={empty} />}
    </Card>
  );
}

function Timeline({ title, icon: Icon, items, empty }: { title: string; icon: typeof Activity; items: string[]; empty: string }) {
  return (
    <Card>
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item, index) => <p key={`${item}-${index}`} className="rounded-lg bg-white/72 p-3 text-sm text-slate-700">{item}</p>)}
        {items.length === 0 && <EmptyState text={empty} />}
      </div>
    </Card>
  );
}

function Snapshot({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white/72 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 font-semibold text-slate-800">{value}</p>
    </div>
  );
}
