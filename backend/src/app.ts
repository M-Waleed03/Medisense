import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { ZodError } from "zod";
import { chatbotRouter } from "./routes/chatbot.js";
import { healthRouter } from "./routes/health.js";
import { historyRouter } from "./routes/history.js";
import { profileRouter } from "./routes/profile.js";
import { recommendationsRouter } from "./routes/recommendations.js";
import { reportsRouter } from "./routes/reports.js";
import { symptomsRouter } from "./routes/symptoms.js";
import { settingsRouter } from "./routes/settings.js";

export const app = express();
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use((req, res, next) => {
  const key = `${req.ip}:${req.path}`;
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = req.path.includes("/api/chatbot") || req.path.includes("/api/reports") ? 20 : 90;
  const store = rateLimitStore.get(key);

  if (!store || store.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }

  store.count += 1;
  if (store.count > maxRequests) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment and try again." });
  }

  return next();
});

app.use("/api/health", healthRouter);
app.use("/api/symptoms", symptomsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/chatbot", chatbotRouter);
app.use("/api/history", historyRouter);
app.use("/api/recommendations", recommendationsRouter);
app.use("/api/profile", profileRouter);
app.use("/api/settings", settingsRouter);

app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  if (error instanceof ZodError) {
    return res.status(422).json({ error: "Validation failed", details: error.flatten() });
  }
  const supabaseError = error as { code?: string; message?: string; details?: string };
  if (supabaseError.code === "PGRST205" || supabaseError.message?.includes("Could not find the table")) {
    return res.status(503).json({
      error: "Supabase database schema is not installed. Run supabase/migrations/003_repair_required_medisense_tables.sql in the Supabase SQL editor, then refresh."
    });
  }
  const message = error instanceof Error ? error.message : "Internal server error";
  return res.status(500).json({ error: message });
});
