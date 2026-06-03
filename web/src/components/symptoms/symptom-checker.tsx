"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { percent } from "@/lib/utils";
import { HoloPanel, MetricRing, PulseLine, ScannerLoader, SignalBadge } from "@/components/ui/premium";
import { AirVent, BrainCircuit, ClipboardList, HeartPulse, Loader2, MapPin, MessageCircle, ShieldAlert, ShieldCheck, Sparkles, Stethoscope, Thermometer, TestTube2 } from "lucide-react";

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
    title: "Fever symptoms",
    description: "Temperature patterns, chills and early infection signals.",
    icon: Thermometer,
    items: ["fever", "chills", "sweating", "headache", "body ache", "muscle pain", "joint pain"]
  },
  {
    title: "Body symptoms",
    description: "Core pain, fatigue and systemic sensations.",
    icon: HeartPulse,
    items: ["weakness", "fatigue", "appetite loss", "dizziness", "nausea", "vomiting"]
  },
  {
    title: "Digestive symptoms",
    description: "Gut signs that help separate infections and dehydration.",
    icon: ClipboardList,
    items: ["diarrhea", "abdominal pain", "constipation", "stomach cramps", "nausea", "vomiting"]
  },
  {
    title: "Respiratory symptoms",
    description: "Breathing and throat signals for respiratory assessment.",
    icon: AirVent,
    items: ["cough", "sore throat", "runny nose", "breathing difficulty", "chest tightness"]
  },
  {
    title: "Dengue warning signs",
    description: "Urgent signs for dengue and severe illness.",
    icon: ShieldAlert,
    items: ["rash", "eye pain", "bleeding gums", "nose bleeding", "low platelets", "low WBC", "mosquito exposure", "recent mosquito bite", "repeated fever cycles"]
  }
];

