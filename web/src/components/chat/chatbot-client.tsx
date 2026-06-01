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
          <h2 className="mt-4 font-arcadiaDisplay text-heading font-light text-starlight">Your floating AI doctor avatar</h2>
          <p className="mt-3 text-sm leading-6 text-silver">Context-aware guidance with profile, report, symptom, and chat history available to the MEDISENSE backend.</p>
          <PulseLine className="mt-5" />
          <div className="mt-5 grid grid-cols-2 gap-3">
            {quickActions.map((item) => (
              <button key={item.label} type="button" className="border border-lead/35 bg-graphite/40 p-3 text-left text-sm font-medium text-silver transition hover:bg-ghost-blue/10 hover:text-starlight">
                <item.icon className="mb-2 h-5 w-5 text-starlight" />
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setVoiceMode((current) => !current)}
            className={`mt-5 flex w-full items-center justify-center gap-2 rounded-pill border px-4 py-3 text-sm font-medium transition ${voiceMode ? "border-primary/40 bg-primary text-pure-white" : "border-lead/40 bg-transparent text-silver hover:bg-ghost-blue/10 hover:text-starlight"}`}
          >
            <Mic className="h-4 w-4" />
            {voiceMode ? "Voice interface armed" : "Open voice interface"}
          </button>
        </div>
      </HoloPanel>

      <HoloPanel className="flex min-h-[680px] flex-col p-0">
        <div className="flex items-center justify-between gap-3 border-b border-lead/30 bg-graphite/30 p-5">
          <div className="flex items-center gap-3">
            <AiAvatar />
            <div>
              <h2 className="text-xl font-medium text-starlight">MEDISENSE Assistant</h2>
              <p className="text-sm text-silver">Safe health guidance and report-aware answers</p>
            </div>
          </div>
          <span className="hidden items-center gap-2 rounded-pill border border-ghost-blue/15 bg-ghost-blue/10 px-3 py-2 text-xs font-medium uppercase tracking-[0.14em] text-silver sm:inline-flex">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Online
          </span>
        </div>

        <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-lead/30 p-4">
          {QUICK_QUESTIONS.map((question) => (
            <Button key={question} type="button" variant="outline" size="sm" disabled={loading} onClick={() => sendMessage(question)} className="shrink-0">
              <Plus className="h-3.5 w-3.5" />
              {question}
            </Button>
          ))}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {loadError && <p className="border border-lead/40 bg-graphite/70 p-3 text-sm text-starlight">Chat history could not be loaded. You can still try sending a new message after checking your connection.</p>}
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
            <div className="grid min-h-72 place-items-center border border-dashed border-lead/45 bg-graphite/30 p-8 text-center">
              <div>
                <Bot className="mx-auto h-10 w-10 text-starlight" />
                <p className="mt-3 text-lg font-medium text-starlight">Ask MEDISENSE anything health-related</p>
                <p className="mt-2 text-sm text-silver">Symptoms, CBC values, precautions, hydration, and when to seek care.</p>
              </div>
            </div>
          )}
        </div>

        {error && <p className="mx-5 mb-3 border border-lead/40 bg-graphite/70 p-3 text-sm text-starlight">{error}</p>}
        <form onSubmit={submit} className="flex gap-2 border-t border-lead/30 bg-graphite/30 p-4 backdrop-blur-xl">
          <div className="relative flex-1">
            <input className="h-12 w-full rounded-pill border border-lead/50 bg-graphite/70 px-4 pr-11 text-sm text-starlight outline-primary" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={voiceMode ? "Voice transcript will appear here..." : "Ask MEDISENSE..."} />
            {message && (
              <button type="button" aria-label="Clear message" className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-pill text-silver hover:bg-ghost-blue/10 hover:text-starlight" onClick={() => setMessage("")}>
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
      <div className={`max-w-[86%] whitespace-pre-line px-4 py-3 text-sm leading-6 ${fromUser ? "rounded-[24px] bg-primary text-pure-white" : "border border-lead/35 bg-graphite/55 text-silver"}`}>
        {text}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="border border-lead/35 bg-graphite/55 px-4 py-3 text-sm text-silver">
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-ghost-blue [animation-delay:120ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-lead [animation-delay:240ms]" />
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
