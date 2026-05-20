import { Router } from "express";
import { z } from "zod";
import { createUserSupabase } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";

export const settingsRouter = Router();

const settingsSchema = z.object({
  email_notifications: z.boolean().optional(),
  report_alerts: z.boolean().optional(),
  symptom_reminders: z.boolean().optional(),
  theme: z.enum(["light", "system"]).optional()
});

const defaultSettings = {
  email_notifications: true,
  report_alerts: true,
  symptom_reminders: false,
  theme: "light"
};

settingsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const supabase = createUserSupabase(req.accessToken!);
    const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", req.user!.id).maybeSingle();
    if (error) throw error;
    if (data) return res.json({ settings: data });

    const { data: inserted, error: insertError } = await supabase
      .from("user_settings")
      .insert({ user_id: req.user!.id, ...defaultSettings })
      .select()
      .single();
    if (insertError) throw insertError;
    return res.json({ settings: inserted });
  } catch (error) {
    next(error);
  }
});

settingsRouter.patch("/", requireAuth, async (req, res, next) => {
  try {
    const payload = settingsSchema.parse(req.body);
    const supabase = createUserSupabase(req.accessToken!);
    const { data, error } = await supabase
      .from("user_settings")
      .upsert({ user_id: req.user!.id, ...payload }, { onConflict: "user_id" })
      .select()
      .single();
    if (error) throw error;
    return res.json({ settings: data });
  } catch (error) {
    next(error);
  }
});
