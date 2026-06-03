import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { createUserSupabase } from "../config/supabase.js";
import { analyzeReport } from "../services/ml.js";

export const reportsRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "N/A") return null;
  const parsed = Number(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function markerStatus(marker: string, value: number | null) {
  if (value === null) return "unknown";
  const ranges: Record<string, { low: number; high: number; criticalLow?: number; criticalHigh?: number; unit: string }> = {
    platelets: { low: 150000, high: 450000, criticalLow: 50000, unit: "/uL" },
    wbc: { low: 4000, high: 11000, unit: "/uL" },
    rbc: { low: 4, high: 5.9, unit: "million/uL" },
    hemoglobin: { low: 12, high: 17.5, unit: "g/dL" },
    hematocrit: { low: 36, high: 52, unit: "%" },
    mcv: { low: 80, high: 100, unit: "fL" },
    mch: { low: 27, high: 33, unit: "pg" },
    mchc: { low: 32, high: 36, unit: "g/dL" },
    neutrophils: { low: 40, high: 75, unit: "%" },
    lymphocytes: { low: 20, high: 45, unit: "%" },
    monocytes: { low: 2, high: 10, unit: "%" }
  };
  const range = ranges[marker];
  if (!range) return "unknown";
  if ((range.criticalLow !== undefined && value < range.criticalLow) || (range.criticalHigh !== undefined && value > range.criticalHigh)) return "critical";
  if (value < range.low) return "low";
  if (value > range.high) return "high";
  return "normal";
}

reportsRouter.post("/", requireAuth, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Report file is required" });
    if (!["image/png", "image/jpeg", "image/webp", "application/pdf"].includes(req.file.mimetype)) {
      return res.status(415).json({ error: "Only PNG, JPG, WEBP, and PDF reports are supported" });
    }

    let analysis;
    try {
      analysis = await analyzeReport(req.file);
    } catch (error) {
      const message = error instanceof Error ? error.message : "OCR service could not read this report.";
      return res.status(422).json({
        error: "OCR could not read the report. Upload a clearer image/PDF or try again.",
        detail: message
      });
    }
    const extracted = analysis.extracted_data ?? {};

    const safeName = req.file.originalname.replace(/[^\w.\- ]/g, "_").slice(0, 180);
    const supabase = createUserSupabase(req.accessToken!);

    const path = `${req.user!.id}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("medical_reports")
      .upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: false });

    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from("medical_reports")
      .insert({
        user_id: req.user!.id,
        report_url: path,
        file_name: safeName,
        mime_type: req.file.mimetype,
        extracted_text: analysis.raw_text,
        platelets: toNumber(extracted.platelets),
        wbc: toNumber(extracted.wbc),
        rbc: toNumber(extracted.rbc),
        hemoglobin: toNumber(extracted.hemoglobin),
        hematocrit: toNumber(extracted.hematocrit),
        mcv: toNumber(extracted.mcv),
        mch: toNumber(extracted.mch),
        mchc: toNumber(extracted.mchc),
        neutrophils: toNumber(extracted.neutrophils),
        lymphocytes: toNumber(extracted.lymphocytes),
        extracted_values: extracted,
        diagnosis: analysis.analysis,
        flags: analysis.flags ?? []
      })
      .select()
      .single();

    if (error) throw error;

    const markers = ["platelets", "wbc", "rbc", "hemoglobin", "hematocrit", "mcv", "mch", "mchc", "neutrophils", "lymphocytes", "monocytes"] as const;
    await Promise.all([
      supabase.from("report_values").insert(markers.map((marker) => {
        const value = toNumber(extracted[marker]);
        const status = markerStatus(marker, value);
        return {
          user_id: req.user!.id,
          report_id: data.id,
          marker,
          value,
          status,
          interpretation: status === "normal" ? `${marker.toUpperCase()} is within common reference range.` : `${marker.toUpperCase()} is ${status}.`
        };
      })),
      supabase.from("health_history").insert({
        user_id: req.user!.id,
        event_type: "report_upload",
        event_id: data.id,
        summary: `Analyzed ${safeName}`,
        metadata: { flags: analysis.flags ?? [], extracted_values: extracted }
      }),
      supabase.from("dashboard_analytics").insert(markers.map((marker) => ({
        user_id: req.user!.id,
        metric: marker,
        value: toNumber(extracted[marker]),
        payload: { report_id: data.id }
      })))
    ]).catch((sideEffectError) => console.warn("Unable to write report side-effect records", sideEffectError));

    res.status(201).json({ analysis, record: data });
  } catch (error) {
    next(error);
  }
});

reportsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const supabase = createUserSupabase(req.accessToken!);

    const { data, error } = await supabase
      .from("medical_reports")
      .select("*")
      .eq("user_id", req.user!.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ reports: data });
  } catch (error) {
    next(error);
  }
});
