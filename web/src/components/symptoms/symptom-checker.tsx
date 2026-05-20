"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, ClipboardList, Loader2, RefreshCw, ShieldAlert, Stethoscope } from "lucide-react";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { percent } from "@/lib/utils";

type ClinicalInputs = {
  feverLevel: string;
  temperature: string;
  feverDuration: string;
  feverPattern: string;
};

type PossibleDisease = {
  disease: string;
  confidence: number;
};

type SymptomResult = {
  prediction: string;
  predictedDisease?: string;
  confidence: number;
  riskLevel: string;
  possibleDiseases?: PossibleDisease[];
  explanation?: string;
  recommendedTests?: string[];
  precautions?: string[];
  doctorAdvice?: string;
  medicineGuidance?: string;
  recommendations?: string[];
  disclaimer?: string;
};

type Response = { result: SymptomResult };
type TextResponse = { result: { predictedDisease: string; confidence: number; explanation: string; suggestedNextStep: string; disclaimer: string } };

const feverLevels = [
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
  { value: "very high", label: "Very high" }
];

const feverPatterns = ["continuous", "intermittent", "evening fever", "night fever"];

const symptomGroups = [
  {
    title: "General Symptoms",
    description: "Broad symptoms that help the model separate viral illness, flu-like illness, dengue, malaria, and typhoid patterns.",
    items: ["headache", "body pain", "weakness", "fatigue", "chills", "sweating", "joint pain", "muscle pain", "appetite loss"]
  },
  {
    title: "Digestive Symptoms",
    description: "Gut symptoms are important for typhoid, food/water exposure, dehydration risk, and abdominal warning signs.",
    items: ["nausea", "vomiting", "diarrhea", "abdominal pain", "constipation", "stomach cramps"]
  },
  {
    title: "Respiratory Symptoms",
    description: "Respiratory signs can shift the prediction toward flu or other viral respiratory illness.",
    items: ["cough", "sore throat", "runny nose", "chest discomfort", "breathing difficulty"]
  },
  {
    title: "Dengue Indicators",
    description: "These signals increase dengue concern and help decide when platelet testing or urgent care advice is needed.",
    items: ["rash", "eye pain", "bleeding gums", "nose bleeding", "low platelets if known", "mosquito exposure"]
  },
  {
    title: "Malaria Indicators",
    description: "Repeated fever cycles, travel, mosquito bite history, and chills with sweating are useful malaria clues.",
    items: ["chills with sweating", "recent mosquito bite", "travel to malaria area", "repeated fever cycles"]
  },
  {
    title: "Typhoid Indicators",
    description: "Typhoid suspicion rises with persistent fever and contaminated food or water exposure.",
    items: ["contaminated food/water exposure", "abdominal pain", "persistent fever", "diarrhea or constipation", "coated tongue if applicable"]
  },
  {
    title: "Risk Factors",
    description: "Risk factors do not diagnose disease, but they shape safety guidance and escalation advice.",
    items: ["recent travel", "contact with sick person", "existing medical condition", "pregnancy", "child/elderly patient", "low immunity"]
  }
];

const defaultClinicalInputs: ClinicalInputs = {
  feverLevel: "moderate",
  temperature: "",
  feverDuration: "",
  feverPattern: "continuous"
};

