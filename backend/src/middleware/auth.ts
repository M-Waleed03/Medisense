import type { NextFunction, Request, Response } from "express";
import { createUserSupabase, supabaseAuth } from "../config/supabase.js";
import { env } from "../config/env.js";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!env.hasSupabaseConfig) {
    return res.status(503).json({ error: "Supabase authentication is not configured on the API server." });
  }

  if (!token) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  const { data, error } = await supabaseAuth.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  req.accessToken = token;
  req.user = {
    id: data.user.id,
    email: data.user.email,
    role: (data.user.user_metadata?.role as string | undefined) ?? "user"
  };

  const supabase = createUserSupabase(token);
  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? data.user.email?.split("@")[0] ?? "MEDISENSE user",
      avatar_url: data.user.user_metadata?.avatar_url ?? data.user.user_metadata?.picture ?? null,
      last_seen_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );

  if (profileError && process.env.NODE_ENV !== "production") {
    console.warn("Profile auto-upsert failed. Apply Supabase migrations if this persists.", profileError.message);
  }

  return next();
}