const exposureGroups = [
  {
    title: "Travel and exposure",
    description: "Recent travel, sick contacts or contaminated food/water.",
    icon: MapPin,
    items: ["recent travel", "travel to malaria area", "contaminated food/water exposure", "contact with sick person"]
  },
  {
    title: "Risk factors",
    description: "Patient risk details that affect treatment and referral.",
    icon: ShieldCheck,
    items: ["existing medical condition", "pregnancy", "child/elderly patient", "low immunity"]
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
    const fever = [`${clinicalInputs.feverLevel} fever`, clinicalInputs.temperature && `temperature ${clinicalInputs.temperature}`, clinicalInputs.feverDuration && `duration ${clinicalInputs.feverDuration}`, `${clinicalInputs.feverPattern} pattern`].filter(Boolean) as string[];
    return [...new Set([...fever, ...selected])];
  }, [clinicalInputs, selected]);

  const progress = Math.round(((step + 1) / 4) * 100);
  const canPredict = selected.length > 0 || Boolean(clinicalInputs.temperature || clinicalInputs.feverDuration);

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

  function savePredictionState(prediction: SymptomResult) {
    if (typeof window === "undefined") return null;
    const disease = prediction.predictedDisease ?? prediction.prediction ?? "Unknown";
    const confidence = prediction.confidence > 1 ? Math.round(prediction.confidence) : Math.round(prediction.confidence * 100);
    const payload = {
      disease,
      confidence,
      riskLevel: prediction.riskLevel,
      symptoms: selectedSummary,
      timestamp: new Date().toISOString()
    };
    window.localStorage.setItem("latestPrediction", JSON.stringify(payload));
    return payload;
  }

  async function analyze() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await apiPost<Response>("/symptoms", { symptoms: selectedSummary, clinicalInputs });
      setResult(response.result);
      savePredictionState(response.result);
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

  const displayDisease = result?.predictedDisease ?? result?.prediction ?? "Unknown";
  const confidenceValue = result ? (result.confidence > 1 ? Math.round(result.confidence) : Math.round(result.confidence * 100)) : 0;
  const riskLevel = result?.riskLevel ?? "Moderate";

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.44fr]">
      <div className="space-y-5">
        <HoloPanel>
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <SignalBadge icon="pulse">Symptom wizard</SignalBadge>
              <h2 className="mt-4 font-arcadiaDisplay text-heading font-light text-starlight">Symptom check made simple</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-silver">A step-by-step symptom flow for clear input, accurate prediction, and doctor consultation.</p>
            </div>
            <MetricRing value={progress} label="Progress" />
          </div>
          <div className="mt-5 rounded-full bg-lead/10 p-1">
            <div className="h-2 rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {[
              { label: "Fever" },
              { label: "Symptoms" },
              { label: "Exposure" },
              { label: "Review" }
            ].map((item, index) => (
              <div key={item.label} className={`rounded-3xl border px-4 py-3 text-center text-sm ${step === index ? "border-primary/40 bg-primary/10 text-pure-white" : "border-lead/20 bg-graphite/60 text-silver"}`}>
                {item.label}
              </div>
            ))}
          </div>
        </HoloPanel>

        <HoloPanel>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-arcadiaDisplay text-heading-sm font-light text-starlight">Step {step + 1} of 4</h3>
              <p className="mt-1 text-sm text-silver">
                {step === 0 && "Start with fever details."}
                {step === 1 && "Choose options from symptom groups."}
                {step === 2 && "Add exposure and risk factors."}
                {step === 3 && "Review and run the prediction."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={reset} disabled={loading || textLoading}>Clear all</Button>
              <Button variant="ghost" size="sm" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>Back</Button>
              <Button variant="secondary" size="sm" onClick={() => setStep((current) => Math.min(3, current + 1))} disabled={step === 3}>Next</Button>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {step === 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="rounded-[32px] border border-lead/20 bg-midnight-slate/80 p-5">
                  <h4 className="text-sm font-medium text-starlight">Fever intensity</h4>
                  <p className="mt-2 text-sm text-silver">How strong is the fever?</p>
                  <select className="premium-input mt-4 w-full" value={clinicalInputs.feverLevel} onChange={(e) => setClinicalInputs((current) => ({ ...current, feverLevel: e.target.value }))}>
                    {feverLevels.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </Card>
                <Card className="rounded-[32px] border border-lead/20 bg-midnight-slate/80 p-5">
                  <h4 className="text-sm font-medium text-starlight">Fever pattern</h4>
                  <p className="mt-2 text-sm text-silver">Continuous, intermittent or night fever?</p>
                  <select className="premium-input mt-4 w-full" value={clinicalInputs.feverPattern} onChange={(e) => setClinicalInputs((current) => ({ ...current, feverPattern: e.target.value }))}>
                    {feverPatterns.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </Card>
                <Card className="rounded-[32px] border border-lead/20 bg-midnight-slate/80 p-5">
                  <h4 className="text-sm font-medium text-starlight">Temperature</h4>
                  <p className="mt-2 text-sm text-silver">Optional: add the number if available.</p>
                  <input className="premium-input mt-4 w-full" placeholder="102 F or 38.9 C" value={clinicalInputs.temperature} onChange={(e) => setClinicalInputs((current) => ({ ...current, temperature: e.target.value }))} />
                </Card>
                <Card className="rounded-[32px] border border-lead/20 bg-midnight-slate/80 p-5">
                  <h4 className="text-sm font-medium text-starlight">Duration</h4>
                  <p className="mt-2 text-sm text-silver">How long has the fever lasted?</p>
                  <input className="premium-input mt-4 w-full" placeholder="3 days" value={clinicalInputs.feverDuration} onChange={(e) => setClinicalInputs((current) => ({ ...current, feverDuration: e.target.value }))} />
                </Card>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                {symptomGroups.map((group) => (
                  <Card key={group.title} className="rounded-[32px] border border-lead/20 bg-midnight-slate/80 p-5">
                    <div className="flex items-center gap-3">
                      <group.icon className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="text-sm font-medium text-starlight">{group.title}</h4>
                        <p className="text-sm text-silver">{group.description}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {group.items.map((symptom) => {
                        const active = selected.includes(symptom);
                        return (
                          <button
                            key={symptom}
                            type="button"
                            onClick={() => toggle(symptom)}
                            className={`rounded-[32px] border px-4 py-4 text-left text-sm font-medium transition ${active ? "border-primary bg-primary/20 text-pure-white" : "border-lead/30 bg-graphite/50 text-silver hover:border-primary/40 hover:bg-ghost-blue/10 hover:text-starlight"}`}
                          >
                            {symptom}
                          </button>
                        );
                      })}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                {exposureGroups.map((group) => (
                  <Card key={group.title} className="rounded-[32px] border border-lead/20 bg-midnight-slate/80 p-5">
                    <div className="flex items-center gap-3">
                      <group.icon className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="text-sm font-medium text-starlight">{group.title}</h4>
                        <p className="text-sm text-silver">{group.description}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {group.items.map((symptom) => {
                        const active = selected.includes(symptom);
                        return (
                          <button
                            key={symptom}
                            type="button"
                            onClick={() => toggle(symptom)}
                            className={`rounded-[32px] border px-4 py-4 text-left text-sm font-medium transition ${active ? "border-primary bg-primary/20 text-pure-white" : "border-lead/30 bg-graphite/50 text-silver hover:border-primary/40 hover:bg-ghost-blue/10 hover:text-starlight"}`}
                          >
                            {symptom}
                          </button>
                        );
                      })}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <Card className="rounded-[32px] border border-lead/20 bg-midnight-slate/80 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-medium text-starlight">Review selection</h4>
                      <p className="mt-1 text-sm text-silver">Confirm your input before prediction.</p>
                    </div>
                    <div className="rounded-full border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">{selectedSummary.length} items</div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedSummary.map((item) => (
                      <span key={item} className="rounded-full border border-lead/30 bg-graphite/50 px-3 py-2 text-sm text-silver">{item}</span>
                    ))}
                  </div>
                </Card>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button size="lg" onClick={analyze} disabled={!canPredict || loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Predict disease
                  </Button>
                  <Button variant="secondary" size="lg" onClick={() => setStep(0)}>
                    Edit inputs
                  </Button>
                </div>
                <p className="text-sm text-silver">You can also enter a text summary below if needed.</p>
              </div>
            )}
          </div>
        </HoloPanel>

        <HoloPanel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-arcadiaDisplay text-heading-sm font-light text-starlight">Quick summary</h3>
              <p className="mt-1 text-sm text-silver">Selected symptoms and current wizard progress.</p>
            </div>
            <span className="rounded-full border border-lead/30 bg-graphite/70 px-3 py-1 text-xs uppercase tracking-[0.18em] text-silver">{selected.length} symptoms</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Card className="rounded-[32px] border border-lead/20 bg-midnight-slate/80 p-4">
              <p className="text-sm text-silver">Ready to predict</p>
              <p className="mt-3 text-2xl font-semibold text-pure-white">{canPredict ? "Yes" : "Choose more symptoms"}</p>
            </Card>
            <Card className="rounded-[32px] border border-lead/20 bg-midnight-slate/80 p-4">
              <p className="text-sm text-silver">Current step</p>
              <p className="mt-3 text-2xl font-semibold text-pure-white">{step + 1}</p>
            </Card>
          </div>
        </HoloPanel>

        <HoloPanel>
          <h3 className="font-arcadiaDisplay text-heading-sm font-light text-starlight">Natural language capture</h3>
          <p className="mt-1 text-sm text-silver">Optional: describe symptoms in your own words.</p>
          <textarea
            className="premium-input mt-4 min-h-[160px] rounded-[32px] py-4"
            placeholder="I have had a high fever at night with headache, nausea, and body pain for two days."
            value={textSymptoms}
            onChange={(event) => setTextSymptoms(event.target.value)}
          />
          <Button className="mt-4" variant="secondary" onClick={analyzeText} disabled={!textSymptoms.trim() || textLoading}>
            {textLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
            Analyze text symptoms
          </Button>
          {textResult && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-[32px] border border-lead/20 bg-graphite/60 p-4 text-sm text-silver">
              <p className="font-medium text-starlight">{textResult.predictedDisease} — {percent(textResult.confidence)}</p>
              <p className="mt-2 leading-6">{textResult.explanation}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-silver">{textResult.suggestedNextStep}</p>
            </motion.div>
          )}
        </HoloPanel>
      </div>

      <div className="space-y-5">
        <HoloPanel className="sticky top-6">
          <div className="flex items-center gap-3">
            <Stethoscope className="h-6 w-6 text-starlight" />
            <div>
              <h2 className="font-arcadiaDisplay text-heading-sm font-light text-starlight">Prediction result</h2>
              <p className="mt-1 text-sm text-silver">Clear next steps and doctor consultation after the scan.</p>
            </div>
          </div>

          {result ? (
            <motion.div initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="mt-5 space-y-5">
              <div className="rounded-[32px] border border-primary/30 bg-primary/10 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-silver">Predicted disease</p>
                    <p className="mt-2 text-2xl font-semibold text-pure-white">{displayDisease}</p>
                  </div>
                  <div className="rounded-[32px] bg-graphite/70 px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.18em] text-silver">Confidence</p>
                    <p className="mt-1 text-3xl font-semibold text-pure-white">{confidenceValue}%</p>
                  </div>
                </div>
                <p className="mt-4 text-sm uppercase tracking-[0.18em] text-silver">Risk level: {riskLevel}</p>
              </div>

              <div className="grid gap-4">
                <ResultList title="Possible diseases" items={(result.possibleDiseases ?? []).map((item) => `${item.disease} — ${percent(item.confidence)}`)} icon={BrainCircuit} />
                <ResultList title="Recommended tests" items={result.recommendedTests ?? ["CBC, platelet count, malaria smear, dengue NS1"]} icon={ClipboardList} />
                <ResultList title="Basic precautions" items={result.precautions ?? result.recommendations ?? ["Hydrate frequently", "Rest in a cool place", "Avoid self-medication"]} icon={ShieldCheck} />
                <ResultNote title="Emergency warning" text="If you experience severe headache, bleeding, chest pain, breathing difficulty, confusion, or persistent vomiting, seek emergency care immediately." />
              </div>

              <div className="grid gap-3">
                <Button size="lg" onClick={() => {
                  const payload = savePredictionState(result);
                  const query = `?disease=${encodeURIComponent(payload?.disease ?? displayDisease)}&confidence=${encodeURIComponent(payload?.confidence ?? confidenceValue)}`;
                  window.location.href = `/doctors${query}`;
                }}>
                  Consult with Doctor
                </Button>
                <div className="rounded-[32px] border border-lead/20 bg-graphite/60 p-4 text-sm leading-6 text-silver">
                  MEDISENSE provides AI-based preliminary guidance only and does not replace professional medical diagnosis.
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="mt-5 rounded-[32px] border border-dashed border-lead/30 bg-graphite/60 p-5 text-sm text-silver">
              Complete the wizard and tap Predict disease to see a premium result card with consultation options.
            </div>
          )}
        </HoloPanel>

        {result && (
          <HoloPanel>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-arcadiaDisplay text-heading-sm font-light text-starlight">Recommended action</h3>
                <p className="mt-1 text-sm text-silver">Move from prediction to the right doctor care direction.</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => {
                const payload = savePredictionState(result);
                const query = `?disease=${encodeURIComponent(payload?.disease ?? displayDisease)}&confidence=${encodeURIComponent(payload?.confidence ?? confidenceValue)}`;
                window.location.href = `/doctors${query}`;
              }}>
                Consult with Doctor
              </Button>
            </div>
            <div className="rounded-[32px] border border-lead/20 bg-midnight-slate/80 p-4 text-sm leading-6 text-silver">
              <p className="font-medium text-starlight">Your result is ready.</p>
              <p className="mt-2">A doctor can review your predicted disease and confidence, then recommend the right tests and care path.</p>
            </div>
          </HoloPanel>
        )}
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
        {items.map((item) => <li key={item} className="rounded-[24px] border border-lead/20 bg-graphite/60 px-4 py-3 text-silver">{item}</li>)}
      </ul>
    </div>
  );
}

function ResultNote({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[32px] border border-lead/20 bg-graphite/60 p-4 text-sm text-silver">
      <p className="font-medium text-starlight">{title}</p>
      <p className="mt-2 leading-6">{text}</p>
    </div>
  );
}
