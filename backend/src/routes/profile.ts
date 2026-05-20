import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { createUserSupabase } from "../config/supabase.js";

export const profileRouter = Router();

const profileSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  avatar_url: z.string().url().optional().nullable(),
  age: z.coerce.number().int().min(0).max(130).optional().nullable(),
  gender: z.string().max(60).optional().nullable(),
  weight_kg: z.coerce.number().positive().max(700).optional().nullable(),
  height_cm: z.coerce.number().positive().max(300).optional().nullable(),
  blood_group: z.string().max(8).optional().nullable(),
  medical_conditions: z.array(z.string().min(1).max(120)).max(40).optional(),
  allergies: z.array(z.string().min(1).max(120)).max(40).optional(),
  phone: z.string().max(40).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  emergency_contact: z.string().max(160).optional().nullable()
});

profileRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const supabase = createUserSupabase(req.accessToken!);

    const { data, error } = await supabase.from("profiles").select("*").eq("id", req.user!.id).maybeSingle();
    if (error) throw error;
    if (data) return res.json({ profile: data });

    const { data: inserted, error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: req.user!.id,
        email: req.user!.email,
        name: req.user!.email?.split("@")[0] ?? "MEDISENSE user"
      })
      .select()
      .single();

    if (insertError) throw insertError;
    res.json({ profile: inserted });
  } catch (error) {
    next(error);
  }
});

profileRouter.patch("/", requireAuth, async (req, res, next) => {
  try {
    const payload = profileSchema.parse(req.body);
    const supabase = createUserSupabase(req.accessToken!);

    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", req.user!.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ profile: data });
  } catch (error) {
    next(error);
  }
});
