"use client";

import { DragEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, FileScan, Loader2, Microscope, ScanLine, UploadCloud } from "lucide-react";
import { apiUpload } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { HoloPanel, PulseLine, ScannerLoader, SignalBadge } from "@/components/ui/premium";
import type { ReportFlag } from "@/types/medisense";

type ReportResponse = {
  analysis: {
    extracted_data: Record<string, string | number | undefined>;
    raw_text: string;
    analysis: string;
    flags?: ReportFlag[];
  };
};

const markers = ["platelets", "wbc", "rbc", "hemoglobin", "hematocrit", "mcv", "mch", "mchc", "neutrophils", "lymphocytes"];

export function ReportUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ReportResponse["analysis"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const chartData = useMemo(() => markers.map((marker) => ({
    marker,
    value: numericValue(result?.extracted_data?.[marker])
  })).filter((item) => item.value !== null), [result]);

  function setPicked(next: File | null) {
    setFile(next);
    setResult(null);
    setError("");
  }

  function drop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    setPicked(event.dataTransfer.files?.[0] ?? null);
  }

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
    <div className="grid gap-5 lg:grid-cols-[0.76fr_1fr]">
      <HoloPanel className="h-fit">
        <SignalBadge icon="pulse">OCR command deck</SignalBadge>
        <h2 className="mt-4 text-3xl font-black text-ink">Medical report analyzer</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Drop a CBC-style report and MEDISENSE will route the file through Cloudinary, OCR, value extraction, and clinical insight generation.</p>
        <label
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={drop}
          className={`scan-sheen mt-6 grid min-h-64 cursor-pointer place-items-center rounded-lg border border-dashed p-6 text-center transition ${dragging ? "border-primary bg-blue-50/80" : "border-primary/35 bg-white/68 hover:bg-white/80"}`}
        >
          <div>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-lg bg-gradient-to-br from-primary via-cyan to-secondary text-white shadow-glow">
              <UploadCloud className="h-8 w-8" />
            </div>
            <p className="mt-4 text-lg font-black text-ink">{file?.name ?? "Drop report or choose file"}</p>
            <p className="mt-1 text-sm text-muted">PNG, JPG, WEBP, or PDF. Max 8MB.</p>
          </div>
          <input className="hidden" type="file" accept="image/*,.pdf" onChange={(e) => setPicked(e.target.files?.[0] ?? null)} />
        </label>
        <Button className="mt-5 w-full" disabled={!file || loading} onClick={upload}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
          Analyze report
        </Button>
        {loading && <div className="mt-5"><ScannerLoader label="OCR and lab values processing" /></div>}
        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
        {error && file && <Button variant="outline" className="mt-3 w-full" disabled={loading} onClick={upload}>Retry OCR</Button>}
      </HoloPanel>

      <div className="space-y-5">
        <HoloPanel>
          <div className="flex items-center gap-3">
            <FileScan className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-black text-ink">Extracted medical intelligence</h2>
          </div>
          {result ? (
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {markers.map((marker) => <Value key={marker} label={markerLabel(marker)} value={result.extracted_data[marker] ?? "N/A"} />)}
              </div>
              <PulseLine />
              {chartData.length > 0 && (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#D9E6F2" />
                      <XAxis dataKey="marker" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#2563EB" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed border-slate-200 bg-white/58 p-6 text-sm text-muted">OCR values, charts, and interpretation appear after upload.</div>
          )}
        </HoloPanel>

        {result && (
          <HoloPanel>
            <div className="flex items-center gap-3">
              <Microscope className="h-6 w-6 text-secondary" />
              <h2 className="text-2xl font-black text-ink">Clinical summary</h2>
            </div>
            <p className="mt-4 rounded-lg border border-white/80 bg-white/72 p-4 text-sm leading-7 text-slate-700">{result.analysis}</p>
            {(result.flags ?? []).length > 0 && (
              <div className="mt-4 space-y-2">
                {result.flags?.map((flag) => (
                  <div key={`${flag.label}-${flag.detail}`} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    <p className="flex items-center gap-2 font-black"><AlertTriangle className="h-4 w-4" />{flag.label}</p>
                    <p className="mt-1 leading-6">{flag.detail}</p>
                  </div>
                ))}
              </div>
            )}
            <details className="mt-4 text-sm text-slate-500">
              <summary className="cursor-pointer font-bold">Raw OCR text</summary>
              <pre className="mt-2 max-h-44 overflow-auto rounded-lg bg-ink p-3 text-xs text-white">{result.raw_text}</pre>
            </details>
          </HoloPanel>
        )}
      </div>
    </div>
  );
}

function Value({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-white/80 bg-white/75 p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-ink">{value}</p>
    </div>
  );
}

function markerLabel(marker: string) {
  return marker === "wbc" ? "WBC" : marker === "rbc" ? "RBC" : marker.toUpperCase();
}

function numericValue(value: unknown) {
  if (value === null || value === undefined || value === "" || value === "N/A") return null;
  const parsed = Number(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}
