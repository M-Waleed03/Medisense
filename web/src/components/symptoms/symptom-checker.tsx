"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, BrainCircuit, ClipboardList, Loader2, RefreshCw, ShieldAlert, Sparkles, Stethoscope, TestTube2 } from "lucide-react";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { percent } from "@/lib/utils";
import { HoloPanel, MetricRing, PulseLine, ScannerLoader, SignalBadge } from "@/components/ui/premium";

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
    title: "Core symptoms",
    description: "General and respiratory signals that shape the first model pass.",
    icon: Activity,
    items: ["headache", "body pain", "weakness", "fatigue", "chills", "sweating", "joint pain", "muscle pain", "appetite loss", "cough", "sore throat", "runny nose", "breathing difficulty"]
  },
  {
    title: "Digestive path",
    description: "Gut symptoms help separate typhoid, dehydration, viral illness, and escalation signals.",
    icon: ClipboardList,
    items: ["nausea", "vomiting", "diarrhea", "abdominal pain", "constipation", "stomach cramps", "contaminated food/water exposure", "persistent fever"]
  },
  {
    title: "Vector-borne indicators",
    description: "Dengue and malaria clues trigger platelet, smear, and urgent-care guidance.",
    icon: ShieldAlert,
    items: ["rash", "eye pain", "bleeding gums", "nose bleeding", "low platelets if known", "mosquito exposure", "chills with sweating", "recent mosquito bite", "travel to malaria area", "repeated fever cycles"]
  },
  {
    title: "Risk modifiers",
    description: "These do not diagnose disease, but they influence safety guidance.",
    icon: BrainCircuit,
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
  const [step, setStep] = useState(0);

  const selectedSummary = useMemo(() => {
    const fever = [`${clinicalInputs.feverLevel} fever`, clinicalInputs.temperature && `temperature ${clinicalInputs.temperature}`, clinicalInputs.feverDuration && `duration ${clinicalInputs.feverDuration}`, `${clinicalInputs.feverPattern} pattern`].filter(Boolean);
    return [...fever, ...selected];
  }, [clinicalInputs, selected]);

  const completedSections = [
    clinicalInputs.feverLevel || clinicalInputs.temperature || clinicalInputs.feverDuration || clinicalInputs.feverPattern,
    selected.some((item) => symptomGroups[0].items.includes(item)),
    selected.some((item) => symptomGroups[1].items.includes(item) || symptomGroups[2].items.includes(item)),
    selected.some((item) => symptomGroups[3].items.includes(item))
  ].filter(Boolean).length;
  const canPredict = selected.length > 0 || Boolean(clinicalInputs.temperature || clinicalInputs.feverDuration);
  const activeGroup = symptomGroups[Math.min(step, symptomGroups.length - 1)];

  function toggle(symptom: string) {
    setSelected((current) => (current.includes(symptom) ? current.filter((item) => item !== symptom) : [...current, symptom]));
  }

  function reset() {
    setSelected([]);
    setResult(null);
    setTextResult(null);
    setTextSymptoms("");
    setError("");
    setStep(0);
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

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.42fr]">
      <div className="space-y-5">
        <HoloPanel className="overflow-hidden p-0">
          <div className="grid gap-5 border-b border-lead/30 bg-graphite/30 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <SignalBadge icon="pulse">Clinical intake wizard</SignalBadge>
              <h2 className="mt-4 font-arcadiaDisplay text-heading font-light text-starlight">AI-guided symptom scanner</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-silver">A cinematic triage flow that combines fever pattern, body signals, exposure history, and risk modifiers before prediction.</p>
            </div>
            <MetricRing value={completedSections * 25} label="Completion" />
          </div>
          <div className="grid gap-5 p-5 lg:grid-cols-[0.72fr_1fr]">
            <BodyScan selectedCount={selected.length} step={step} />
            <div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Fever level">
                  <select className="premium-input" value={clinicalInputs.feverLevel} onChange={(e) => setClinicalInputs((current) => ({ ...current, feverLevel: e.target.value }))}>
                    {feverLevels.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </Field>
                <Field label="Fever pattern">
                  <select className="premium-input" value={clinicalInputs.feverPattern} onChange={(e) => setClinicalInputs((current) => ({ ...current, feverPattern: e.target.value }))}>
                    {feverPatterns.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Temperature">
                  <input className="premium-input" placeholder="102 F or 38.9 C" value={clinicalInputs.temperature} onChange={(e) => setClinicalInputs((current) => ({ ...current, temperature: e.target.value }))} />
                </Field>
                <Field label="Duration">
                  <input className="premium-input" placeholder="3 days" value={clinicalInputs.feverDuration} onChange={(e) => setClinicalInputs((current) => ({ ...current, feverDuration: e.target.value }))} />
                </Field>
              </div>
            </div>
          </div>
        </HoloPanel>

        <HoloPanel>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {symptomGroups.map((group, index) => (
              <button
                key={group.title}
                type="button"
                onClick={() => setStep(index)}
                className={`rounded-pill border px-4 py-2 text-sm font-medium transition ${step === index ? "border-ghost-blue/20 bg-ghost-blue/12 text-starlight" : "border-lead/40 bg-transparent text-silver hover:bg-ghost-blue/10 hover:text-starlight"}`}
              >
                {index + 1}. {group.title}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeGroup.title}
              initial={{ opacity: 0, x: 24, filter: "blur(8px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -24, filter: "blur(8px)" }}
              transition={{ duration: 0.32 }}
            >
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[4px] border border-ghost-blue/15 bg-graphite text-starlight">
                  <activeGroup.icon className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-arcadiaDisplay text-heading-sm font-light text-starlight">{activeGroup.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-silver">{activeGroup.description}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {activeGroup.items.map((symptom) => {
                  const active = selected.includes(symptom);
                  return (
                    <motion.button
                      key={symptom}
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => toggle(symptom)}
                      className={`rounded-pill border px-3 py-2 text-sm font-medium transition ${active ? "border-primary/50 bg-primary text-pure-white" : "border-lead/40 bg-graphite/35 text-silver hover:border-ghost-blue/35 hover:bg-ghost-blue/10 hover:text-starlight"}`}
                    >
                      {active ? "Active: " : ""}{symptom}
                    </motion.button>
                  );
                })}
              </div>
              <div className="mt-6 flex justify-between gap-3">
                <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>Back</Button>
                <Button type="button" onClick={() => setStep((current) => Math.min(symptomGroups.length - 1, current + 1))}>Next layer <Sparkles className="h-4 w-4" /></Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </HoloPanel>

        <HoloPanel>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-arcadiaDisplay text-heading-sm font-light text-starlight">Selected clinical signal</h3>
              <p className="mt-1 text-sm text-silver">Review the payload before MEDISENSE starts the scan.</p>
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
            {selectedSummary.map((item) => <span key={item} className="rounded-pill border border-lead/40 bg-graphite/40 px-3 py-2 text-sm font-medium text-silver">{item}</span>)}
          </div>
          {loading && <div className="mt-5"><ScannerLoader label="Scanning symptom constellation" /></div>}
          {error && <p className="mt-4 border border-lead/40 bg-graphite/70 p-3 text-sm font-medium text-starlight">{error}</p>}
        </HoloPanel>

        <HoloPanel>
          <h3 className="font-arcadiaDisplay text-heading-sm font-light text-starlight">Natural language symptom capture</h3>
          <p className="mt-1 text-sm text-silver">Use this when a checklist cannot capture the full story.</p>
          <textarea
            className="premium-input mt-4 min-h-32 rounded-[32px] py-3"
            placeholder="I have high fever at night, chills, sweating, headache, and weakness for three days."
            value={textSymptoms}
            onChange={(event) => setTextSymptoms(event.target.value)}
          />
          <Button className="mt-3" variant="secondary" onClick={analyzeText} disabled={!textSymptoms.trim() || textLoading}>
            {textLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Analyze text symptoms
          </Button>
          {textResult && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4 border border-lead/40 bg-graphite/50 p-4 text-sm text-starlight">
              <p className="font-medium">{textResult.predictedDisease} - {percent(textResult.confidence)}</p>
              <p className="mt-2 leading-6">{textResult.explanation}</p>
              <p className="mt-2 font-bold">{textResult.suggestedNextStep}</p>
            </motion.div>
          )}
        </HoloPanel>
      </div>

      <HoloPanel className="h-fit xl:sticky xl:top-6">
        <div className="flex items-center gap-3">
          <Stethoscope className="h-6 w-6 text-starlight" />
          <h2 className="font-arcadiaDisplay text-heading-sm font-light text-starlight">Cinematic result reveal</h2>
        </div>
        {result ? (
          <motion.div initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="mt-5 space-y-5">
            <MetricRing value={Math.round((result.confidence <= 1 ? result.confidence * 100 : result.confidence))} label="Confidence" />
            <div>
              <p className="text-sm font-medium text-silver">Predicted disease</p>
              <p className="mt-1 font-arcadiaDisplay text-heading font-light text-starlight">{result.predictedDisease ?? result.prediction}</p>
              <p className="mt-2 text-sm font-medium uppercase tracking-[0.14em] text-silver">{result.riskLevel} risk</p>
            </div>
            <PulseLine />
            <ResultList title="Possible diseases" items={(result.possibleDiseases ?? []).map((item) => `${item.disease} - ${percent(item.confidence)}`)} icon={BrainCircuit} />
            <ResultList title="Recommended tests" items={result.recommendedTests ?? []} icon={TestTube2} />
            <ResultList title="Precautions" items={result.precautions ?? result.recommendations ?? []} icon={ShieldAlert} />
            {result.doctorAdvice && <ResultNote title="Doctor advice" text={result.doctorAdvice} />}
            {result.medicineGuidance && <ResultNote title="Medicine guidance" text={result.medicineGuidance} />}
            {result.disclaimer && <p className="bg-graphite/45 p-3 text-xs font-medium leading-5 text-silver">{result.disclaimer}</p>}
          </motion.div>
        ) : (
          <div className="mt-5 border border-dashed border-lead/45 bg-graphite/35 p-5 text-sm leading-6 text-silver">
            Complete the wizard and run a prediction. Results are saved to Firestore for your synchronized history after the API responds.
          </div>
        )}
      </HoloPanel>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-silver">
      {label}
      {children}
    </label>
  );
}

function BodyScan({ selectedCount, step }: { selectedCount: number; step: number }) {
  const y = [35, 62, 48, 76][step] ?? 44;
  return (
    <div className="relative min-h-72 overflow-hidden rounded-none border border-lead/35 bg-deep-space/70 p-5">
      <div className="absolute inset-0 mesh opacity-50" />
      <div className="relative mx-auto grid h-64 max-w-56 place-items-center">
        <svg viewBox="0 0 160 260" className="h-full w-full text-ghost-blue/70" aria-hidden="true">
          <circle cx="80" cy="35" r="24" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="2" />
          <path d="M80 62 C55 62 44 80 44 112 V165 C44 190 58 214 80 228 C102 214 116 190 116 165 V112 C116 80 105 62 80 62Z" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="2" />
          <path d="M45 112 C20 128 16 154 28 184 M115 112 C140 128 144 154 132 184 M62 224 L48 256 M98 224 L112 256" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="28" x2="132" y1={y} y2={y} stroke="#5266eb" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
        </svg>
        <div className="absolute bottom-4 left-4 right-4 border border-lead/35 bg-midnight-slate/80 p-3 text-center backdrop-blur-xl">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-silver">Signals selected</p>
          <p className="mt-1 font-arcadiaDisplay text-heading-sm font-light text-starlight">{selectedCount}</p>
        </div>
      </div>
    </div>
  );
}

function ResultList({ title, items, icon: Icon }: { title: string; items: string[]; icon: typeof BrainCircuit }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="flex items-center gap-2 text-sm font-medium text-starlight"><Icon className="h-4 w-4 text-starlight" />{title}</p>
      <ul className="mt-2 space-y-2 text-sm">
        {items.map((item) => <li key={item} className="border border-lead/35 bg-graphite/45 p-3 text-silver">{item}</li>)}
      </ul>
    </div>
  );
}

function ResultNote({ title, text }: { title: string; text: string }) {
  return (
    <div className="border border-lead/35 bg-graphite/45 p-3 text-sm text-silver">
      <p className="font-medium text-starlight">{title}</p>
      <p className="mt-1 leading-6">{text}</p>
    </div>
  );
}
