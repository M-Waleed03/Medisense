from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, List, Literal, Optional, Tuple
import io
import json
import logging
import os
import pickle
import re
import shutil
import urllib.request
import urllib.parse
import warnings
from pathlib import Path

import numpy as np
import pytesseract
from PIL import Image
from dotenv import load_dotenv

try:
    import cv2
except Exception:  # pragma: no cover
    cv2 = None

try:
    import pypdfium2 as pdfium
except Exception:  # pragma: no cover
    pdfium = None

try:
    import joblib
except Exception:  # pragma: no cover
    joblib = None

try:
    from sklearn.exceptions import InconsistentVersionWarning

    warnings.filterwarnings("ignore", category=InconsistentVersionWarning)
except Exception:  # pragma: no cover
    pass

from utils import build_report_flags, get_health_recommendation, parse_medical_report
from local_chatbot import build_local_chatbot_reply

logger = logging.getLogger("medisense.ai")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))

ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = ROOT.parent
MODEL_DIR = ROOT / "models"
DISCLAIMER = "This is AI-based pre-diagnosis support and not a replacement for professional medical advice."

for env_file in (PROJECT_ROOT / ".env.local", PROJECT_ROOT / "backend" / ".env", ROOT / ".env"):
    load_dotenv(env_file)


def configure_tesseract():
    configured = os.getenv("TESSERACT_CMD")
    candidates = [
        configured,
        shutil.which("tesseract"),
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        str(Path.home() / "AppData" / "Local" / "Programs" / "Tesseract-OCR" / "tesseract.exe"),
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            pytesseract.pytesseract.tesseract_cmd = candidate
            return candidate
    return None


TESSERACT_CMD = configure_tesseract()

app = FastAPI(title="MEDISENSE AI Service", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5000,http://127.0.0.1:5000,"
        "http://localhost:8080,http://127.0.0.1:8080,http://localhost:8081,http://127.0.0.1:8081,"
        "http://localhost:8082,http://127.0.0.1:8082,http://localhost:8083,http://127.0.0.1:8083,"
        "http://localhost:8084,http://127.0.0.1:8084,http://localhost:8085,http://127.0.0.1:8085"
    ).split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SymptomPayload(BaseModel):
    symptoms: List[str] = []
    clinicalInputs: Dict[str, Any] = {}


class TextSymptomPayload(BaseModel):
    text: str


class ReportValuesPayload(BaseModel):
    values: Dict[str, Any]
    symptoms: List[str] = []


class OcrUrlPayload(BaseModel):
    fileUrl: str
    fileType: Optional[str] = None
    fileName: Optional[str] = None


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatPayload(BaseModel):
    message: str
    userId: Optional[str] = None
    context: Dict[str, Any] = {}
    history: List[ChatTurn] = []
    healthContext: Dict[str, Any] = {}


def load_artifact(name: str):
    path = MODEL_DIR / name
    if not path.exists():
        return None
    try:
        if joblib is not None:
            return joblib.load(path)
        with path.open("rb") as handle:
            return pickle.load(handle)
    except Exception as exc:
        logger.warning("Unable to load %s: %s", path, exc)
        return None


symptom_columns = load_artifact("symptom_columns.pkl") or []
disease_model = load_artifact("disease_model.pkl")
disease_label_encoder = load_artifact("disease_label_encoder.pkl")
curated_symptom_model = load_artifact("symptom_model.joblib")
symptom_text_model = load_artifact("symptom_text_model.pkl")
tfidf_vectorizer = load_artifact("tfidf_vectorizer.pkl")
text_label_encoder = load_artifact("text_label_encoder.pkl")
dengue_report_model = load_artifact("dengue_report_model.pkl")
report_columns = load_artifact("report_columns.pkl") or []
report_label_encoder = load_artifact("report_label_encoder.pkl")


RECOMMENDED_TESTS = {
    "Dengue": ["CBC with platelet trend", "Dengue NS1 antigen if early illness", "Dengue IgM/IgG as clinically timed"],
    "Malaria": ["Rapid malaria antigen test", "Peripheral blood smear", "CBC for anemia and platelet count"],
    "Typhoid": ["Blood culture before antibiotics when possible", "CBC", "Clinician-directed typhoid serology where appropriate"],
    "Viral Fever": ["CBC if fever persists", "COVID/flu testing when respiratory symptoms are present", "Clinical review if fever lasts over 3 days"],
    "Flu": ["Influenza test when available", "COVID test if exposure or respiratory symptoms overlap", "Pulse oximetry for breathing symptoms"],
}

PRECAUTIONS = {
    "Dengue": ["Hydrate well and avoid aspirin/ibuprofen unless a clinician approves.", "Use mosquito protection.", "Seek urgent care for bleeding, severe abdominal pain, persistent vomiting, drowsiness, or very low urine output."],
    "Malaria": ["Arrange confirmatory malaria testing promptly.", "Track fever cycles, chills, hydration, and weakness.", "Seek urgent care for confusion, jaundice, severe weakness, or breathing difficulty."],
    "Typhoid": ["Use safe water and hand hygiene.", "Maintain fluids and light meals.", "Seek care for persistent fever, dehydration, severe abdominal pain, or blood in stool."],
    "Viral Fever": ["Rest and hydrate.", "Monitor temperature and warning signs.", "Consult a doctor if fever lasts longer than three days or symptoms escalate."],
    "Flu": ["Limit close contact while febrile.", "Mask around vulnerable people.", "Seek care for breathing difficulty, chest pain, dehydration, pregnancy, older age, or chronic disease."],
    "Needs clinical review": ["Symptoms do not strongly match one configured condition.", "Track fever, hydration, and warning signs.", "Consult a licensed clinician for formal diagnosis."],
}

SYMPTOM_ALIASES = {
    "body ache": "body ache",
    "body pain": "body pain",
    "muscle ache": "muscle pain",
    "muscle aches": "muscle aches",
    "joint aches": "joint pain",
    "loss of appetite": "loss of appetite",
    "appetite loss": "loss of appetite",
    "stomach cramps": "stomach pain",
    "stomach ache": "stomach pain",
    "abdominal discomfort": "abdominal discomfort",
    "eye pain": "eye pain",
    "pain behind eyes": "eye pain",
    "bleeding gums": "bleeding gums",
    "nose bleeding": "nose bleeding",
    "low platelet": "low platelets",
    "low platelets": "low platelets",
    "low platelet count": "low platelets",
    "low platelets if known": "low platelets",
    "low wbc": "low wbc",
    "low white blood cells": "low wbc",
    "recent mosquito bite": "mosquito exposure",
    "mosquito bite": "mosquito exposure",
    "mosquito exposure": "mosquito exposure",
    "travel to malaria area": "travel history",
    "recent travel": "travel history",
    "contaminated food water exposure": "contaminated food water exposure",
    "contaminated food or water exposure": "contaminated food water exposure",
    "contact with sick person": "exposure",
    "repeated fever cycles": "periodic fever",
    "intermittent fever": "periodic fever",
    "night fever": "fever",
    "evening fever": "fever",
    "continuous fever": "fever",
    "very high fever": "high fever",
    "moderate fever": "fever",
    "low fever": "low grade fever",
}


def symptom_debug(label: str, payload: Any):
    try:
        message = f"[symptom-debug] {label}: {json.dumps(payload, default=str)}"
    except Exception:
        message = f"[symptom-debug] {label}: {payload}"
    logger.info(message)
    print(message, flush=True)


def clean_symptom_text(value: Any) -> str:
    text = str(value).strip().lower()
    text = text.replace("&", " and ").replace("/", " or ")
    text = re.sub(r"([a-z])([A-Z])", r"\1 \2", text)
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def expand_symptom_phrase(value: Any) -> List[str]:
    cleaned = clean_symptom_text(value)
    if not cleaned:
        return []

    if cleaned.startswith("feverlevel "):
        level = cleaned.replace("feverlevel ", "", 1).strip()
        cleaned = f"{level} fever"
    elif cleaned.startswith("fever level "):
        level = cleaned.replace("fever level ", "", 1).strip()
        cleaned = f"{level} fever"
    elif cleaned.startswith("feverpattern "):
        pattern = cleaned.replace("feverpattern ", "", 1).strip()
        cleaned = f"{pattern} fever"
    elif cleaned.startswith("fever pattern "):
        pattern = cleaned.replace("fever pattern ", "", 1).strip()
        cleaned = f"{pattern} fever"
    elif cleaned.startswith("feverduration "):
        cleaned = "fever"
    elif cleaned.startswith("fever duration "):
        cleaned = "fever"
    elif cleaned.startswith("temperature "):
        cleaned = "fever"

    mapped = SYMPTOM_ALIASES.get(cleaned, cleaned)
    expanded = [mapped]
    if "fever" in mapped and mapped != "fever":
        expanded.append("fever")
    if mapped in {"rash", "bleeding gums", "nose bleeding", "eye pain", "mosquito exposure"}:
        expanded.append("fever")
    return expanded


def text_pipeline_feature_vector(model: Any, text: str) -> Optional[Dict[str, Any]]:
    named_steps = getattr(model, "named_steps", {})
    vectorizer = named_steps.get("tfidf") if isinstance(named_steps, dict) else None
    if vectorizer is None or not hasattr(vectorizer, "transform"):
        return None

    vector = vectorizer.transform([text])
    names = vectorizer.get_feature_names_out() if hasattr(vectorizer, "get_feature_names_out") else []
    row = vector[0]
    nonzero = []
    for index in row.nonzero()[1]:
        feature = str(names[index]) if len(names) > index else str(index)
        nonzero.append({"feature": feature, "value": round(float(row[0, index]), 6)})
    return {"type": "tfidf", "shape": vector.shape, "nonzero": nonzero}


def column_feature_vector(symptoms: List[str], columns: List[str]) -> Tuple[List[int], Dict[str, int]]:
    text = " ".join(symptoms)
    row = [1 if clean_symptom_text(column) in symptoms or clean_symptom_text(column) in text else 0 for column in columns]
    nonzero = {str(column): row[index] for index, column in enumerate(columns) if row[index]}
    return row, nonzero


def normalize_symptoms(symptoms: List[str], clinical: Optional[Dict[str, Any]] = None) -> List[str]:
    items: List[str] = []
    for symptom in symptoms:
        items.extend(expand_symptom_phrase(symptom))

    clinical = clinical or {}
    fever_level = clinical.get("feverLevel")
    fever_pattern = clinical.get("feverPattern")
    if fever_level and fever_level != "none":
        items.extend(expand_symptom_phrase(f"{fever_level} fever"))
    if fever_pattern:
        items.extend(expand_symptom_phrase(f"{fever_pattern} fever"))
    if clinical.get("temperature") or clinical.get("feverDuration"):
        items.append("fever")
    for key, value in clinical.items():
        if value is True:
            items.extend(expand_symptom_phrase(key))
    return sorted(set(items))


def prediction_from_probabilities(classes, probabilities):
    best_index = int(np.argmax(probabilities))
    prediction = str(classes[best_index])
    confidence = float(probabilities[best_index])
    possible = [
        {"disease": str(classes[index]), "confidence": round(float(score), 3)}
        for index, score in sorted(enumerate(probabilities), key=lambda item: item[1], reverse=True)[:5]
    ]
    return prediction, confidence, possible


def predict_with_models(symptoms: List[str]):
    text = " ".join(symptoms)
    if curated_symptom_model is not None:
        feature_vector = text_pipeline_feature_vector(curated_symptom_model, text)
        symptom_debug("raw feature vector before prediction", feature_vector or {"type": "pipeline_input_text", "text": text})
        probabilities = curated_symptom_model.predict_proba([text])[0]
        symptom_debug("raw model probabilities after prediction", dict(zip(map(str, curated_symptom_model.classes_), map(float, probabilities))))
        return prediction_from_probabilities(curated_symptom_model.classes_, probabilities), "symptom_model.joblib"

    if disease_model is not None and symptom_columns:
        row, nonzero = column_feature_vector(symptoms, symptom_columns)
        symptom_debug("raw feature vector before prediction", {"type": "column_vector", "length": len(row), "row": row, "nonzero": nonzero})
        probabilities = disease_model.predict_proba([row])[0]
        classes = disease_model.classes_
        if disease_label_encoder is not None and hasattr(disease_label_encoder, "inverse_transform"):
            try:
                classes = disease_label_encoder.inverse_transform(classes)
            except Exception:
                pass
        symptom_debug("raw model probabilities after prediction", dict(zip(map(str, classes), map(float, probabilities))))
        return prediction_from_probabilities(classes, probabilities), "disease_model.pkl"

    return (fallback_symptom_prediction(symptoms), 0, []), "medical fallback rules"


def fallback_symptom_prediction(symptoms: List[str]):
    text = " ".join(symptoms)
    if "fever" in text and ("platelet" in text or "mosquito" in text or "rash" in text or "bleeding" in text):
        return "Dengue"
    if "fever" in text and ("chills" in text or "sweating" in text):
        return "Malaria"
    if "fever" in text and ("abdominal" in text or "diarrhea" in text or "contaminated" in text):
        return "Typhoid"
    if "cough" in text or "sore throat" in text or "runny nose" in text:
        return "Flu"
    if "fever" in text:
        return "Viral Fever"
    return "Needs clinical review"


def symptom_response(prediction: str, confidence: float, symptoms: List[str], possible: Optional[List[Dict[str, Any]]] = None, model_name: str = "medical fallback rules"):
    risk = "high" if prediction == "Dengue" and (confidence >= 0.7 or any("bleeding" in item for item in symptoms)) else "moderate" if prediction == "Dengue" or confidence >= 0.45 else "low"
    return {
        "predictedDisease": prediction,
        "prediction": prediction,
        "confidence": round(float(confidence), 3),
        "riskLevel": risk,
        "possibleDiseases": possible or [{"disease": prediction, "confidence": round(float(confidence), 3)}],
        "explanation": f"Matched symptoms: {', '.join(symptoms) or 'none provided'}. Model source: {model_name}.",
        "recommendedTests": RECOMMENDED_TESTS.get(prediction, ["Clinician-directed examination and testing"]),
        "precautions": PRECAUTIONS.get(prediction, PRECAUTIONS["Needs clinical review"]),
        "medicineGuidance": "Avoid unsafe self-medication. Use only medicines recommended by a licensed clinician, especially for children, pregnancy, bleeding, liver/kidney disease, or dengue concern.",
        "doctorAdvice": "Consult a doctor promptly if symptoms are severe, worsening, fever persists beyond three days, or warning signs appear.",
        "disclaimer": DISCLAIMER,
    }


def preprocess_image(image: Image.Image) -> Image.Image:
    if cv2 is None:
        return image.convert("L")
    array = np.array(image.convert("RGB"))
    gray = cv2.cvtColor(array, cv2.COLOR_RGB2GRAY)
    gray = cv2.bilateralFilter(gray, 9, 75, 75)
    threshold = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 2)
    return Image.fromarray(threshold)


