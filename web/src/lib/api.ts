"use client";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { env } from "@/lib/env";
import { requireFirebase } from "@/lib/firebase";
import { ensureClientProfile } from "@/lib/profile";

const DISCLAIMER = "This is AI-based pre-diagnosis support and not a replacement for professional medical advice.";

async function currentUser(): Promise<User> {
  const { auth } = requireFirebase();
  if (auth.currentUser) return auth.currentUser;
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) resolve(user);
      else reject(new Error("Please sign in again to continue."));
    }, reject);
  });
}

async function mlFetch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  let response: globalThis.Response;
  try {
    response = await fetch(`${env.mlApiUrl}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      ...init
    });
  } catch (error) {
    throw new Error(
      path.includes("chat")
        ? "The AI assistant is currently offline. Please start the backend service."
        : "AI service is temporarily unavailable. Please start the backend server."
    );
  }
  if (!response.ok) throw new Error(await responseError(response, "AI service request failed", path));
  return response.json();
}

export async function apiGet<T>(path: string): Promise<T> {
  const user = await currentUser();
  await ensureClientProfile();
  if (path === "/profile") return { profile: await getProfile(user.uid) } as T;
  if (path === "/settings") return { settings: await getSettings(user.uid) } as T;
  if (path === "/history") return getHistory(user.uid) as T;
  if (path === "/chatbot") return { messages: await listByUser("chatbot_messages", user.uid) } as T;
  if (path === "/reports") return { reports: await listByUser("medical_reports", user.uid) } as T;
  throw new Error(`Unsupported API path: ${path}`);
}

export async function apiPost<T>(path: string, body: any): Promise<T> {
  const user = await currentUser();
  await ensureClientProfile();

  if (path === "/symptoms") {
    const symptoms = [...new Set([...(body.symptoms ?? []), ...clinicalInputSymptoms(body.clinicalInputs ?? {})])];
    const ml = await mlFetch<any>("/predict-symptoms", { symptoms, clinicalInputs: body.clinicalInputs ?? {} });
    const result = normalizeSymptomResult(ml);
    const ref = await addDoc(collection(requireFirebase().db, "symptom_checks"), {
      userId: user.uid,
      symptoms,
      clinicalInputs: body.clinicalInputs ?? {},
      result,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { result, id: ref.id } as T;
  }

  if (path === "/text-symptoms") {
    const ml = await mlFetch<any>("/predict-text-symptoms", { text: body.text ?? body.message ?? "" });
    const result = normalizeTextResult(ml);
    const ref = await addDoc(collection(requireFirebase().db, "text_symptom_checks"), {
      userId: user.uid,
      text: body.text ?? body.message ?? "",
      result,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { result, id: ref.id } as T;
  }

  if (path === "/chatbot") {
    const recent = (await listByUser("chatbot_messages", user.uid)).slice(0, 8).reverse();
    const history = recent.flatMap((item: any) => [
      { role: "user", content: item.user_message },
      { role: "assistant", content: item.ai_response }
    ]);
    const [profile, symptomChecks, reports] = await Promise.all([
      getProfile(user.uid).catch(() => null),
      listByUser("symptom_checks", user.uid).catch(() => []),
      listByUser("medical_reports", user.uid).catch(() => [])
    ]);
    const healthContext = {
      profile,
      latestSymptomCheck: symptomChecks[0] ?? null,
      latestReport: reports[0] ?? null,
      currentPageContext: body.healthContext ?? null
    };
    const ml = await mlFetch<{ response: string; provider?: string; fallback?: boolean; savedToFirestore?: boolean; record?: { id?: string } }>("/chatbot", {
      message: body.message,
      userId: user.uid,
      context: healthContext,
      history,
      healthContext
    });
    const record = {
      userId: user.uid,
      user_message: body.message,
      ai_response: ml.response,
      provider: ml.provider ?? "local_rules",
      fallback: Boolean(ml.fallback),
      healthContext,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    if (ml.savedToFirestore) {
      return { id: ml.record?.id ?? "server-saved", response: ml.response } as T;
    }
    const ref = await addDoc(collection(requireFirebase().db, "chatbot_messages"), record);
    return { id: ref.id, response: ml.response } as T;
  }

  throw new Error(`Unsupported API path: ${path}`);
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const user = await currentUser();
  const { db } = requireFirebase();
  if (path === "/profile") {
    await setDoc(doc(db, "users", user.uid), { ...toFirestoreProfile(body as Record<string, unknown>), userId: user.uid, updatedAt: serverTimestamp() }, { merge: true });
    return { profile: await getProfile(user.uid) } as T;
  }
  if (path === "/settings") {
    await setDoc(doc(db, "user_settings", user.uid), { ...(body as object), userId: user.uid, updatedAt: serverTimestamp() }, { merge: true });
    return { settings: await getSettings(user.uid) } as T;
  }
  throw new Error(`Unsupported API path: ${path}`);
}

export async function apiUpload<T>(path: string, file: File): Promise<T> {
  const user = await currentUser();
  await ensureClientProfile();
  if (path !== "/reports" && path !== "/profile-image") throw new Error(`Unsupported upload path: ${path}`);

  // Force refresh token to ensure it's not expired (critical for long uploads)
  const token = await user.getIdToken(true);
  const form = new FormData();
  form.append("file", file);
  form.append("kind", path === "/profile-image" ? "profile" : "report");
  form.append("userId", user.uid);

  let upload: Response;
  try {
    upload = await fetch("/api/cloudinary-upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form
    });
  } catch (error) {
    throw new Error(`Upload failed: ${error instanceof Error ? error.message : "Network error"}`);
  }
  
  if (!upload.ok) {
    if (upload.status === 401) {
      throw new Error("Session expired. Please sign in again and retry your upload.");
    }
    throw new Error(await responseError(upload, path === "/reports" ? "Report upload failed" : "Cloudinary upload failed"));
  }
  const uploaded = await upload.json();

  if (path === "/profile-image") {
    await updateDoc(doc(requireFirebase().db, "users", user.uid), {
      profileImage: uploaded.secureUrl,
      profileImagePublicId: uploaded.publicId,
      updatedAt: serverTimestamp()
    });
    return uploaded as T;
  }

  if (uploaded?.analysis) {
    const result = normalizeReportAnalysis(uploaded.analysis);
    const record = await saveReportAnalysis(user.uid, file, uploaded, result);
    return { analysis: result, record } as T;
  }

  if (!uploaded.secureUrl) throw new Error("Upload response did not include a secure URL.");

  const ocr = await mlFetch<any>("/ocr-report", { fileUrl: uploaded.secureUrl, fileType: file.type, fileName: file.name });
  const extracted = ocr.extractedValues ?? ocr.extracted_data ?? {};
  const analysis = await mlFetch<any>("/analyze-report-values", { values: extracted, symptoms: [] });
  const result = normalizeReportAnalysis({
    extracted_data: extracted,
    raw_text: ocr.extractedText ?? ocr.raw_text ?? "",
    analysis: analysis.summary ?? analysis.analysis ?? "",
    flags: analysis.flags ?? [],
    riskLevel: analysis.riskLevel ?? "low",
    disclaimer: analysis.disclaimer ?? DISCLAIMER
  });
  const record = await saveReportAnalysis(user.uid, file, uploaded, result);

  return { analysis: result, record } as T;
}

type NormalizedReportAnalysis = {
  extracted_data: Record<string, unknown>;
  raw_text: string;
  analysis: string;
  flags: unknown[];
  riskLevel: string;
  disclaimer: string;
};

function normalizeReportAnalysis(payload: any): NormalizedReportAnalysis {
  const nestedAnalysis = typeof payload?.analysis === "object" && payload.analysis !== null ? payload.analysis : null;
  return {
    extracted_data: payload?.extracted_data ?? payload?.extractedValues ?? {},
    raw_text: String(payload?.raw_text ?? payload?.extractedText ?? ""),
    analysis: String(nestedAnalysis?.summary ?? nestedAnalysis?.analysis ?? payload?.analysis ?? "Report analyzed."),
    flags: payload?.flags ?? nestedAnalysis?.flags ?? [],
    riskLevel: String(payload?.riskLevel ?? nestedAnalysis?.riskLevel ?? "low"),
    disclaimer: String(payload?.disclaimer ?? nestedAnalysis?.disclaimer ?? DISCLAIMER)
  };
}

async function saveReportAnalysis(userId: string, file: File, uploaded: any, result: NormalizedReportAnalysis) {
  const extracted = result.extracted_data;
  const record = {
    userId,
    fileUrl: uploaded.secureUrl ?? null,
    publicId: uploaded.publicId ?? null,
    fileType: file.type || null,
    file_name: file.name,
    extractedText: result.raw_text,
    extractedValues: extracted,
    analysisResult: result.analysis,
    riskLevel: result.riskLevel,
    flags: result.flags,
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
    monocytes: toNumber(extracted.monocytes),
    dengue_igg: textOrNull(extracted.dengue_igg),
    dengue_igm: textOrNull(extracted.dengue_igm),
    diagnosis: result.analysis,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const ref = await addDoc(collection(requireFirebase().db, "medical_reports"), record);
  const markers = ["platelets", "wbc", "rbc", "hemoglobin", "hematocrit", "mcv", "mch", "mchc", "neutrophils", "lymphocytes", "monocytes"];
  await Promise.all(markers.map((marker) => addDoc(collection(requireFirebase().db, "report_values"), {
    userId,
    reportId: ref.id,
    marker,
    value: toNumber(extracted[marker]),
    status: markerStatus(marker, toNumber(extracted[marker])),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })));

  return { id: ref.id, ...record };
}

async function getProfile(userId: string) {
  const { db } = requireFirebase();
  const ref = doc(db, "users", userId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    await ensureClientProfile();
    return getProfile(userId);
  }
  const data = snapshot.data();
  return {
    id: userId,
    name: data.fullName ?? data.name ?? null,
    fullName: data.fullName ?? data.name ?? null,
    email: data.email ?? null,
    avatar_url: data.profileImage ?? data.avatar_url ?? null,
    profileImage: data.profileImage ?? data.avatar_url ?? null,
    age: data.age ?? null,
    gender: data.gender ?? null,
    weight_kg: data.weight ?? data.weight_kg ?? null,
    height_cm: data.height ?? data.height_cm ?? null,
    blood_group: data.bloodGroup ?? data.blood_group ?? null,
    bloodGroup: data.bloodGroup ?? data.blood_group ?? null,
    medical_conditions: data.existingConditions ?? data.medical_conditions ?? [],
    existingConditions: data.existingConditions ?? data.medical_conditions ?? [],
    allergies: data.allergies ?? [],
    phone: data.phone ?? null,
    address: data.address ?? null,
    city: data.city ?? null,
    emergency_contact: data.emergencyContact ?? data.emergency_contact ?? null,
    emergencyContact: data.emergencyContact ?? data.emergency_contact ?? null
  };
}

async function getSettings(userId: string) {
  const { db } = requireFirebase();
  const ref = doc(db, "user_settings", userId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    const defaults = {
      userId,
      email_notifications: true,
      report_alerts: true,
      symptom_reminders: false,
      theme: "light",
      privacyMode: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(ref, defaults);
    return defaults;
  }
  return snapshot.data();
}

async function getHistory(userId: string) {
  const [symptoms, textSymptoms, reports, messages, recommendations] = await Promise.all([
    listByUser("symptom_checks", userId),
    listByUser("text_symptom_checks", userId),
    listByUser("medical_reports", userId),
    listByUser("chatbot_messages", userId),
    listByUser("recommendations", userId)
  ]);
  return { symptoms, textSymptoms, reports, messages, recommendations };
}

async function listByUser(name: string, userId: string) {
  const { db } = requireFirebase();
  const snapshots = await getDocs(query(collection(db, name), where("userId", "==", userId), limit(100)));
  return snapshots.docs
    .map((item) => normalizeRecord(name, item.id, item.data()))
    .sort((a: any, b: any) => Date.parse(b.created_at ?? "") - Date.parse(a.created_at ?? ""));
}

function normalizeRecord(collectionName: string, id: string, data: any) {
  const created = timestampToIso(data.createdAt ?? data.created_at);
  if (collectionName === "symptom_checks") {
    const result = data.result ?? {};
    return {
      id,
      symptom_list: data.symptoms ?? data.symptom_list ?? [],
      predicted_disease: result.predictedDisease ?? result.prediction ?? data.predicted_disease ?? "Needs review",
      confidence_score: Number(result.confidence ?? data.confidence_score ?? 0),
      risk_level: result.riskLevel ?? data.risk_level ?? "low",
      recommendations: Array.isArray(result.precautions) ? result.precautions.join(" ") : result.recommendations ?? data.recommendations ?? "",
      explanation: result,
      created_at: created
    };
  }
  if (collectionName === "medical_reports") {
    return {
      id,
      ...data,
      extracted_values: data.extractedValues ?? data.extracted_values,
      diagnosis: data.analysisResult ?? data.diagnosis ?? "",
      created_at: created
    };
  }
  if (collectionName === "chatbot_messages") {
    return { id, ...data, created_at: created };
  }
  return { id, ...data, created_at: created };
}

function normalizeSymptomResult(data: any) {
  return {
    prediction: data.predictedDisease ?? data.prediction,
    predictedDisease: data.predictedDisease ?? data.prediction,
    confidence: Number(data.confidence ?? 0),
    riskLevel: data.riskLevel ?? data.risk_level ?? "low",
    possibleDiseases: data.possibleDiseases ?? [],
    explanation: data.explanation ?? "",
    recommendedTests: data.recommendedTests ?? data.recommended_tests ?? [],
    precautions: data.precautions ?? [],
    medicineGuidance: data.medicineGuidance ?? "",
    doctorAdvice: data.doctorAdvice ?? "",
    recommendations: data.recommendations ?? data.precautions ?? [],
    disclaimer: data.disclaimer ?? DISCLAIMER
  };
}

function normalizeTextResult(data: any) {
  return {
    predictedDisease: data.predictedDisease ?? data.prediction,
    confidence: Number(data.confidence ?? 0),
    explanation: data.explanation ?? "",
    suggestedNextStep: data.suggestedNextStep ?? "",
    disclaimer: data.disclaimer ?? DISCLAIMER
  };
}

function clinicalInputSymptoms(input: Record<string, unknown>) {
  const symptoms: string[] = [];
  if (input.feverLevel && input.feverLevel !== "none") symptoms.push("fever");
  if (input.feverLevel) symptoms.push(`${input.feverLevel} fever`);
  if (input.temperature) symptoms.push(`temperature ${input.temperature}`);
  if (input.feverDuration) symptoms.push(`fever duration ${input.feverDuration}`);
  if (input.feverPattern) symptoms.push(`${input.feverPattern}`);
  if (input.mosquitoExposure) symptoms.push("mosquito exposure");
  if (input.travelHistory) symptoms.push("travel history");
  if (input.foodWaterExposure) symptoms.push("recent contaminated food/water exposure");
  return symptoms;
}

function toFirestoreProfile(data: Record<string, unknown>) {
  const next: Record<string, unknown> = {};
  if ("fullName" in data || "name" in data) next.fullName = data.fullName ?? data.name ?? null;
  if ("profileImage" in data || "avatar_url" in data) next.profileImage = data.profileImage ?? data.avatar_url ?? null;
  if ("age" in data) next.age = numberOrNull(data.age);
  if ("gender" in data) next.gender = data.gender ?? null;
  if ("bloodGroup" in data || "blood_group" in data) next.bloodGroup = data.bloodGroup ?? data.blood_group ?? null;
  if ("height" in data || "height_cm" in data) next.height = numberOrNull(data.height ?? data.height_cm);
  if ("weight" in data || "weight_kg" in data) next.weight = numberOrNull(data.weight ?? data.weight_kg);
  if ("allergies" in data) next.allergies = data.allergies ?? [];
  if ("existingConditions" in data || "medical_conditions" in data) next.existingConditions = data.existingConditions ?? data.medical_conditions ?? [];
  if ("emergencyContact" in data || "emergency_contact" in data) next.emergencyContact = data.emergencyContact ?? data.emergency_contact ?? null;
  if ("address" in data) next.address = data.address ?? null;
  if ("city" in data) next.city = data.city ?? null;
  if ("phone" in data) next.phone = data.phone ?? null;
  return next;
}

function timestampToIso(value: any) {
  if (!value) return new Date().toISOString();
  if (typeof value === "string") return value;
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  return new Date(value).toISOString();
}

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "N/A" || value === "") return null;
  const parsed = Number(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function textOrNull(value: unknown) {
  if (value === null || value === undefined || value === "" || value === "N/A") return null;
  return String(value);
}

function numberOrNull(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function markerStatus(marker: string, value: number | null) {
  if (value === null) return "unknown";
  const ranges: Record<string, { low: number; high: number }> = {
    platelets: { low: 150000, high: 450000 },
    wbc: { low: 4000, high: 11000 },
    rbc: { low: 4, high: 5.9 },
    hemoglobin: { low: 12, high: 17.5 },
    hematocrit: { low: 36, high: 52 },
    mcv: { low: 80, high: 100 },
    mch: { low: 27, high: 33 },
    mchc: { low: 32, high: 36 },
    neutrophils: { low: 40, high: 75 },
    lymphocytes: { low: 20, high: 45 },
    monocytes: { low: 2, high: 10 }
  };
  const range = ranges[marker];
  if (!range) return "unknown";
  if (value < range.low) return "low";
  if (value > range.high) return "high";
  return "normal";
}

async function responseError(response: Response, fallback: string, path?: string) {
  try {
    const data = await response.json();
    const detail = data.error ?? data.detail ?? fallback;
    if (path?.includes("chat")) return chatErrorMessage(detail);
    if (typeof detail === "string" && detail.toLowerCase().includes("failed to fetch")) {
      return path?.includes("chat") ? "The AI assistant is currently offline. Please start the backend service." : "AI service is temporarily unavailable. Please start the backend server.";
    }
    if (typeof detail === "string" && (detail.includes("insufficient_quota") || detail.toLowerCase().includes("quota exceeded") || detail.includes("rate-limit"))) {
      return "MEDISENSE could not complete that request right now. Please try again in a moment.";
    }
    return detail;
  } catch {
    if (path?.includes("chat")) return "MEDISENSE could not answer right now. Please try again in a moment.";
    return `${fallback} (${response.status})`;
  }
}

function chatErrorMessage(value: unknown) {
  const text = typeof value === "string" ? value : "";
  if (!text.trim()) return "MEDISENSE could not answer right now. Please try again in a moment.";
  if (/failed to fetch|connection refused|network|backend/i.test(text)) {
    return "The AI assistant is currently offline. Please start the backend service.";
  }
  if (/quota|provider|api key|groq|gemini|openrouter|rate-limit|insufficient/i.test(text)) {
    return "MEDISENSE could not answer right now. Please try again in a moment.";
  }
  return text;
}
