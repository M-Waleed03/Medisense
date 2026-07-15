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

  // First try verifying as a Supabase session
  const { data, error } = await supabaseAuth.auth.getUser(token);

  if (data?.user) {
    req.accessToken = token;
    req.user = {
      id: data.user.id,
      email: data.user.email,
      role: (data.user.user_metadata?.role as string | undefined) ?? "user"
    };

    // Upsert profile using the user's Supabase session
    try {
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
    } catch (e) {
      if (process.env.NODE_ENV !== "production") console.warn("Profile auto-upsert attempt failed.", (e as Error).message);
    }

    return next();
  }

  // If Supabase verification failed, try verifying as a Firebase ID token (fallback)
  if (env.GOOGLE_API_KEY) {
    try {
      const resp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${env.GOOGLE_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token })
      });
      const json = await resp.json().catch(() => ({}));
      if (resp.ok && Array.isArray((json as any).users) && (json as any).users.length > 0) {
        const u = (json as any).users[0];
        req.accessToken = token;
        req.user = {
          id: u.localId ?? u.userId ?? u.uid,
          email: u.email ?? null,
          role: "user"
        };
        // Do not attempt to upsert Supabase profile with a Firebase token (would fail).
        return next();
      }
    } catch (e) {
      if (process.env.NODE_ENV !== "production") console.warn("Firebase token verification failed:", (e as Error).message);
    }
  }

  return res.status(401).json({ error: "Invalid or expired session" });
}