def images_from_bytes(filename: str, content_type: Optional[str], contents: bytes) -> List[Image.Image]:
    is_pdf = content_type == "application/pdf" or filename.lower().endswith(".pdf")
    if is_pdf:
        if pdfium is None:
            raise HTTPException(status_code=503, detail="PDF OCR requires pypdfium2. Install ml requirements and restart the service.")
        pdf = pdfium.PdfDocument(contents)
        pages: List[Image.Image] = []
        for page_index in range(min(len(pdf), 6)):
            pages.append(pdf[page_index].render(scale=2.2).to_pil().convert("RGB"))
        if not pages:
            raise HTTPException(status_code=422, detail="The PDF did not contain readable pages.")
        return pages
    try:
        return [Image.open(io.BytesIO(contents)).convert("RGB")]
    except Exception as exc:
        raise HTTPException(status_code=422, detail="The file is not a readable image or PDF.") from exc


def run_ocr(filename: str, content_type: Optional[str], contents: bytes):
    if len(contents) > 12 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Report file exceeds 12MB limit.")
    if not TESSERACT_CMD:
        raise HTTPException(
            status_code=503,
            detail="OCR is unavailable because Tesseract is not installed. Install Tesseract OCR and set TESSERACT_CMD to tesseract.exe, then restart FastAPI.",
        )
    config = os.getenv("TESSERACT_CONFIG", "--psm 6")
    text_parts = []
    try:
        for image in images_from_bytes(filename, content_type, contents):
            text_parts.append(pytesseract.image_to_string(preprocess_image(image), config=config))
    except pytesseract.TesseractNotFoundError as exc:
        raise HTTPException(
            status_code=503,
            detail="OCR is unavailable because Tesseract is not installed or is not in PATH. Set TESSERACT_CMD to the full tesseract.exe path and restart FastAPI.",
        ) from exc
    text = "\n".join(text_parts).strip()
    if not text:
        raise HTTPException(status_code=422, detail="OCR did not detect readable text. Upload a clearer scan or PDF.")
    extracted = parse_medical_report(text)
    return {"extractedText": text[:5000], "extractedValues": extracted, "raw_text": text[:5000], "extracted_data": extracted}


