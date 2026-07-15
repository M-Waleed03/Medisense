import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const REPORT_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
const PROFILE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const REPORT_MAX_SIZE = 8 * 1024 * 1024;
const PROFILE_MAX_SIZE = 4 * 1024 * 1024;

class UploadError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function mlBaseUrl() {
  return (process.env.NEXT_PUBLIC_AI_API_URL ?? process.env.NEXT_PUBLIC_ML_API_URL ?? process.env.ML_SERVICE_URL ?? "http://localhost:8000").replace(/\/$/, "");
}

function dataMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const detail = record.error ?? record.detail ?? record.message;
    if (typeof detail === "string" && detail.trim()) return detail;
  }
  return fallback;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeReportAnalysis(ocr: Record<string, unknown>, analysis: Record<string, unknown> | null) {
  const extracted = (ocr.extractedValues ?? ocr.extracted_data ?? {}) as Record<string, unknown>;
  return {
    extracted_data: extracted,
    raw_text: String(ocr.extractedText ?? ocr.raw_text ?? ""),
    analysis: String(analysis?.summary ?? analysis?.analysis ?? ocr.analysis ?? ""),
    flags: analysis?.flags ?? ocr.flags ?? [],
    riskLevel: analysis?.riskLevel ?? ocr.riskLevel ?? "low",
    disclaimer: analysis?.disclaimer ?? ocr.disclaimer
  };
}

async function analyzeReportWithMl(file: File) {
  const form = new FormData();
  form.append("file", file);

  try {
    const ocrResponse = await fetchWithTimeout(`${mlBaseUrl()}/ocr`, {
      method: "POST",
      body: form
    }, 60000);
    const ocr = await ocrResponse.json().catch(() => ({})) as Record<string, unknown>;

    if (!ocrResponse.ok) {
      return NextResponse.json({
        error: dataMessage(ocr, "OCR could not read the report. Upload a clearer image/PDF or try again.")
      }, { status: ocrResponse.status });
    }

    let valueAnalysis: Record<string, unknown> | null = null;
    try {
      const analysisResponse = await fetchWithTimeout(`${mlBaseUrl()}/analyze-report-values`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: ocr.extractedValues ?? ocr.extracted_data ?? {}, symptoms: [] })
      }, 30000);
      if (analysisResponse.ok) {
        valueAnalysis = await analysisResponse.json().catch(() => null);
      }
    } catch {
      valueAnalysis = null;
    }

    return NextResponse.json({
      analysis: normalizeReportAnalysis(ocr, valueAnalysis),
      storage: "ml-direct"
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({
      error: "Report analysis service is unavailable right now. Start the ML service and try again.",
      detail
    }, { status: 502 });
  }
}

async function uploadToCloudinary(file: File, folder: string, cloudName: string, apiKey: string, apiSecret: string) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest("hex");
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const cloudinaryForm = new FormData();
      cloudinaryForm.append("file", file);
      cloudinaryForm.append("api_key", apiKey);
      cloudinaryForm.append("timestamp", timestamp);
      cloudinaryForm.append("folder", folder);
      cloudinaryForm.append("signature", signature);

      const response = await fetchWithTimeout(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: "POST",
        body: cloudinaryForm
      }, 60000);
      const data = await response.json().catch(() => ({})) as Record<string, any>;

      if (!response.ok) {
        const message = dataMessage(data, "Cloudinary upload failed.");
        if (response.status >= 400 && response.status < 500) {
          throw new UploadError(message, response.status);
        }
        throw new Error(`Cloudinary error: ${message}`);
      }

      return {
        secureUrl: data.secure_url,
        publicId: data.public_id,
        resourceType: data.resource_type,
        format: data.format,
        bytes: data.bytes
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (error instanceof UploadError || attempt === 3) break;
      console.warn(`Cloudinary upload attempt ${attempt} failed, retrying:`, lastError.message);
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
    }
  }

  throw lastError ?? new Error("Cloudinary upload failed.");
}

export async function POST(request: Request) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authentication token is required for uploads." }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") ?? "report");
  const userId = String(form.get("userId") ?? "unknown").replace(/[^\w-]/g, "");
  const declaredType = String(form.get("fileType") ?? "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  }

  const isProfile = kind === "profile";
  const allowed = isProfile ? PROFILE_TYPES : REPORT_TYPES;
  const fileType = file.type === "application/octet-stream" && declaredType ? declaredType : file.type;
  if (!allowed.includes(fileType)) {
    return NextResponse.json({ error: isProfile ? "Profile image must be PNG, JPG, or WEBP." : "Report must be PNG, JPG, WEBP, or PDF." }, { status: 415 });
  }

  const maxSize = isProfile ? PROFILE_MAX_SIZE : REPORT_MAX_SIZE;
  if (file.size > maxSize) {
    return NextResponse.json({ error: `File must be ${Math.round(maxSize / 1024 / 1024)}MB or smaller.` }, { status: 413 });
  }

  if (!cloudName || !apiKey || !apiSecret) {
    if (!isProfile) return analyzeReportWithMl(file);
    return NextResponse.json({ error: "Cloudinary is not configured on the server." }, { status: 500 });
  }

  const folder = `medisense/${isProfile ? "profiles" : "reports"}/${userId}`;

  try {
    return NextResponse.json(await uploadToCloudinary(file, folder, cloudName, apiKey, apiSecret));
  } catch (error) {
    if (!isProfile) {
      console.warn("Cloudinary report upload failed; falling back to direct ML OCR.", error instanceof Error ? error.message : error);
      return analyzeReportWithMl(file);
    }
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: `Upload failed after 3 attempts: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 503 }
    );
  }
}
