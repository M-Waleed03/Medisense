import axios from "axios";
import FormData from "form-data";
import { env } from "../config/env.js";

export type PredictionResult = {
  prediction: string;
  confidence: number;
  recommendations: string[];
  recommendedTests?: string[];
  precautions?: string[];
  riskLevel: "low" | "moderate" | "high";
  explanation?: Record<string, unknown>;
};

export async function predictSymptoms(symptoms: string[]): Promise<PredictionResult> {
  try {
    const { data } = await axios.post(`${env.ML_SERVICE_URL}/predict`, { symptoms }, { timeout: 15000 });
    return {
      prediction: data.prediction,
      confidence: Number(data.confidence ?? 0),
      recommendations: Array.isArray(data.recommendations) ? data.recommendations : [String(data.recommendations)],
      recommendedTests: Array.isArray(data.recommended_tests) ? data.recommended_tests : [],
      precautions: Array.isArray(data.precautions) ? data.precautions : [],
      riskLevel: data.risk_level ?? "moderate",
      explanation: data.explanation ?? {}
    };
  } catch (error) {
    return ruleBasedPrediction(symptoms, error instanceof Error ? error.message : "ML service unavailable");
  }
}

export async function analyzeReport(file: Express.Multer.File) {
  const form = new FormData();
  const safeName = file.originalname.replace(/[^\w.\- ]/g, "_").slice(0, 180);
  form.append("file", file.buffer, {
    filename: safeName,
    contentType: file.mimetype
  });

  const { data } = await axios.post(`${env.ML_SERVICE_URL}/ocr`, form, {
    headers: form.getHeaders(),
    timeout: 30000
  });

  return data;
}

export async function chat(message: string, history: Array<{ role: "user" | "assistant"; content: string }> = []) {
  try {
    const { data } = await axios.post(`${env.ML_SERVICE_URL}/chat`, { message, history }, { timeout: 30000 });
    return String(data.response);
  } catch {
    return "I could not reach the AI service right now. Please try again in a moment. If you have chest pain, breathing difficulty, confusion, severe dehydration, bleeding, fainting, or rapidly worsening symptoms, seek urgent medical care now.";
  }
}

function ruleBasedPrediction(symptoms: string[], reason: string): PredictionResult {
  const text = symptoms.join(" ").toLowerCase();
  const has = (terms: string[]) => terms.some((term) => text.includes(term));

  if (has(["platelet", "rash", "bleeding", "mosquito", "eye pain"])) {
    return {
      prediction: "Dengue possibility",
      confidence: 0.62,
      riskLevel: has(["bleeding", "severe abdominal", "persistent vomiting"]) ? "high" : "moderate",
      recommendations: ["Hydrate carefully, avoid aspirin/ibuprofen unless a clinician approves, and arrange dengue/CBC testing.", "Seek urgent care for bleeding, severe abdominal pain, persistent vomiting, drowsiness, or low urine output."],
      recommendedTests: ["CBC with platelet trend", "Dengue NS1 or IgM/IgG depending on illness day"],
      precautions: ["Use mosquito protection", "Monitor warning signs closely"],
      explanation: { fallback: true, reason, matched_rule: "dengue warning pattern" }
    };
  }

  if (has(["chills", "sweating", "travel", "periodic"])) {
    return {
      prediction: "Malaria possibility",
      confidence: 0.58,
      riskLevel: "moderate",
      recommendations: ["Arrange malaria rapid test or blood smear and consult a clinician.", "Seek urgent care for confusion, jaundice, severe weakness, or breathing difficulty."],
      recommendedTests: ["Rapid malaria antigen test", "Peripheral blood smear", "CBC"],
      precautions: ["Use mosquito nets and repellent", "Do not delay confirmatory testing"],
      explanation: { fallback: true, reason, matched_rule: "malaria fever pattern" }
    };
  }

  if (has(["abdominal", "diarrhea", "constipation", "appetite", "stomach"])) {
    return {
      prediction: "Typhoid or gastrointestinal fever possibility",
      confidence: 0.55,
      riskLevel: "moderate",
      recommendations: ["Consult a clinician for appropriate testing and treatment planning.", "Maintain hydration and seek care for persistent fever, dehydration, severe abdominal pain, or blood in stool."],
      recommendedTests: ["Blood culture where available", "CBC", "Clinician-directed stool or typhoid testing"],
      precautions: ["Use safe water and hand hygiene", "Avoid self-medication with antibiotics"],
      explanation: { fallback: true, reason, matched_rule: "enteric fever pattern" }
    };
  }

  return {
    prediction: has(["cough", "sore throat", "runny"]) ? "Flu or viral respiratory illness possibility" : "Viral fever possibility",
    confidence: 0.5,
    riskLevel: "low",
    recommendations: ["Rest, hydrate, monitor temperature, and consult a licensed clinician if symptoms worsen or fever lasts more than three days."],
    recommendedTests: ["CBC if fever persists", "COVID/flu testing if respiratory symptoms are present"],
    precautions: ["Seek urgent care for breathing difficulty, chest pain, confusion, severe dehydration, or rapidly worsening symptoms."],
    explanation: { fallback: true, reason, matched_rule: "general fever safety rule" }
  };
}