def number(value: Any):
    if value in (None, "", "N/A"):
        return None
    try:
        return float(str(value).replace(",", ""))
    except Exception:
        return None


def analyze_values(values: Dict[str, Any], symptoms: Optional[List[str]] = None):
    symptoms = symptoms or []
    numeric = {key: number(value) for key, value in values.items()}
    statements: List[str] = []
    risk = "low"

    platelets = numeric.get("platelets")
    wbc = numeric.get("wbc")
    hemoglobin = numeric.get("hemoglobin")
    dengue_markers = []
    if str(values.get("dengue_igg", "")).strip().lower() in {"positive", "reactive", "detected", "present"}:
        dengue_markers.append("ANTI DENGUE IgG Positive")
    if str(values.get("dengue_igm", "")).strip().lower() in {"positive", "reactive", "detected", "present"}:
        dengue_markers.append("ANTI DENGUE IgM Positive")
    has_fever = any("fever" in item.lower() for item in symptoms)

    if platelets is not None and platelets < 150000:
        statements.append("Low Platelets detected.")
        risk = "moderate"
    if platelets is not None and platelets < 100000:
        statements.append("Dengue risk appears high based on platelet count and symptoms." if has_fever else "Dengue risk may be elevated when low platelets occur with fever.")
        risk = "high"
    if wbc is not None and wbc > 11000:
        statements.append("WBC count is high, which may indicate infection.")
        risk = "moderate" if risk == "low" else risk
    if wbc is not None and wbc < 4000:
        statements.append("Low WBC detected, which can occur in viral infections including dengue.")
        risk = "moderate" if risk == "low" else risk
    if hemoglobin is not None and hemoglobin < 12:
        statements.append("Hemoglobin is low, which may suggest anemia.")
        risk = "moderate" if risk == "low" else risk
    if dengue_markers:
        statements.append(f"Positive Dengue markers detected ({', '.join(dengue_markers)}).")
        risk = "high" if risk in {"moderate", "high"} else "moderate"
    if not statements:
        statements.append("Extracted values are not showing obvious danger thresholds.")
    statements.append("Please consult a doctor immediately if fever is severe or symptoms worsen.")

    flags = build_report_flags(values)
    model_risk = None
    if dengue_report_model is not None and report_columns:
        row_values = {
            "age": 30,
            "gender": 0,
            "hemoglobin_g_dl": numeric.get("hemoglobin") or 0,
            "wbc_count": numeric.get("wbc") or 0,
            "differential_count": numeric.get("neutrophils") or 0,
            "rbc_count": numeric.get("rbc") or 0,
            "platelet_count": numeric.get("platelets") or 0,
            "platelet_distribution_width": numeric.get("pdw") or 0,
        }
        try:
            probabilities = dengue_report_model.predict_proba([[row_values.get(column, 0) for column in report_columns]])[0]
            model_risk = round(float(probabilities[-1]), 3)
            if model_risk >= 0.65:
                risk = "high"
                statements.insert(0, "The trained report model indicates elevated dengue risk.")
        except Exception as exc:
            print(f"Report model prediction failed: {exc}")

    return {
        "summary": " ".join(statements),
        "analysis": " ".join(statements),
        "riskLevel": risk,
        "flags": flags,
        "modelDengueRisk": model_risk,
        "disclaimer": DISCLAIMER,
    }


