import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

if (!env.supabaseUrl || !env.supabasePublishableKey) {
  console.warn("Supabase URL or publishable key is missing. Protected API routes will reject requests until configured.");
}

export const supabaseAuth = createClient(
  env.supabaseUrl ?? "https://example.supabase.co",
  env.supabasePublishableKey ?? "missing-publishable-key",
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false
    }
  }
);

export const supabaseAdmin = env.hasServiceRole
  ? createClient(env.supabaseUrl!, env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: true,
        persistSession: false
      }
    })
  : null;

export function createUserSupabase(accessToken: string) {
  return createClient(env.supabaseUrl!, env.supabasePublishableKey!, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    },
    auth: {
      autoRefreshToken: true,
      persistSession: false
    }
  });
}
