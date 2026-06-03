import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { createUserSupabase } from "../config/supabase.js";
import { predictSymptoms } from "../services/ml.js";

export const symptomsRouter = Router();

const symptomSchema = z.object({
  symptoms: z.array(z.string().min(2).max(80)).max(40),
  clinicalInputs: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional()
}).refine((payload) => payload.symptoms.length > 0 || hasClinicalInputs(payload.clinicalInputs), {
  message: "At least one symptom or clinical input is required.",
  path: ["symptoms"]
});

function hasClinicalInputs(clinicalInputs?: Record<string, string | number | boolean | null>) {
  return Object.values(clinicalInputs ?? {}).some((value) => value !== "" && value !== null && value !== false && value !== undefined);
}

function clinicalInputSymptoms(clinicalInputs?: Record<string, string | number | boolean | null>) {
  if (!clinicalInputs) return [];
  const symptoms: string[] = [];
  const feverLevel = clinicalInputs.feverLevel;
  const feverPattern = clinicalInputs.feverPattern;
  const temperature = clinicalInputs.temperature;
  const feverDuration = clinicalInputs.feverDuration;

  if (feverLevel && feverLevel !== "none") symptoms.push(`${feverLevel} fever`);
  if (feverPattern) symptoms.push(`${feverPattern} fever`);
  if (temperature) symptoms.push(`temperature ${temperature}`);
  if (feverDuration) symptoms.push(`fever duration ${feverDuration}`);

  for (const [key, value] of Object.entries(clinicalInputs)) {
    if (value === true) symptoms.push(key.replace(/([A-Z])/g, " $1").toLowerCase());
  }

  return symptoms;
}

symptomsRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const payload = symptomSchema.parse(req.body);
    const symptomPayload = [...new Set([...payload.symptoms, ...clinicalInputSymptoms(payload.clinicalInputs)].map((item) => item.trim()).filter(Boolean))];
    console.info("[symptoms-api] incoming symptoms", {
      userId: req.user?.id,
      symptoms: payload.symptoms,
      clinicalInputs: payload.clinicalInputs ?? {}
    });
    console.info("[symptoms-api] forwarded symptoms", {
      userId: req.user?.id,
      symptoms: symptomPayload
    });

    const prediction = await predictSymptoms(symptomPayload, payload.clinicalInputs ?? {});
    const supabase = createUserSupabase(req.accessToken!);

    const { data, error } = await supabase
      .from("symptom_checks")
      .insert({
        user_id: req.user!.id,
        symptom_list: symptomPayload,
        clinical_inputs: payload.clinicalInputs ?? {},
        predicted_disease: prediction.prediction,
        confidence_score: prediction.confidence,
        risk_level: prediction.riskLevel,
        recommendations: prediction.recommendations.join(" "),
        explanation: prediction.explanation ?? {},
        recommended_tests: prediction.recommendedTests ?? [],
        precautions: prediction.precautions ?? []
      })
      .select()
      .single();

    if (error) throw error;

    await Promise.all([
      supabase.from("disease_predictions").insert({
        user_id: req.user!.id,
        symptom_check_id: data.id,
        disease: prediction.prediction,
        confidence_score: prediction.confidence,
        risk_level: prediction.riskLevel,
        explanation: prediction.explanation ?? {}
      }),
      (prediction.recommendations ?? []).length > 0
        ? supabase.from("recommendations").insert((prediction.recommendations ?? []).map((detail, index) => ({
        user_id: req.user!.id,
        source_type: "symptom_check",
        source_id: data.id,
        title: index === 0 ? `Review ${prediction.prediction} guidance` : `Care step ${index + 1}`,
        detail,
        urgency: prediction.riskLevel === "high" ? "clinical review" : "routine monitoring"
      })))
        : Promise.resolve({ data: null, error: null }),
      supabase.from("health_history").insert({
        user_id: req.user!.id,
        event_type: "symptom_check",
        event_id: data.id,
        summary: `${prediction.prediction} prediction at ${Math.round(prediction.confidence * 100)}% confidence`,
        metadata: { symptoms: symptomPayload, risk_level: prediction.riskLevel }
      }),
      supabase.from("dashboard_analytics").insert({
        user_id: req.user!.id,
        metric: "prediction_confidence",
        value: prediction.confidence,
        payload: { disease: prediction.prediction, risk_level: prediction.riskLevel }
      })
    ]).catch((sideEffectError) => console.warn("Unable to write prediction side-effect records", sideEffectError));

    res.status(201).json({ result: prediction, record: data });
  } catch (error) {
    next(error);
  }
});

symptomsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const supabase = createUserSupabase(req.accessToken!);

    const { data, error } = await supabase
      .from("symptom_checks")
      .select("*")
      .eq("user_id", req.user!.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ symptoms: data });
  } catch (error) {
    next(error);
  }
});