# Chatbot responses are intentionally local-only for now.
# The replacement point for a future real AI provider is the /chatbot route below.
_firestore_client: Any = None
_firestore_attempted = False
_firestore_error: Optional[str] = None


def get_firestore_client():
    global _firestore_attempted, _firestore_client, _firestore_error
    if _firestore_attempted:
        return _firestore_client

    _firestore_attempted = True
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore

        if not firebase_admin._apps:
            project_id = (
                os.getenv("FIREBASE_PROJECT_ID")
                or os.getenv("NEXT_PUBLIC_FIREBASE_PROJECT_ID")
                or os.getenv("GOOGLE_CLOUD_PROJECT")
            )
            options = {"projectId": project_id} if project_id else None
            service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
            service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH") or os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

            if service_account_json:
                firebase_admin.initialize_app(credentials.Certificate(json.loads(service_account_json)), options)
            elif service_account_path and Path(service_account_path).exists():
                firebase_admin.initialize_app(credentials.Certificate(service_account_path), options)
            else:
                firebase_admin.initialize_app(options=options)

        _firestore_client = firestore.client()
    except Exception as exc:
        _firestore_error = str(exc)[:240]
        logger.info("Firestore backend save is unavailable; clients can still save chat history.", extra={"error": _firestore_error})
        _firestore_client = None

    return _firestore_client


