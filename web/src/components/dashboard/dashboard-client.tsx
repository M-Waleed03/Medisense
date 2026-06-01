"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Calendar, FileText, Heart, Shield, TrendingUp, User } from "lucide-react";
import { apiGet } from "@/lib/api";
import { percent } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { AiAvatar, HoloPanel, MetricRing, Reveal } from "@/components/ui/premium";
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

const tooltipStyle = {
  backgroundColor: "#1e1e2a",
  border: "1px solid rgba(112,112,125,0.45)",
  borderRadius: 0,
  color: "#ededf3"
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
  const latestConfidence = Math.round(((latest?.confidence_score ?? latestText?.result?.confidence ?? 0) <= 1 ? (latest?.confidence_score ?? latestText?.result?.confidence ?? 0) * 100 : (latest?.confidence_score ?? latestText?.result?.confidence ?? 0)));
  const riskValue = riskToValue(latest?.risk_level ?? latestReport?.riskLevel);
  const healthScore = Math.max(46, Math.min(98, Math.round((profileCompletion * 0.32) + (reports.length ? 28 : 12) + (symptoms.length ? 24 : 10) + (messages.length ? 12 : 4) - riskValue * 0.08)));
  const confidenceData = symptoms.slice(0, 8).reverse().map((item, index) => ({ name: `Check ${index + 1}`, confidence: Math.round((item.confidence_score ?? 0) * 100) }));
  const reportData = reports.slice(0, 10).reverse().map((item, index) => ({
    name: `R${index + 1}`,
    platelets: item.platelets ?? undefined,
    wbc: item.wbc ?? undefined,
    hemoglobin: item.hemoglobin ?? undefined
  }));
  const recommendationItems = recommendations.length > 0
    ? recommendations.slice(0, 5).map((item) => item.message ?? item.text ?? item.title ?? "Recommendation saved")
    : [
        latest?.recommendations,
        latestReport?.diagnosis,
        latestText?.result?.predictedDisease ? `Text symptoms suggest ${latestText.result.predictedDisease}.` : null,
        reports.length === 0 ? "Upload a CBC report to unlock platelet and WBC trend monitoring." : null
      ].filter(Boolean) as string[];

  if (isLoading) return <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Card key={index} className="h-36 animate-pulse" />)}</div>;
  if (error) return <Card className="text-sm text-starlight">Unable to load dashboard from Firestore. Sign in again, check Firebase rules, then refresh.</Card>;

  return (
    <div className="space-y-8">
      <Reveal>
        <HoloPanel className="p-7 md:p-9">
          <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <AiAvatar size="lg" />
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-silver">Welcome back</p>
                <h2 className="mt-3 font-arcadiaDisplay text-heading-lg font-light text-starlight">
                  Good to see you{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-silver">
                  Your health workspace is updated with the latest diagnostics, reports, and AI guidance.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <StatBox label="Score" value={`${healthScore}%`} />
              <StatBox label="Reports" value={String(reports.length)} />
              <StatBox label="Chats" value={String(messages.length)} />
            </div>
          </div>
        </HoloPanel>
      </Reveal>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Latest diagnosis" value={latest?.predicted_disease ?? latestText?.result?.predictedDisease ?? "No checks"} icon={Heart} />
        <MetricCard title="Report analysis" value={latestReport?.diagnosis ? latestReport.diagnosis.slice(0, 32) : "No reports"} icon={FileText} />
        <MetricCard title="Risk level" value={latest?.risk_level ?? latestReport?.riskLevel ?? "Low"} icon={Shield} />
        <MetricCard title="Profile complete" value={`${profileCompletion}%`} icon={User} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Reveal>
          <HoloPanel className="h-full">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-silver">Health score</h3>
              <Activity className="h-4 w-4 text-starlight" />
            </div>
            <MetricRing value={healthScore} label="" />
            <div className="mt-7 grid grid-cols-2 gap-3">
              <SmallStat label="Risk load" value={`${riskValue}%`} />
              <SmallStat label="Confidence" value={`${latestConfidence || 0}%`} />
            </div>
          </HoloPanel>
        </Reveal>

        <Reveal delay={0.04}>
          <HoloPanel className="lg:col-span-2">
            <div className="mb-5 flex items-center gap-3">
              <TrendingUp className="h-4 w-4 text-starlight" />
              <h3 className="text-sm font-medium text-starlight">Prediction confidence</h3>
            </div>
            {confidenceData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={confidenceData}>
                    <defs>
                      <linearGradient id="confidence-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5266eb" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#5266eb" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(112,112,125,0.28)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#c3c3cc" }} stroke="#70707d" />
                    <YAxis tick={{ fontSize: 12, fill: "#c3c3cc" }} stroke="#70707d" domain={[0, 100]} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="confidence" stroke="#5266eb" strokeWidth={2} fill="url(#confidence-grad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyState text="Run a symptom check to build your confidence graph." />}
          </HoloPanel>
        </Reveal>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <TrendCard title="Platelet levels" data={reportData} dataKey="platelets" empty="Upload CBC reports to track platelet trends." />
        <TrendCard title="WBC activity" data={reportData} dataKey="wbc" empty="Upload CBC reports to track WBC trends." />
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.62fr_1fr]">
        <Reveal>
          <HoloPanel>
            <h3 className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-silver">AI recommendations</h3>
            <div className="space-y-3">
              {recommendationItems.slice(0, 5).map((item, index) => (
                <motion.div key={`${item}-${index}`} whileHover={{ x: 3 }} className="border border-lead/35 bg-graphite/46 p-4 text-sm leading-6 text-silver">
                  {item}
                </motion.div>
              ))}
              {recommendationItems.length === 0 && <EmptyState text="Recommendations appear after health checks and report analysis." />}
            </div>
          </HoloPanel>
        </Reveal>

        <Reveal delay={0.04}>
          <HoloPanel>
            <div className="mb-5 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-starlight" />
              <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-silver">Health timeline</h3>
            </div>
            <div className="space-y-5">
              <TimelineSection title="Symptoms" items={symptoms.slice(0, 3).map((item) => `${item.predicted_disease} - ${percent(item.confidence_score)} confidence`)} empty="No symptom checks yet." />
              <TimelineSection title="Reports" items={reports.slice(0, 3).map((item) => `${item.file_name ?? "Report"} - ${item.riskLevel ?? "low"} risk`)} empty="No reports uploaded yet." />
              <TimelineSection title="Messages" items={messages.slice(0, 3).map((item) => `${item.user_message?.substring(0, 40) ?? "Message"}...`)} empty="No conversations yet." />
            </div>
          </HoloPanel>
        </Reveal>
      </div>

      <Reveal>
        <HoloPanel>
          <h3 className="mb-5 text-xs font-medium uppercase tracking-[0.16em] text-silver">Your profile</h3>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <ProfileField label="Name" value={profile?.name ?? "Complete profile"} />
            <ProfileField label="Blood type" value={profile?.blood_group ?? "Not set"} />
            <ProfileField label="Age" value={profile?.age ? `${profile.age} yrs` : "Not set"} />
            <ProfileField label="Emergency contact" value={profile?.emergency_contact ?? "Not set"} />
          </div>
        </HoloPanel>
      </Reveal>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-lead/30 bg-graphite/50 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-silver">{label}</p>
      <p className="mt-2 font-arcadiaDisplay text-heading-sm font-light text-starlight">{value}</p>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-lead/30 bg-graphite/44 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-silver">{label}</p>
      <p className="mt-2 text-xl font-medium text-starlight">{value}</p>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon }: { title: string; value: string; icon: typeof Heart }) {
  return (
    <motion.div whileHover={{ y: -2 }} className="border border-lead/35 bg-midnight-slate/72 p-5 transition-colors hover:bg-graphite/65">
      <div className="mb-4 grid h-10 w-10 place-items-center rounded-[4px] border border-ghost-blue/15 bg-graphite text-starlight">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm text-silver">{title}</p>
      <p className="mt-2 truncate font-arcadiaDisplay text-heading-sm font-light text-starlight">{value}</p>
    </motion.div>
  );
}

