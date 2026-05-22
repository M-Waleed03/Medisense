export type SymptomRecord = {
  id: string;
  symptom_list: string[];
  predicted_disease: string;
  confidence_score: number;
  risk_level?: string;
  recommendations?: string;
  explanation?: Record<string, unknown>;
  created_at: string;
};

export type ReportFlag = {
  severity: "low" | "moderate" | "high" | "critical";
  label: string;
  detail: string;
};

export type ReportRecord = {
  id: string;
  file_name?: string;
  platelets: number | null;
  wbc: number | null;
  rbc: number | null;
  hemoglobin: number | null;
  hematocrit: number | null;
  mcv?: number | null;
  mch?: number | null;
  mchc?: number | null;
  neutrophils?: number | null;
  lymphocytes?: number | null;
  extracted_values?: Record<string, unknown>;
  diagnosis: string;
  riskLevel?: string;
  flags?: ReportFlag[];
  created_at: string;
};

export type ChatMessage = {
  id: string;
  user_message: string;
  ai_response: string;
  provider?: string;
  fallback?: boolean;
  created_at: string;
};

export type UserProfile = {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  profileImage?: string | null;
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
};