def save_chatbot_message(payload: ChatPayload, response: str, provider: str, fallback: bool) -> Dict[str, Any]:
    if not payload.userId:
        return {"savedToFirestore": False}

    client = get_firestore_client()
    if client is None:
        return {"savedToFirestore": False}

    try:
        from firebase_admin import firestore

        context = payload.context or payload.healthContext or {}
        record = {
            "userId": payload.userId,
            "user_message": payload.message,
            "ai_response": response,
            "provider": provider,
            "fallback": fallback,
            "healthContext": context,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }
        _update_time, doc_ref = client.collection("chatbot_messages").add(record)
        return {"savedToFirestore": True, "record": {"id": doc_ref.id}}
    except Exception as exc:
        logger.warning("Unable to save chatbot message in Firestore", extra={"error": str(exc)[:240]})
        return {"savedToFirestore": False}


def configured_chat_provider() -> str:
    if os.getenv("OPENAI_API_KEY"):
        return "openai"
    if os.getenv("GEMINI_API_KEY"):
        return "gemini"
    return "local_rules"


def external_chat_enabled() -> bool:
    return configured_chat_provider() != "local_rules"


def chat_system_prompt(context: Dict[str, Any]) -> str:
    context_preview = json.dumps(context or {}, default=str)[:1800]
    return (
        "You are MEDISENSE, a cautious healthcare guidance assistant. "
        "Give concise, safe, non-diagnostic guidance for fever, dengue, malaria, typhoid, flu, CBC values, report values, tests, precautions, and when to see a doctor. "
        "Do not prescribe medicine. Encourage clinician review for severe, persistent, or worsening symptoms. "
        f"Available user health context: {context_preview}"
    )


