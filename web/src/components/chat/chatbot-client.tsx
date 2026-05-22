"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Bot, FileText, Loader2, Mic, Plus, Send, ShieldCheck, Sparkles, Stethoscope, X } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { AiAvatar, HoloPanel, NeuralField, PulseLine, SignalBadge } from "@/components/ui/premium";
import type { ChatMessage } from "@/types/medisense";

const QUICK_QUESTIONS = [
  "What are dengue symptoms?",
  "What does low platelets mean?",
  "When should I see a doctor?",
  "What tests are needed for fever?",
  "What is typhoid?",
  "What is malaria?"
];

const quickActions = [
  { label: "Symptoms", icon: Stethoscope },
  { label: "CBC report", icon: FileText },
  { label: "Safety", icon: ShieldCheck },
  { label: "Explain", icon: Sparkles }
];

export function ChatbotClient() {
  const { data, refetch, error: loadError } = useQuery({ queryKey: ["chatbot"], queryFn: () => apiGet<{ messages: ChatMessage[] }>("/chatbot"), retry: 1 });
  const [message, setMessage] = useState("");
  const [pendingMessage, setPendingMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    await sendMessage(message);
  }

  async function sendMessage(nextMessage: string) {
    const trimmed = nextMessage.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError("");
    setPendingMessage(trimmed);
    setMessage("");
    try {
      await apiPost("/chatbot", { message: trimmed });
      await refetch();
    } catch (err) {
      setError(friendlyChatError(err));
    } finally {
      setLoading(false);
      setPendingMessage("");
    }
  }

  const messages = [...(data?.messages ?? [])].reverse();

  return (
    <div className="grid min-h-[680px] gap-5 xl:grid-cols-[0.34fr_1fr]">
      <HoloPanel className="relative overflow-hidden">
        <NeuralField className="opacity-30" />
        <div className="relative">
          <AiAvatar size="lg" />
          <SignalBadge icon="bot">Medi AI</SignalBadge>
          <h2 className="mt-4 text-3xl font-black text-ink">Your floating AI doctor avatar</h2>
          <p className="mt-3 text-sm leading-6 text-muted">Context-aware guidance with profile, report, symptom, and chat history available to the MEDISENSE backend.</p>
          <PulseLine className="mt-5" />
          <div className="mt-5 grid grid-cols-2 gap-3">
            {quickActions.map((item) => (
              <button key={item.label} type="button" className="rounded-lg border border-white/80 bg-white/72 p-3 text-left text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white">
                <item.icon className="mb-2 h-5 w-5 text-primary" />
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setVoiceMode((current) => !current)}
            className={`mt-5 flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-black transition ${voiceMode ? "border-primary/30 bg-blue-50 text-primary" : "border-white/80 bg-white/72 text-slate-700 hover:bg-white"}`}
          >
            <Mic className="h-4 w-4" />
            {voiceMode ? "Voice interface armed" : "Open voice interface"}
          </button>
        </div>
      </HoloPanel>

      <HoloPanel className="flex min-h-[680px] flex-col p-0">
        <div className="flex items-center justify-between gap-3 border-b border-white/80 bg-white/68 p-5">
          <div className="flex items-center gap-3">
            <AiAvatar />
            <div>
              <h2 className="text-xl font-black text-ink">MEDISENSE Assistant</h2>
              <p className="text-sm text-muted">Safe health guidance and report-aware answers</p>
            </div>
          </div>
          <span className="hidden items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-700 sm:inline-flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Online
          </span>
        </div>

        <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-white/80 p-4">
          {QUICK_QUESTIONS.map((question) => (
            <Button key={question} type="button" variant="outline" size="sm" disabled={loading} onClick={() => sendMessage(question)} className="shrink-0">
              <Plus className="h-3.5 w-3.5" />
              {question}
            </Button>
          ))}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {loadError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Chat history could not be loaded. You can still try sending a new message after checking your connection.</p>}
          <AnimatePresence initial={false}>
            {messages.map((item) => (
              <motion.div key={item.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                <ChatBubble fromUser text={item.user_message} />
                <ChatBubble text={item.ai_response} />
              </motion.div>
            ))}
          </AnimatePresence>
          {pendingMessage && <ChatBubble fromUser text={pendingMessage} />}
          {loading && <TypingBubble />}
          {messages.length === 0 && !pendingMessage && !loading && (
            <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-slate-200 bg-white/52 p-8 text-center">
              <div>
                <Bot className="mx-auto h-10 w-10 text-primary" />
                <p className="mt-3 text-lg font-black text-ink">Ask MEDISENSE anything health-related</p>
                <p className="mt-2 text-sm text-muted">Symptoms, CBC values, precautions, hydration, and when to seek care.</p>
              </div>
            </div>
          )}
        </div>

        {error && <p className="mx-5 mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <form onSubmit={submit} className="flex gap-2 border-t border-white/80 bg-white/58 p-4 backdrop-blur-xl">
          <div className="relative flex-1">
            <input className="h-12 w-full rounded-lg border border-white/80 bg-white/80 px-4 pr-11 text-sm shadow-inner outline-primary" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={voiceMode ? "Voice transcript will appear here..." : "Ask MEDISENSE..."} />
            {message && (
              <button type="button" aria-label="Clear message" className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={() => setMessage("")}>
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button type="button" size="icon" variant={voiceMode ? "primary" : "outline"} onClick={() => setVoiceMode((current) => !current)} disabled={loading}>
            <Mic className="h-4 w-4" />
          </Button>
          <Button size="icon" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
        </form>
      </HoloPanel>
    </div>
  );
}

function ChatBubble({ text, fromUser = false }: { text: string; fromUser?: boolean }) {
  return (
    <div className={`flex ${fromUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[86%] whitespace-pre-line rounded-lg px-4 py-3 text-sm leading-6 shadow-sm ${fromUser ? "bg-gradient-to-r from-primary to-cyan text-white" : "border border-white/80 bg-white/82 text-slate-700"}`}>
        {text}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="rounded-lg border border-white/80 bg-white/82 px-4 py-3 text-sm text-slate-700 shadow-sm">
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-cyan [animation-delay:120ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-secondary [animation-delay:240ms]" />
          </span>
          MEDISENSE is typing...
        </span>
      </div>
    </div>
  );
}

function friendlyChatError(error: unknown) {
  const text = error instanceof Error ? error.message : "";
  if (/offline|backend server|backend service|connection refused|network/i.test(text)) {
    return "The AI assistant is currently offline. Please start the backend service.";
  }
  if (/failed to fetch|quota|provider|api key|groq|gemini|openrouter|rate-limit|insufficient/i.test(text)) {
    return "MEDISENSE could not answer right now. Please try again in a moment.";
  }
  return text || "MEDISENSE could not answer right now. Please try again in a moment.";
}
