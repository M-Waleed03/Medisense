import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env.local" });
dotenv.config({ path: "backend/.env" });
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_JWT_SECRET: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  ML_SERVICE_URL: z.string().url().default("http://localhost:8000"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_CHAT_MODEL: z.string().default("gpt-4o-mini"),
  GEMINI_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-1.5-flash")
});

const parsed = envSchema.parse(process.env);

export const env = {
  ...parsed,
  supabaseUrl: parsed.SUPABASE_URL ?? parsed.NEXT_PUBLIC_SUPABASE_URL,
  supabasePublishableKey: parsed.SUPABASE_PUBLISHABLE_KEY ?? parsed.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  jwtSecret: parsed.SUPABASE_JWT_SECRET ?? parsed.JWT_SECRET,
  get hasSupabaseConfig() {
    return Boolean((parsed.SUPABASE_URL ?? parsed.NEXT_PUBLIC_SUPABASE_URL) && (parsed.SUPABASE_PUBLISHABLE_KEY ?? parsed.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY));
  },
  get hasServiceRole() {
    return Boolean((parsed.SUPABASE_URL ?? parsed.NEXT_PUBLIC_SUPABASE_URL) && parsed.SUPABASE_SERVICE_ROLE_KEY);
  }
};