def try_external_chatbot(message: str, context: Dict[str, Any], history: List[Dict[str, str]]) -> Optional[Dict[str, Any]]:
    provider = configured_chat_provider()
    if provider == "local_rules":
        return None
    try:
        result: Optional[Dict[str, Any]] = None
        if provider == "openai":
            result = try_openai_chatbot(message, context, history)
        elif provider == "gemini":
            result = try_gemini_chatbot(message, context, history)
        if result:
            return result
    except Exception as exc:
        logger.info("External chatbot provider failed; using local fallback.", extra={"provider": provider, "error": str(exc)[:180]})
    local = build_local_chatbot_reply(message, context=context, history=history)
    local["fallback"] = True
    local["provider"] = "local_rules"
    local["externalProviderAttempted"] = provider
    return local


def try_openai_chatbot(message: str, context: Dict[str, Any], history: List[Dict[str, str]]) -> Optional[Dict[str, Any]]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    messages = [{"role": "system", "content": chat_system_prompt(context)}]
    for item in history[-8:]:
        role = item.get("role")
        if role in {"user", "assistant"} and item.get("content"):
            messages.append({"role": role, "content": item["content"][:900]})
    messages.append({"role": "user", "content": message})
    body = json.dumps({
        "model": os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini"),
        "messages": messages,
        "temperature": 0.25,
        "max_tokens": 520,
    }).encode("utf-8")
    request = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=body,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=18) as response:
        data = json.loads(response.read().decode("utf-8"))
    text = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
    if not text:
        return None
    return {"response": ensure_disclaimer(text), "provider": "openai", "fallback": False}


