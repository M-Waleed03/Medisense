import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { createUserSupabase } from "../config/supabase.js";

export const historyRouter = Router();

historyRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const supabase = createUserSupabase(req.accessToken!);

    const [symptoms, reports, chats] = await Promise.all([
      supabase.from("symptom_checks").select("*").eq("user_id", req.user!.id).order("created_at", { ascending: false }),
      supabase.from("medical_reports").select("*").eq("user_id", req.user!.id).order("created_at", { ascending: false }),
      supabase.from("chatbot_messages").select("*").eq("user_id", req.user!.id).order("created_at", { ascending: false })
    ]);

    const error = symptoms.error ?? reports.error ?? chats.error;
    if (error) throw error;

    res.json({
      symptoms: symptoms.data ?? [],
      reports: reports.data ?? [],
      messages: chats.data ?? []
    });
  } catch (error) {
    next(error);
  }
});
