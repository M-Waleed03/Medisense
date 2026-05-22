"use client";

import { useQuery } from "@tanstack/react-query";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { apiGet } from "@/lib/api";
import { Card } from "@/components/ui/card";
import type { ChatMessage, ReportRecord, SymptomRecord } from "@/types/medisense";

type History = { symptoms: SymptomRecord[]; reports: ReportRecord[]; messages: ChatMessage[] };

export function HistoryClient() {
  const { data, isLoading, error } = useQuery({ queryKey: ["history-page"], queryFn: () => apiGet<History>("/history") });
  if (isLoading) return <Card className="h-40 animate-pulse" />;
  if (error) return <Card className="text-sm text-red-700">History could not be loaded from Firestore. Sign in again or check Firebase rules.</Card>;
  const reports = data?.reports ?? [];
  const trendData = reports.slice(0, 12).reverse().map((item, index) => ({
    name: `R${index + 1}`,
    platelets: item.platelets ?? undefined,
    wbc: item.wbc ?? undefined
  }));

  return (
    <div className="space-y-5">
      <Card>
        <h2 className="text-lg font-bold">Health analytics timeline</h2>
        {trendData.length > 0 ? (
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="platelets" stroke="#3B82F6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="wbc" stroke="#14B8A6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">No report trends yet. Upload CBC reports to see live analytics.</p>
        )}
      </Card>
      <div className="grid gap-5 lg:grid-cols-3">
        <Timeline title="Previous diseases" items={(data?.symptoms ?? []).map((item) => `${item.predicted_disease} - ${Math.round(item.confidence_score * 100)}% confidence`)} />
        <Timeline title="Recent reports" items={reports.map((item) => `${item.file_name ?? "Report"}: ${item.diagnosis}`)} />
        <Timeline title="Chatbot conversations" items={(data?.messages ?? []).map((item) => item.user_message)} />
      </div>
    </div>
  );
}

function Timeline({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.map((item, index) => <p key={`${item}-${index}`} className="rounded-lg bg-white/70 p-3 text-sm text-slate-700">{item}</p>)}
        {items.length === 0 && <p className="text-sm text-slate-500">No records yet.</p>}
      </div>
    </Card>
  );
}