def try_gemini_chatbot(message: str, context: Dict[str, Any], history: List[Dict[str, str]]) -> Optional[Dict[str, Any]]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    model = urllib.parse.quote(os.getenv("GEMINI_MODEL", "gemini-2.0-flash"), safe="")
    prompt = chat_system_prompt(context)
    for item in history[-8:]:
        prompt += f"\n{item.get('role', 'user')}: {str(item.get('content', ''))[:900]}"
    prompt += f"\nuser: {message}"
    body = json.dumps({
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.25, "maxOutputTokens": 520},
    }).encode("utf-8")
    request = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=18) as response:
        data = json.loads(response.read().decode("utf-8"))
    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    text = "\n".join(part.get("text", "") for part in parts).strip()
    if not text:
        return None
    return {"response": ensure_disclaimer(text), "provider": "gemini", "fallback": False}


def ensure_disclaimer(text: str) -> str:
    disclaimer = "This is AI-based guidance and not a replacement for a doctor."
    if disclaimer.lower() in text.lower():
        return text
    return f"{text}\n\n{disclaimer}"


@app.get("/health")
async def health():
    return {
        "ok": True,
        "models": {
            "disease_model": disease_model is not None,
            "symptom_text_model": symptom_text_model is not None and tfidf_vectorizer is not None,
            "dengue_report_model": dengue_report_model is not None,
            "curated_symptom_model": curated_symptom_model is not None,
        },
        "ocr": {
            "tesseract_available": TESSERACT_CMD is not None,
            "tesseract_cmd": TESSERACT_CMD,
        },
        "chatbot": {
            "provider": configured_chat_provider(),
            "external_apis_enabled": external_chat_enabled(),
            "firestore_backend_save_available": get_firestore_client() is not None,
        },
    }


@app.post("/predict-symptoms")
async def predict_symptoms(payload: SymptomPayload):
    symptom_debug("incoming API symptoms", {"symptoms": payload.symptoms, "clinicalInputs": payload.clinicalInputs})
    symptoms = normalize_symptoms(payload.symptoms, payload.clinicalInputs)
    symptom_debug("normalized symptoms", symptoms)
    if not symptoms:
        raise HTTPException(status_code=422, detail="At least one symptom is required.")
    (prediction, confidence, possible), model_name = predict_with_models(symptoms)
    return symptom_response(prediction, confidence, symptoms, possible, model_name)


