import type { PredictionResult } from "./ml.js";

type LocalProfile = {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  age: number | null;
  gender: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  blood_group: string | null;
  medical_conditions: string[];
  allergies: string[];
  phone: string | null;
  address: string | null;
  emergency_contact: string | null;
  created_at: string;
};

type LocalSymptom = {
  id: string;
  user_id: string;
  symptom_list: string[];
  predicted_disease: string;
  confidence_score: number;
  risk_level: string;
  recommendations: string;
  explanation: Record<string, unknown> | string;
  created_at: string;
};

type LocalReport = {
  id: string;
  user_id: string;
  report_url: string;
  file_name: string;
  mime_type: string;
  extracted_text: string;
  platelets: number | null;
  wbc: number | null;
  rbc: number | null;
  hemoglobin: number | null;
  hematocrit: number | null;
  diagnosis: string;
  flags: unknown[];
  created_at: string;
};

type LocalMessage = {
  id: string;
  user_id: string;
  user_message: string;
  ai_response: string;
  created_at: string;
};

function now() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const localStore: {
  profile: LocalProfile;
  symptoms: LocalSymptom[];
  reports: LocalReport[];
  messages: LocalMessage[];
} = {
  profile: {
    id: "demo-user",
    name: "Demo Patient",
    email: "demo@medisense.local",
    avatar_url: null,
    age: null,
    gender: null,
    weight_kg: null,
    height_cm: null,
    blood_group: null,
    medical_conditions: [] as string[],
    allergies: [] as string[],
    phone: null,
    address: null,
    emergency_contact: null,
    created_at: now()
  },
  symptoms: [],
  reports: [],
  messages: []
};

type ProfilePatch = Partial<LocalProfile>;

export function addLocalSymptom(userId: string, symptoms: string[], prediction: PredictionResult) {
  const record = {
    id: id("symptom"),
    user_id: userId,
    symptom_list: symptoms,
    predicted_disease: prediction.prediction,
    confidence_score: prediction.confidence,
    risk_level: prediction.riskLevel,
    recommendations: prediction.recommendations.join(" "),
    explanation: prediction.explanation ?? {},
    created_at: now()
  };
  localStore.symptoms.unshift(record);
  return record;
}

export function addLocalReport(record: Omit<LocalReport, "id" | "created_at">) {
  const next = { ...record, id: id("report"), created_at: now() };
  localStore.reports.unshift(next);
  return next;
}

export function addLocalMessage(userId: string, userMessage: string, aiResponse: string) {
  const record = { id: id("chat"), user_id: userId, user_message: userMessage, ai_response: aiResponse, created_at: now() };
  localStore.messages.push(record);
  return record;
}

export function updateLocalProfile(patch: ProfilePatch) {
  localStore.profile = { ...localStore.profile, ...patch };
  return localStore.profile;
}
