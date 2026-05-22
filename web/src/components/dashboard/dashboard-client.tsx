"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, Line, LineChart, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Bot, CalendarClock, FileText, HeartPulse, ShieldCheck, Sparkles, TrendingUp, UserRound } from "lucide-react";
import { apiGet } from "@/lib/api";
import { percent } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { AiAvatar, HoloPanel, MetricRing, PulseLine, Reveal, SignalBadge } from "@/components/ui/premium";
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

  if (isLoading) return <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Card key={i} className="h-36 animate-pulse" />)}</div>;
  if (error) return <Card className="text-red-700">Unable to load dashboard from Firestore. Sign in again, check Firebase rules, then refresh.</Card>;

  return (
    <div className="space-y-6">
      <Reveal>
        <section className="relative overflow-hidden rounded-lg border border-white/80 bg-ink p-6 text-white shadow-halo md:p-8">
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.18)_1px,transparent_0)] [background-size:36px_36px]" />
          <div className="relative grid gap-6 xl:grid-cols-[1fr_auto] xl:items-center">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <AiAvatar size="lg" />
              <div>
                <SignalBadge icon="pulse">Live healthcare cockpit</SignalBadge>
                <h2 className="mt-4 text-3xl font-black md:text-5xl">Good to see you{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 md:text-base">MEDISENSE is synthesizing your profile, symptom checks, report values, and chat context into a single clinical-grade view.</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <HeroStat label="Health score" value={`${healthScore}%`} />
              <HeroStat label="Reports" value={String(reports.length)} />
              <HeroStat label="Conversations" value={String(messages.length)} />
            </div>
          </div>
        </section>
      </Reveal>

      <div className="grid gap-5 xl:grid-cols-[0.86fr_1.4fr_0.82fr]">
        <Reveal>
          <HoloPanel className="h-full">
            <MetricRing value={healthScore} label="Health score" tone="teal" />
            <div className="mt-6 grid grid-cols-2 gap-3">
              <MiniMetric label="Risk load" value={`${riskValue}%`} />
              <MiniMetric label="Confidence" value={`${latestConfidence || 0}%`} />
            </div>
          </HoloPanel>
        </Reveal>
        <Reveal delay={0.04}>
          <HoloPanel className="h-full overflow-hidden p-0">
            <div className="border-b border-white/80 bg-white/68 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Prediction intelligence</p>
                  <h2 className="mt-2 text-2xl font-black text-ink">Confidence trajectory</h2>
                </div>
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="p-5">
              {confidenceData.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={confidenceData}>
                      <defs>
                        <linearGradient id="confidence-premium" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.38} />
                          <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#D9E6F2" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                      <Tooltip />
                      <Area type="monotone" dataKey="confidence" stroke="#2563EB" strokeWidth={3} fill="url(#confidence-premium)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : <EmptyState text="Run a symptom check to build your confidence graph." />}
            </div>
          </HoloPanel>
        </Reveal>
        <Reveal delay={0.08}>
          <HoloPanel className="h-full">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">AI recommendations</p>
            <div className="mt-4 space-y-3">
              {recommendationItems.slice(0, 4).map((item, index) => (
                <motion.div key={`${item}-${index}`} whileHover={{ x: 4 }} className="rounded-lg border border-white/80 bg-white/76 p-3 text-sm font-semibold leading-6 text-slate-700 shadow-sm">
                  {item}
                </motion.div>
              ))}
              {recommendationItems.length === 0 && <EmptyState text="Recommendations appear after symptom checks, report analysis, or saved guidance." />}
            </div>
          </HoloPanel>
        </Reveal>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Latest prediction" value={latest?.predicted_disease ?? latestText?.result?.predictedDisease ?? "No checks"} icon={HeartPulse} tone="blue" />
        <Metric title="Latest report" value={latestReport?.diagnosis ? latestReport.diagnosis.slice(0, 38) : "No reports"} icon={FileText} tone="violet" />
        <Metric title="Profile complete" value={`${profileCompletion}%`} icon={UserRound} tone="teal" />
        <Metric title="Risk summary" value={latest?.risk_level ?? latestReport?.riskLevel ?? "No signal"} icon={ShieldCheck} tone="amber" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <TrendCard title="Platelet intelligence" data={reportData} dataKey="platelets" stroke="#2563EB" empty="Upload CBC reports to build platelet trends from OCR output." />
        <TrendCard title="WBC activity" data={reportData} dataKey="wbc" stroke="#14B8A6" empty="Upload CBC reports to build WBC trends from OCR output." />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <HoloPanel>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Risk radar</p>
              <h2 className="mt-2 text-2xl font-black text-ink">Current signal balance</h2>
            </div>
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="35%" outerRadius="95%" data={[
                { name: "Profile", value: profileCompletion, fill: "#2563EB" },
                { name: "Reports", value: Math.min(100, reports.length * 20), fill: "#14B8A6" },
                { name: "Symptoms", value: Math.min(100, symptoms.length * 24), fill: "#7C3AED" },
                { name: "Risk", value: riskValue, fill: "#F59E0B" }
              ]} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={12} />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </HoloPanel>
        <HoloPanel>
          <div className="flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-black text-ink">Health timeline</h2>
          </div>
          <div className="mt-5 space-y-4">
            <Timeline title="Symptoms" items={symptoms.slice(0, 4).map((item) => `${item.predicted_disease} - ${percent(item.confidence_score)} confidence`)} empty="No structured symptom checks yet." />
            <Timeline title="Reports" items={reports.slice(0, 4).map((item) => `${item.file_name ?? "Report"} - ${item.riskLevel ?? "low"} risk`)} empty="No reports uploaded yet." />
            <Timeline title="Chat" items={messages.slice(0, 4).map((item) => item.user_message)} empty="Ask MEDISENSE a question to save chatbot history." />
          </div>
        </HoloPanel>
      </div>

      <HoloPanel>
        <div className="grid gap-5 lg:grid-cols-[0.35fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Profile snapshot</p>
            <h2 className="mt-2 text-2xl font-black text-ink">Personalization layer</h2>
            <PulseLine className="mt-4" />
          </div>
          <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
            <Snapshot label="Name" value={profile?.name ?? "Complete profile"} />
            <Snapshot label="Blood group" value={profile?.blood_group ?? "Not set"} />
            <Snapshot label="Allergies" value={profile?.allergies?.length ? profile.allergies.join(", ") : "None recorded"} />
            <Snapshot label="Emergency contact" value={profile?.emergency_contact ?? "Not set"} />
          </div>
        </div>
      </HoloPanel>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur-xl">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-100">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-slate-200 bg-white/60 p-5 text-sm text-slate-500">{text}</div>;
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/80 bg-white/70 p-3 text-center">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-black text-ink">{value}</p>
    </div>
  );
}