@app.post("/predict")
async def predict_legacy(payload: SymptomPayload):
    return await predict_symptoms(payload)


@app.post("/predict-text-symptoms")
async def predict_text_symptoms(payload: TextSymptomPayload):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="Symptom text is required.")
    if symptom_text_model is not None and tfidf_vectorizer is not None:
        vector = tfidf_vectorizer.transform([text.lower()])
        symptom_debug("raw text symptom feature vector before prediction", {"type": "tfidf", "shape": vector.shape, "nonzero_count": int(vector.nnz)})
        probabilities = symptom_text_model.predict_proba(vector)[0]
        symptom_debug("raw text symptom probabilities after prediction", dict(zip(map(str, symptom_text_model.classes_), map(float, probabilities))))
        classes = symptom_text_model.classes_
        if text_label_encoder is not None:
            classes = text_label_encoder.inverse_transform(classes)
        prediction, confidence, possible = prediction_from_probabilities(classes, probabilities)
        return {
            "predictedDisease": prediction,
            "confidence": round(float(confidence), 3),
            "explanation": f"The text model matched your description to {prediction}. Key text: {text[:180]}",
            "suggestedNextStep": "Monitor symptoms and consult a clinician if symptoms are severe, worsening, or last more than three days.",
            "possibleDiseases": possible,
            "disclaimer": DISCLAIMER,
        }
    prediction = fallback_symptom_prediction([text])
    return {
        "predictedDisease": prediction,
        "confidence": 0,
        "explanation": "The trained text model was unavailable, so MEDISENSE used conservative medical fallback rules.",
        "suggestedNextStep": "Consult a clinician for formal diagnosis and testing guidance.",
        "possibleDiseases": [{"disease": prediction, "confidence": 0}],
        "disclaimer": DISCLAIMER,
    }


@app.post("/analyze-report-values")
async def analyze_report_values(payload: ReportValuesPayload):
    return analyze_values(payload.values, payload.symptoms)


@app.post("/ocr-report")
async def ocr_report(payload: OcrUrlPayload):
    try:
        with urllib.request.urlopen(payload.fileUrl, timeout=30) as response:
            contents = response.read()
            content_type = payload.fileType or response.headers.get("content-type")
        ocr = run_ocr(payload.fileName or "report", content_type, contents)
        ocr["analysis"] = get_health_recommendation(ocr["extractedValues"])
        ocr["flags"] = build_report_flags(ocr["extractedValues"])
        return ocr
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("OCR URL processing failed", extra={"error": str(exc)[:240]})
        raise HTTPException(status_code=500, detail="OCR processing failed. Check that the report file is reachable and readable, then try again.") from exc


@app.post("/ocr")
async def process_report(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        ocr = run_ocr(file.filename or "report", file.content_type, contents)
        ocr["analysis"] = get_health_recommendation(ocr["extractedValues"])
        ocr["flags"] = build_report_flags(ocr["extractedValues"])
        return ocr
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("OCR upload processing failed", extra={"error": str(exc)[:240]})
        raise HTTPException(status_code=500, detail="OCR processing failed. Upload a clearer image or PDF, then try again.") from exc


@app.post("/chatbot")
async def chatbot(payload: ChatPayload):
    if not payload.message.strip():
        raise HTTPException(status_code=422, detail="Message is required.")
    context = payload.context or payload.healthContext or {}
    history = [{"role": item.role, "content": item.content} for item in payload.history]
    result = try_external_chatbot(payload.message, context=context, history=history)
    if result is None:
        result = build_local_chatbot_reply(payload.message, context=context, history=history)
    save_result = save_chatbot_message(payload, result["response"], result["provider"], bool(result.get("fallback")))
    return {**result, **save_result}


@app.post("/chat")
async def chat_legacy(payload: ChatPayload):
    return await chatbot(payload)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
