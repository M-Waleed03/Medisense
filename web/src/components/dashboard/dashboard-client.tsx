"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, Line, LineChart, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, BarChart3, Calendar, FileText, Heart, Shield, TrendingUp, User } from "lucide-react";
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
    <div className="space-y-8">
      {/* Welcome Section */}
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-600 to-blue-700 p-8 text-white shadow-lg md:p-12">
          <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <AiAvatar size="lg" />
              <div>
                <p className="text-sm font-semibold text-blue-100 uppercase tracking-wide">Welcome back</p>
                <h1 className="mt-2 text-3xl font-bold md:text-4xl">
                  Good to see you{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}
                </h1>
                <p className="mt-3 text-sm text-blue-100 leading-relaxed max-w-xl">
                  Your health dashboard is updated with the latest diagnostics, reports, and AI-powered insights.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <StatBox label="Score" value={`${healthScore}%`} />
              <StatBox label="Reports" value={String(reports.length)} />
              <StatBox label="Chats" value={String(messages.length)} />
            </div>
          </div>
        </div>
      </Reveal>

      {/* Top Metrics */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Latest diagnosis" 
          value={latest?.predicted_disease ?? latestText?.result?.predictedDisease ?? "No checks"} 
          icon={Heart} 
          color="blue"
        />
        <MetricCard 
          title="Report analysis" 
          value={latestReport?.diagnosis ? latestReport.diagnosis.slice(0, 32) : "No reports"} 
          icon={FileText} 
          color="blue"
        />
        <MetricCard 
          title="Risk level" 
          value={latest?.risk_level ?? latestReport?.riskLevel ?? "Low"} 
          icon={Shield} 
          color="amber"
        />
        <MetricCard 
          title="Profile complete" 
          value={`${profileCompletion}%`} 
          icon={User} 
          color="emerald"
        />
      </div>

      {/* Health Score & Charts */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Reveal>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Health score</h3>
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
            <MetricRing value={healthScore} label="" tone="blue" />
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500 uppercase">Risk load</p>
                <p className="mt-2 text-xl font-bold text-slate-900">{riskValue}%</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500 uppercase">Confidence</p>
                <p className="mt-2 text-xl font-bold text-slate-900">{latestConfidence || 0}%</p>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.04}>
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">Prediction confidence</h3>
              </div>
            </div>
            <div className="p-6">
              {confidenceData.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={confidenceData}>
                      <defs>
                        <linearGradient id="confidence-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0066cc" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#0066cc" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
                      <Area type="monotone" dataKey="confidence" stroke="#0066cc" strokeWidth={2} fill="url(#confidence-grad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : <EmptyState text="Run a symptom check to build your confidence graph." />}
            </div>
          </div>
        </Reveal>
      </div>

      {/* Lab Trends */}
      <div className="grid gap-5 lg:grid-cols-2">
        <TrendCard 
          title="Platelet levels" 
          data={reportData} 
          dataKey="platelets" 
          stroke="#0066cc" 
          empty="Upload CBC reports to track platelet trends." 
        />
        <TrendCard 
          title="WBC activity" 
          data={reportData} 
          dataKey="wbc" 
          stroke="#0a8863" 
          empty="Upload CBC reports to track WBC trends." 
        />
      </div>

      {/* Recommendations & Timeline */}
      <div className="grid gap-5 lg:grid-cols-[0.6fr_1fr]">
        <Reveal>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">AI Recommendations</h3>
            <div className="space-y-3">
              {recommendationItems.slice(0, 5).map((item, index) => (
                <motion.div 
                  key={`${item}-${index}`} 
                  whileHover={{ x: 2 }} 
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 leading-relaxed"
                >
                  {item}
                </motion.div>
              ))}
              {recommendationItems.length === 0 && (
                <p className="text-sm text-slate-500 p-3 rounded-lg bg-slate-50">
                  Recommendations appear after health checks and report analysis.
                </p>
              )}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.04}>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <Calendar className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Health timeline</h3>
            </div>
            <div className="space-y-4">
              <TimelineSection 
                title="Symptoms" 
                items={symptoms.slice(0, 3).map((item) => `${item.predicted_disease} — ${percent(item.confidence_score)} confidence`)} 
                empty="No symptom checks yet."
              />
              <TimelineSection 
                title="Reports" 
                items={reports.slice(0, 3).map((item) => `${item.file_name ?? "Report"} — ${item.riskLevel ?? "low"} risk`)} 
                empty="No reports uploaded yet."
              />
              <TimelineSection 
                title="Messages" 
                items={messages.slice(0, 3).map((item) => item.user_message?.substring(0, 40) + "...")} 
                empty="No conversations yet."
              />
            </div>
          </div>
        </Reveal>
      </div>

      {/* Risk Radar */}
      <Reveal>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Health indicators</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="30%" outerRadius="90%" data={[
                { name: "Profile", value: profileCompletion, fill: "#0066cc" },
                { name: "Reports", value: Math.min(100, reports.length * 20), fill: "#0a8863" },
                { name: "Symptoms", value: Math.min(100, symptoms.length * 24), fill: "#6b5b95" },
                { name: "Risk", value: riskValue, fill: "#f59e0b" }
              ]} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={10} />
                <Tooltip contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Reveal>

      {/* Profile Summary */}
      <Reveal>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-5">Your profile</h3>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <ProfileField label="Name" value={profile?.name ?? "Complete profile"} />
            <ProfileField label="Blood type" value={profile?.blood_group ?? "Not set"} />
            <ProfileField label="Age" value={profile?.age ? `${profile.age} yrs` : "Not set"} />
            <ProfileField label="Emergency contact" value={profile?.emergency_contact ?? "Not set"} />
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/15 backdrop-blur border border-white/20 p-3">
      <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: string; 
  icon: typeof Heart; 
  color: "blue" | "amber" | "emerald" 
}) {
  const bgColor = color === "blue" ? "bg-blue-50 text-blue-600" : color === "amber" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600";
  
  return (
    <motion.div whileHover={{ y: -2 }} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className={`inline-flex items-center justify-center h-10 w-10 rounded-lg ${bgColor} mb-3`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900 truncate">{value}</p>
    </motion.div>
  );
}

function TrendCard({ 
  title, 
  data, 
  dataKey, 
  stroke, 
  empty 
}: { 
  title: string; 
  data: Array<Record<string, string | number | undefined>>; 
  dataKey: "platelets" | "wbc" | "hemoglobin"; 
  stroke: string; 
  empty: string 
}) {
  const usable = data.some((item) => item[dataKey] !== undefined);
  
  return (
    <Reveal>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        </div>
        <div className="p-6">
          {usable ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
                  <Line type="monotone" dataKey={dataKey} stroke={stroke} strokeWidth={2} dot={{ r: 3, fill: stroke }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyState text={empty} />}
        </div>
      </div>
    </Reveal>
  );
}

function TimelineSection({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">{title}</p>
      <div className="space-y-2">
        {items.map((item, index) => (
          <p key={`${item}-${index}`} className="text-sm text-slate-700 p-2 rounded bg-slate-50">
            {item}
          </p>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-500 p-2 rounded bg-slate-50">{empty}</p>}
      </div>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="mt-2 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">{text}</div>;
}

function riskToValue(risk?: string) {
  const normalized = (risk ?? "").toLowerCase();
  if (normalized.includes("high")) return 82;
  if (normalized.includes("moderate") || normalized.includes("medium")) return 56;
  if (normalized.includes("low")) return 24;
  return 12;
}
