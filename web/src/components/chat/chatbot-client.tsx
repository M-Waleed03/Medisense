"use client";

import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bot, Loader2, Send, X } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ChatMessage } from "@/types/medisense";

const QUICK_QUESTIONS = [
  "What are dengue symptoms?",
  "What does low platelets mean?",
  "When should I see a doctor?",
  "What tests are needed for fever?",
  "What is typhoid?",
  "What is malaria?"
];

export function ChatbotClient() {
  const { data, refetch, error: loadError } = useQuery({ queryKey: ["chatbot"], queryFn: () => apiGet<{ messages: ChatMessage[] }>("/chatbot"), retry: 1 });
  const [message, setMessage] = useState("");
  const [pendingMessage, setPendingMessage] = useState("");
  const [loading, setLoading] = useState(false);
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

  return (
    <Card className="flex min-h-[620px] flex-col">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-white"><Bot className="h-5 w-5" /></span>
        <div>
          <h2 className="font-bold">Medi AI</h2>
          <p className="text-sm text-slate-500">Safe health guidance assistant</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-b border-slate-100 py-4">
        {QUICK_QUESTIONS.map((question) => (
          <Button key={question} type="button" variant="outline" size="sm" disabled={loading} onClick={() => sendMessage(question)}>
            {question}
          </Button>
        ))}
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto py-5">
        {loadError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Chat history could not be loaded. You can still try sending a new message after checking your connection.</p>}
        {[...(data?.messages ?? [])].reverse().map((item) => (
          <div key={item.id} className="space-y-2">
            <div className="ml-auto max-w-[82%] rounded-lg bg-primary px-4 py-3 text-sm text-white">{item.user_message}</div>
            <div className="max-w-[82%] whitespace-pre-line rounded-lg bg-white/80 px-4 py-3 text-sm leading-6 text-slate-700">
              {item.ai_response}
            </div>
          </div>
        ))}
        {pendingMessage && <div className="ml-auto max-w-[82%] rounded-lg bg-primary px-4 py-3 text-sm text-white">{pendingMessage}</div>}
        {loading && (
          <div className="max-w-[82%] rounded-lg bg-white/80 px-4 py-3 text-sm text-slate-700">
            <span className="inline-flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:120ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:240ms]" />
            </span>
          </div>
        )}
        {(data?.messages ?? []).length === 0 && <p className="text-slate-600">Ask about symptoms, report values, hydration, monitoring, or when to see a doctor.</p>}
      </div>
      {error && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <form onSubmit={submit} className="flex gap-2 border-t border-slate-100 pt-4">
        <div className="relative flex-1">
          <input className="h-12 w-full rounded-lg border border-slate-200 px-4 pr-11 outline-primary" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ask MEDISENSE..." />
          {message && (
            <button type="button" aria-label="Clear message" className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={() => setMessage("")}>
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button size="icon" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
      </form>
    </Card>
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
