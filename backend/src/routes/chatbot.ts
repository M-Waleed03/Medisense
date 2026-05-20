import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { createUserSupabase } from "../config/supabase.js";
import { chat } from "../services/ml.js";

export const chatbotRouter = Router();

const messageSchema = z.object({ message: z.string().min(2).max(1200) });

chatbotRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const payload = messageSchema.parse(req.body);
    const supabase = createUserSupabase(req.accessToken!);

    const { data: previous, error: historyError } = await supabase
      .from("chatbot_messages")
      .select("user_message, ai_response")
      .eq("user_id", req.user!.id)
      .order("created_at", { ascending: false })
      .limit(8);

    if (historyError) throw historyError;

    const history = (previous ?? []).reverse().flatMap((item) => [
      { role: "user" as const, content: item.user_message },
      { role: "assistant" as const, content: item.ai_response }
    ]);
    const response = await chat(payload.message, history);

    const { data, error } = await supabase
      .from("chatbot_messages")
      .insert({
        user_id: req.user!.id,
        user_message: payload.message,
        ai_response: response
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ response, record: data });
  } catch (error) {
    next(error);
  }
});

chatbotRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const supabase = createUserSupabase(req.accessToken!);

    const { data, error } = await supabase
      .from("chatbot_messages")
      .select("*")
      .eq("user_id", req.user!.id)
      .order("created_at", { ascending: true });

    if (error) throw error;
    res.json({ messages: data });
  } catch (error) {
    next(error);
  }
});