function Metric({ title, value, icon: Icon, tone }: { title: string; value: string; icon: typeof HeartPulse; tone: "blue" | "teal" | "violet" | "amber" }) {
  const toneClass = tone === "teal" ? "from-teal-50 text-teal-600" : tone === "violet" ? "from-violet-50 text-violet-600" : tone === "amber" ? "from-amber-50 text-amber-600" : "from-blue-50 text-primary";
  return (
    <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}>
      <Card className="h-full">
        <span className={`mb-4 grid h-12 w-12 place-items-center rounded-lg bg-gradient-to-br ${toneClass} to-white shadow-sm`}>
          <Icon className="h-5 w-5" />
        </span>
        <p className="text-sm font-bold text-slate-500">{title}</p>
        <p className="mt-2 line-clamp-2 text-2xl font-black leading-tight text-ink">{value}</p>
      </Card>
    </motion.div>
  );
}

function TrendCard({ title, data, dataKey, stroke, empty }: { title: string; data: Array<Record<string, string | number | undefined>>; dataKey: "platelets" | "wbc"; stroke: string; empty: string }) {
  const usable = data.some((item) => item[dataKey] !== undefined);
  return (
    <HoloPanel>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Lab trend</p>
          <h2 className="mt-2 text-2xl font-black text-ink">{title}</h2>
        </div>
        <TrendingUp className="h-5 w-5 text-primary" />
      </div>
      {usable ? (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D9E6F2" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey={dataKey} stroke={stroke} strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : <EmptyState text={empty} />}
    </HoloPanel>
  );
}

function Timeline({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div>
      <p className="text-sm font-black text-ink">{title}</p>
      <div className="mt-2 space-y-2">
        {items.map((item, index) => <p key={`${item}-${index}`} className="rounded-lg border border-white/80 bg-white/72 p-3 text-sm text-slate-700">{item}</p>)}
        {items.length === 0 && <p className="rounded-lg bg-white/62 p-3 text-sm text-slate-500">{empty}</p>}
      </div>
    </div>
  );
}

function Snapshot({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/80 bg-white/72 p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 font-bold text-ink">{value}</p>
    </div>
  );
}

function riskToValue(risk?: string) {
  const normalized = (risk ?? "").toLowerCase();
  if (normalized.includes("high")) return 82;
  if (normalized.includes("moderate") || normalized.includes("medium")) return 56;
  if (normalized.includes("low")) return 24;
  return 12;
}
