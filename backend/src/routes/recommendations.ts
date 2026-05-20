import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { createUserSupabase } from "../config/supabase.js";

export const recommendationsRouter = Router();

recommendationsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const supabase = createUserSupabase(req.accessToken!);

    const { data, error } = await supabase
      .from("recommendations")
      .select("*")
      .eq("user_id", req.user!.id)
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) throw error;

    res.json({ recommendations: data ?? [] });
  } catch (error) {
    next(error);
  }
});