export function SymptomChecker() {
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<SymptomResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [textLoading, setTextLoading] = useState(false);
  const [error, setError] = useState("");
  const [textSymptoms, setTextSymptoms] = useState("");
  const [textResult, setTextResult] = useState<TextResponse["result"] | null>(null);
  const [clinicalInputs, setClinicalInputs] = useState<ClinicalInputs>(defaultClinicalInputs);

  const selectedSummary = useMemo(() => {
    const fever = [`fever level: ${clinicalInputs.feverLevel}`, clinicalInputs.temperature && `temperature: ${clinicalInputs.temperature}`, clinicalInputs.feverDuration && `duration: ${clinicalInputs.feverDuration}`, `pattern: ${clinicalInputs.feverPattern}`].filter(Boolean);
    return [...fever, ...selected];
  }, [clinicalInputs, selected]);

  const completedSections = [
    clinicalInputs.feverLevel || clinicalInputs.temperature || clinicalInputs.feverDuration || clinicalInputs.feverPattern,
    selected.some((item) => symptomGroups.slice(0, 3).some((group) => group.items.includes(item))),
    selected.some((item) => symptomGroups.slice(3, 6).some((group) => group.items.includes(item))),
    selected.some((item) => symptomGroups[6].items.includes(item))
  ].filter(Boolean).length;

  function toggle(symptom: string) {
    setSelected((current) => (current.includes(symptom) ? current.filter((item) => item !== symptom) : [...current, symptom]));
  }

  function reset() {
    setSelected([]);
    setResult(null);
    setTextResult(null);
    setTextSymptoms("");
    setError("");
    setClinicalInputs(defaultClinicalInputs);
  }

  async function analyze() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await apiPost<Response>("/symptoms", { symptoms: selected, clinicalInputs });
      setResult(response.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed. Please check that the backend service is running.");
    } finally {
      setLoading(false);
    }
  }

  async function analyzeText() {
    setTextLoading(true);
    setError("");
    try {
      const response = await apiPost<TextResponse>("/text-symptoms", { text: textSymptoms });
      setTextResult(response.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Text symptom prediction failed. Please check that the backend service is running.");
    } finally {
      setTextLoading(false);
    }
  }

  const canPredict = selected.length > 0 || Boolean(clinicalInputs.temperature || clinicalInputs.feverDuration);

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.42fr]">
      <div className="space-y-5">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-slate-100 bg-white/80 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                  <Stethoscope className="h-4 w-4" />
                  Clinical Intake
                </div>
                <h2 className="mt-2 text-2xl font-black text-slate-950">Detailed symptom assessment</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Capture fever pattern, grouped symptoms, and risk factors before asking the AI service for a safety-first prediction.</p>
              </div>
              <div className="min-w-56">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Completion</span>
                  <span>{completedSections}/4</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${completedSections * 25}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-sm font-semibold text-slate-700">
              Fever level
              <select className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 outline-primary" value={clinicalInputs.feverLevel} onChange={(e) => setClinicalInputs((current) => ({ ...current, feverLevel: e.target.value }))}>
                {feverLevels.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Temperature
              <input className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 outline-primary" placeholder="e.g. 102 F or 38.9 C" value={clinicalInputs.temperature} onChange={(e) => setClinicalInputs((current) => ({ ...current, temperature: e.target.value }))} />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Fever duration
              <input className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 outline-primary" placeholder="e.g. 3 days" value={clinicalInputs.feverDuration} onChange={(e) => setClinicalInputs((current) => ({ ...current, feverDuration: e.target.value }))} />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Fever pattern
              <select className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 outline-primary" value={clinicalInputs.feverPattern} onChange={(e) => setClinicalInputs((current) => ({ ...current, feverPattern: e.target.value }))}>
                {feverPatterns.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          {symptomGroups.map((group, index) => (
            <Card key={group.title} className={index === symptomGroups.length - 1 ? "lg:col-span-2" : ""}>
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-primary">
                  {index < 3 ? <Activity className="h-5 w-5" /> : index < 6 ? <ShieldAlert className="h-5 w-5" /> : <ClipboardList className="h-5 w-5" />}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-950">{group.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{group.description}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {group.items.map((symptom) => {
                  const active = selected.includes(symptom);
                  return (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => toggle(symptom)}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${active ? "border-primary bg-blue-50 text-primary shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:bg-slate-50"}`}
                    >
                      {active ? "Selected: " : ""}{symptom}
                    </button>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-bold">Selected symptoms summary</h3>
              <p className="mt-1 text-sm text-slate-600">Review the signal sent to the AI service before prediction.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset} disabled={loading || textLoading}>
                <RefreshCw className="h-4 w-4" />
                Reset
              </Button>
              <Button onClick={analyze} disabled={!canPredict || loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Predict disease
              </Button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedSummary.map((item) => <span key={item} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">{item}</span>)}
            {selectedSummary.length === 0 && <p className="text-sm text-slate-500">No symptoms selected yet.</p>}
          </div>
          {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        </Card>

        <Card>
          <h3 className="text-lg font-bold">Describe symptoms naturally</h3>
          <p className="mt-1 text-sm text-slate-600">Use this when the checklist does not capture the full story.</p>
          <textarea
            className="mt-3 min-h-28 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-primary"
            placeholder="I have high fever at night, chills, sweating, headache, and weakness for three days."
            value={textSymptoms}
            onChange={(event) => setTextSymptoms(event.target.value)}
          />
          <Button className="mt-3" variant="secondary" onClick={analyzeText} disabled={!textSymptoms.trim() || textLoading}>
            {textLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Analyze text symptoms
          </Button>
          {textResult && (
            <div className="mt-4 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-950">
              <p className="font-bold">{textResult.predictedDisease} - {percent(textResult.confidence)}</p>
              <p className="mt-2">{textResult.explanation}</p>
              <p className="mt-2 font-semibold">{textResult.suggestedNextStep}</p>
            </div>
          )}
        </Card>
      </div>

      <Card className="h-fit xl:sticky xl:top-6">
        <h2 className="text-xl font-bold">Prediction result</h2>
        {loading && (
          <div className="mt-5 rounded-lg bg-blue-50 p-4 text-sm font-semibold text-primary">
            <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
            Analyzing symptoms with the medical AI service...
          </div>
        )}
        {result ? (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-5">
            <div>
              <p className="text-sm text-slate-500">Predicted disease</p>
              <p className="mt-1 text-3xl font-black text-slate-950">{result.predictedDisease ?? result.prediction}</p>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: percent(result.confidence) }} />
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-600">Confidence {percent(result.confidence)} | {result.riskLevel} risk</p>
            </div>

            <ResultList title="Possible diseases" items={(result.possibleDiseases ?? []).map((item) => `${item.disease} - ${percent(item.confidence)}`)} tone="slate" />
            <ResultList title="Recommended tests" items={result.recommendedTests ?? []} tone="blue" />
            <ResultList title="Precautions" items={result.precautions ?? result.recommendations ?? []} tone="amber" />
            {result.doctorAdvice && <ResultNote title="Doctor advice" text={result.doctorAdvice} />}
            {result.medicineGuidance && <ResultNote title="Medicine guidance" text={result.medicineGuidance} />}
            {result.disclaimer && <p className="rounded-lg bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-500">{result.disclaimer}</p>}
          </motion.div>
        ) : (
          <p className="mt-5 text-sm leading-6 text-slate-600">Complete the grouped assessment and run a prediction. Results are saved to Firestore for your history after the API responds.</p>
        )}
      </Card>
    </div>
  );
}

function ResultList({ title, items, tone }: { title: string; items: string[]; tone: "slate" | "blue" | "amber" }) {
  if (items.length === 0) return null;
  const toneClass = tone === "blue" ? "bg-blue-50 text-blue-950" : tone === "amber" ? "bg-amber-50 text-amber-950" : "bg-slate-50 text-slate-700";
  return (
    <div>
      <p className="text-sm font-bold text-slate-700">{title}</p>
      <ul className="mt-2 space-y-2 text-sm">
        {items.map((item) => <li key={item} className={`rounded-lg p-3 ${toneClass}`}>{item}</li>)}
      </ul>
    </div>
  );
}

function ResultNote({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white/80 p-3 text-sm text-slate-700">
      <p className="font-bold">{title}</p>
      <p className="mt-1 leading-6">{text}</p>
    </div>
  );
}
