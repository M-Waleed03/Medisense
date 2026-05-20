"use client";

import { useState } from "react";
import { FileScan, Loader2, UploadCloud } from "lucide-react";
import { apiUpload } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ReportFlag } from "@/types/medisense";

type ReportResponse = {
  analysis: {
    extracted_data: Record<string, string | number | undefined>;
    raw_text: string;
    analysis: string;
    flags?: ReportFlag[];
  };
};

export function ReportUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ReportResponse["analysis"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function upload() {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp", "application/pdf"].includes(file.type)) {
      setError("Only PNG, JPG, WEBP, and PDF reports are supported.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Report file must be 8MB or smaller.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await apiUpload<ReportResponse>("/reports", file);
      setResult(response.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OCR failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.8fr_1fr]">
      <Card>
        <FileScan className="mb-4 h-7 w-7 text-primary" />
        <h2 className="text-xl font-bold">Upload medical report</h2>
        <label className="mt-5 grid min-h-48 cursor-pointer place-items-center rounded-lg border border-dashed border-primary/40 bg-blue-50/60 p-6 text-center">
          <UploadCloud className="mb-3 h-8 w-8 text-primary" />
          <span className="font-semibold">{file?.name ?? "Choose report image"}</span>
          <span className="mt-1 text-sm text-slate-500">PNG, JPG, WEBP, or PDF CBC-style report</span>
          <input className="hidden" type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <Button className="mt-5 w-full" disabled={!file || loading} onClick={upload}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Analyze report
        </Button>
        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {error && file && <Button variant="outline" className="mt-3 w-full" disabled={loading} onClick={upload}>Retry OCR</Button>}
      </Card>
      <Card>
        <h2 className="text-xl font-bold">Extracted insights</h2>
        {result ? (
          <div className="mt-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <Value label="Platelets" value={result.extracted_data.platelets ?? "N/A"} />
              <Value label="WBC" value={result.extracted_data.wbc ?? "N/A"} />
              <Value label="RBC" value={result.extracted_data.rbc ?? "N/A"} />
              <Value label="Hemoglobin" value={result.extracted_data.hemoglobin ?? "N/A"} />
              <Value label="Hematocrit" value={result.extracted_data.hematocrit ?? "N/A"} />
              <Value label="MCV" value={result.extracted_data.mcv ?? "N/A"} />
              <Value label="MCH" value={result.extracted_data.mch ?? "N/A"} />
              <Value label="MCHC" value={result.extracted_data.mchc ?? "N/A"} />
              <Value label="Neutrophils" value={result.extracted_data.neutrophils ?? "N/A"} />
              <Value label="Lymphocytes" value={result.extracted_data.lymphocytes ?? "N/A"} />
            </div>
            {(result.flags ?? []).length > 0 && (
              <div className="space-y-2">
                {result.flags?.map((flag) => (
                  <div key={`${flag.label}-${flag.detail}`} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    <p className="font-bold">{flag.label}</p>
                    <p className="mt-1">{flag.detail}</p>
                  </div>
                ))}
              </div>
            )}
            <p className="rounded-lg bg-white/70 p-4 text-sm leading-6 text-slate-700">{result.analysis}</p>
            <details className="text-sm text-slate-500">
              <summary className="cursor-pointer font-semibold">Raw OCR text</summary>
              <pre className="mt-2 max-h-44 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-white">{result.raw_text}</pre>
            </details>
          </div>
        ) : (
          <p className="mt-5 text-slate-600">OCR values and interpretation will appear after upload.</p>
        )}
      </Card>
    </div>
  );
}

function Value({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-white/75 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}