function TrendCard({ title, data, dataKey, empty }: { title: string; data: Array<Record<string, string | number | undefined>>; dataKey: "platelets" | "wbc" | "hemoglobin"; empty: string }) {
  const usable = data.some((item) => item[dataKey] !== undefined);

  return (
    <Reveal>
      <HoloPanel>
        <h3 className="mb-5 text-sm font-medium text-starlight">{title}</h3>
        {usable ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(112,112,125,0.28)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#c3c3cc" }} stroke="#70707d" />
                <YAxis tick={{ fontSize: 12, fill: "#c3c3cc" }} stroke="#70707d" />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey={dataKey} stroke="#5266eb" strokeWidth={2} dot={{ r: 3, fill: "#5266eb" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyState text={empty} />}
      </HoloPanel>
    </Reveal>
  );
}

function TimelineSection({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-silver">{title}</p>
      <div className="space-y-2">
        {items.map((item, index) => <p key={`${item}-${index}`} className="border border-lead/30 bg-graphite/44 p-3 text-sm text-silver">{item}</p>)}
        {items.length === 0 && <p className="border border-lead/30 bg-graphite/44 p-3 text-sm text-silver">{empty}</p>}
      </div>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-lead/30 bg-graphite/44 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-silver">{label}</p>
      <p className="mt-2 text-sm font-medium text-starlight">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="border border-dashed border-lead/45 bg-graphite/32 p-6 text-center text-sm text-silver">{text}</div>;
}

function riskToValue(risk?: string) {
  const normalized = (risk ?? "").toLowerCase();
  if (normalized.includes("high")) return 82;
  if (normalized.includes("moderate") || normalized.includes("medium")) return 56;
  if (normalized.includes("low")) return 24;
  return 12;
}
