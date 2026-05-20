from __future__ import annotations

import re
from typing import Any, Dict, Iterable, List, Optional, Tuple

CHATBOT_DISCLAIMER = "This is AI-based guidance and not a replacement for a doctor."
UNKNOWN_RESPONSE = (
    "I can help with fever, dengue, malaria, typhoid, viral symptoms, CBC report values, "
    "and basic precautions. Please describe your symptoms or upload a report."
)

COMMON_SAFETY = (
    "Avoid self-medication. Seek urgent care for breathing difficulty, chest pain, confusion, "
    "fainting, bleeding, severe dehydration, very low urine, severe abdominal pain, or symptoms "
    "that are rapidly getting worse."
)

TOPIC_KEYWORDS: List[Tuple[str, Iterable[str]]] = [
    ("doctor", ("doctor", "hospital", "urgent", "emergency", "consult", "see a doctor", "red flag", "danger")),
    ("low_platelets", ("low platelet", "low platelets", "platelet low", "platelets low", "thrombocytopenia")),
    ("high_wbc", ("high wbc", "wbc high", "white blood", "leukocyte", "leucocyte", "high tlc")),
    ("low_hemoglobin", ("low hemoglobin", "low haemoglobin", "low hb", "hb low", "anemia", "anaemia")),
    ("cbc", ("cbc", "complete blood", "blood report", "report explanation", "blood test", "lab report")),
    ("dengue", ("dengue", "ns1", "igm", "igg", "rash", "bleeding", "platelet", "mosquito")),
    ("malaria", ("malaria", "chills", "sweating", "sweats", "periodic fever", "travel fever")),
    ("typhoid", ("typhoid", "enteric", "blood culture", "contaminated food", "contaminated water")),
    ("viral_fever", ("viral fever", "viral", "fever with body pain")),
    ("flu", ("flu", "influenza", "runny nose", "sore throat", "cough", "cold")),
    ("vomiting", ("vomit", "vomiting", "nausea", "throwing up")),
    ("diarrhea", ("diarrhea", "diarrhoea", "loose motion", "loose stool", "watery stool")),
    ("headache", ("headache", "head pain", "migraine")),
    ("body_pain", ("body pain", "body ache", "muscle pain", "joint pain", "aches")),
    ("hydration", ("hydration", "hydrate", "water", "fluids", "ors", "dehydration")),
    ("rest", ("rest", "sleep", "tired", "fatigue", "weakness")),
    ("tests", ("test", "tests", "investigation", "lab", "diagnosis")),
    ("precautions", ("precaution", "precautions", "care", "prevent", "avoid")),
    ("fever", ("fever", "temperature", "high temp", "pyrexia")),
]


def build_local_chatbot_reply(
    message: str,
    context: Optional[Dict[str, Any]] = None,
    history: Optional[List[Dict[str, str]]] = None,
) -> Dict[str, Any]:
    """Return a safe local MEDISENSE chatbot response without external API calls."""
    text = normalize_text(message)
    topic = detect_topic(text)
    cbc_values = extract_cbc_values(context or {})

    if topic is None:
        return {
            "response": with_disclaimer(UNKNOWN_RESPONSE),
            "provider": "local_rules",
            "fallback": False,
            "matchedTopic": "unknown",
            "suggestedQuickQuestions": quick_questions(),
        }

    response = response_for_topic(topic, cbc_values)
    if cbc_values and topic in {"cbc", "low_platelets", "high_wbc", "low_hemoglobin"}:
        response = f"{response}\n\nFrom the available report context: {summarize_cbc_values(cbc_values)}"

    return {
        "response": with_disclaimer(response),
        "provider": "local_rules",
        "fallback": False,
        "matchedTopic": topic,
        "suggestedQuickQuestions": quick_questions(),
    }


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().lower())


def detect_topic(text: str) -> Optional[str]:
    if not text:
        return None
    for topic, keywords in TOPIC_KEYWORDS:
        if any(keyword in text for keyword in keywords):
            return topic
    return None


def with_disclaimer(response: str) -> str:
    if CHATBOT_DISCLAIMER.lower() in response.lower():
        return response
    return f"{response}\n\n{CHATBOT_DISCLAIMER}"


def response_for_topic(topic: str, values: Dict[str, float]) -> str:
    responses = {
        "fever": (
            "Fever can happen with viral infections, flu, dengue, malaria, typhoid, or other infections. "
            "Drink fluids, rest, monitor temperature, and note symptoms such as rash, cough, vomiting, diarrhea, chills, or abdominal pain. "
            "If fever lasts more than 3 days, is very high, or comes with warning signs, consult a doctor. "
            "A CBC is often a useful first test for persistent fever. "
            f"{COMMON_SAFETY}"
        ),
        "dengue": (
            "Common dengue symptoms include sudden fever, severe body pain, headache or pain behind the eyes, rash, nausea, vomiting, and sometimes bleeding. "
            "Low platelets can occur, so CBC monitoring is important when dengue is suspected. "
            "Use mosquito protection, drink fluids, rest, and avoid self-medication. "
            "Recommended tests may include CBC with platelet trend and dengue NS1 or IgM/IgG depending on illness day. "
            f"{COMMON_SAFETY}"
        ),
        "malaria": (
            "Malaria often causes fever with chills, sweating, headache, weakness, and body aches. Fever may come in cycles, but it can also be irregular. "
            "Because malaria needs confirmatory testing, ask a clinician about a rapid malaria test or peripheral blood smear, plus CBC if fever is ongoing. "
            "Rest, drink fluids, and do not delay medical review if symptoms are strong. "
            f"{COMMON_SAFETY}"
        ),
        "typhoid": (
            "Typhoid can cause persistent fever, weakness, headache, abdominal pain, appetite loss, constipation or diarrhea, and sometimes a coated tongue. "
            "It is linked with contaminated food or water. Use safe water, hand hygiene, light meals, and fluids. "
            "Recommended tests may include blood culture before antibiotics when possible, CBC, and clinician-directed typhoid testing. "
            "Avoid self-medication, especially antibiotics. "
            f"{COMMON_SAFETY}"
        ),
        "viral_fever": (
            "Viral fever usually improves with rest, fluids, and monitoring, but it can look similar to dengue, flu, malaria, or typhoid early on. "
            "Track fever duration, hydration, cough, rash, stomach symptoms, and body pain. "
            "Consider CBC if fever continues, and consult a doctor if fever lasts more than 3 days or symptoms worsen. "
            f"{COMMON_SAFETY}"
        ),
        "flu": (
            "Flu commonly causes fever, cough, sore throat, runny nose, headache, body aches, and tiredness. "
            "Rest, fluids, masking around vulnerable people, and monitoring are safe steps. "
            "Flu or COVID testing may be useful when respiratory symptoms are strong or exposure is likely. "
            f"{COMMON_SAFETY}"
        ),
        "headache": (
            "Headache can happen with fever, dehydration, flu, dengue, stress, eye strain, or high blood pressure. "
            "Drink fluids, rest in a quiet place, and watch for fever pattern or other symptoms. "
            "Consult a doctor urgently for sudden severe headache, confusion, fainting, weakness on one side, neck stiffness, repeated vomiting, or headache after injury. "
            f"{COMMON_SAFETY}"
        ),
        "vomiting": (
            "Vomiting can occur with viral illness, food-related infection, dengue, migraine, or dehydration. "
            "Take small frequent sips of fluids and watch urine output. Avoid heavy meals and avoid self-medication. "
            "Consult a doctor if vomiting is repeated, there is blood, severe abdominal pain, drowsiness, high fever, or signs of dehydration. "
            f"{COMMON_SAFETY}"
        ),
        "diarrhea": (
            "Diarrhea is often due to viral illness or contaminated food/water, but persistent fever can also suggest typhoid or another infection. "
            "Focus on fluids, oral rehydration, safe water, and light food. "
            "Seek medical care for blood in stool, severe dehydration, severe abdominal pain, persistent fever, or diarrhea lasting more than 2 days. "
            f"{COMMON_SAFETY}"
        ),
        "body_pain": (
            "Body pain can happen with viral fever, flu, dengue, malaria, dehydration, or overexertion. "
            "Rest, drink fluids, and track fever, rash, chills, headache, vomiting, and weakness. "
            "If body pain is severe with fever, rash, bleeding, or low platelets, consult a doctor and consider CBC and dengue testing. "
            f"{COMMON_SAFETY}"
        ),
        "low_platelets": (
            "Low platelets mean the blood has fewer clotting cells than expected. This can happen with dengue, viral infections, malaria, some medicines, or other conditions. "
            "A single value should be interpreted with symptoms and repeat trends. Monitor for bleeding, black stools, severe abdominal pain, persistent vomiting, drowsiness, or low urine. "
            "Recommended next steps are CBC repeat/trend and doctor review, especially if fever is present. "
            f"{COMMON_SAFETY}"
        ),
        "high_wbc": (
            "High WBC means white blood cells are above the usual range, often because the body is reacting to infection, inflammation, stress, or other causes. "
            "It does not identify the exact disease by itself. A doctor may compare neutrophils, lymphocytes, symptoms, fever duration, and other tests. "
            "Avoid self-medication and get medical review if fever is persistent or symptoms are worsening. "
            f"{COMMON_SAFETY}"
        ),
        "low_hemoglobin": (
            "Low hemoglobin can suggest anemia, blood loss, nutritional deficiency, chronic illness, or other causes. "
            "Symptoms may include weakness, dizziness, shortness of breath, fast heartbeat, or tiredness. "
            "A doctor may advise CBC review, iron studies, B12/folate tests, stool testing, or other checks depending on age, sex, and symptoms. "
            f"{COMMON_SAFETY}"
        ),
        "cbc": (
            "A CBC report usually includes hemoglobin, WBC, platelets, and sometimes RBC indices and differential counts. "
            "Platelets help with clotting, WBC reflects immune/infection response, and hemoglobin carries oxygen. "
            "Low platelets with fever can need dengue or viral evaluation; high WBC can point toward infection/inflammation; low hemoglobin can suggest anemia. "
            "Lab ranges vary, so interpret values with symptoms and a clinician. "
            f"{COMMON_SAFETY}"
        ),
        "doctor": (
            "Consult a doctor if fever lasts more than 3 days, symptoms are worsening, platelets are low, WBC is very abnormal, hemoglobin is low with weakness, or you have repeated vomiting or diarrhea. "
            "Seek urgent care now for breathing difficulty, chest pain, confusion, fainting, bleeding, severe dehydration, very low urine, severe abdominal pain, neck stiffness, pregnancy concerns, or symptoms in infants, older adults, or people with chronic illness. "
            "Bring your CBC/report values and symptom timeline if available."
        ),
        "precautions": (
            "Basic precautions: drink fluids, rest, monitor fever, use safe water and hand hygiene, avoid mosquito bites, and avoid self-medication. "
            "If fever is present, write down the start date, highest temperature, and symptoms such as rash, cough, chills, vomiting, diarrhea, or bleeding. "
            "Consult a doctor if symptoms persist or warning signs appear. "
            f"{COMMON_SAFETY}"
        ),
        "hydration": (
            "Hydration is important during fever, vomiting, diarrhea, dengue concern, and viral illness. "
            "Take small frequent sips if nausea is present and monitor urine color and frequency. "
            "Seek medical care if you cannot keep fluids down, feel very weak or dizzy, have very low urine, dry mouth with drowsiness, or ongoing diarrhea/vomiting. "
            f"{COMMON_SAFETY}"
        ),
        "rest": (
            "Rest helps the body recover during fever, flu, viral illness, dengue concern, malaria, or typhoid-like symptoms. "
            "Avoid heavy exercise while febrile or very weak. Track symptoms, drink fluids, and seek care if fever lasts more than 3 days or warning signs appear. "
            f"{COMMON_SAFETY}"
        ),
        "tests": (
            "For fever, common tests depend on symptoms and local illness patterns. A CBC is often a first step. "
            "Dengue suspicion may need CBC platelet trend plus NS1 or IgM/IgG depending on illness day. "
            "Malaria suspicion may need rapid malaria test or blood smear. Typhoid suspicion may need blood culture and clinician-directed typhoid testing. "
            "Flu/COVID testing may be useful with cough, sore throat, or exposure. A doctor can choose the safest test plan."
        ),
    }
    return responses.get(topic, UNKNOWN_RESPONSE)


def extract_cbc_values(context: Dict[str, Any]) -> Dict[str, float]:
    values: Dict[str, float] = {}
    for key, value in walk_items(context):
        normalized_key = key.lower().replace("_", "").replace("-", "")
        if normalized_key in {"platelets", "platelet", "plateletcount"}:
            parsed = to_number(value)
            if parsed is not None:
                values["platelets"] = parsed
        if normalized_key in {"wbc", "whitebloodcells", "whitebloodcell", "wbccount", "tlc"}:
            parsed = to_number(value)
            if parsed is not None:
                values["wbc"] = parsed
        if normalized_key in {"hemoglobin", "haemoglobin", "hb", "hgb"}:
            parsed = to_number(value)
            if parsed is not None:
                values["hemoglobin"] = parsed
    return values


def walk_items(value: Any) -> Iterable[Tuple[str, Any]]:
    if isinstance(value, dict):
        for key, item in value.items():
            yield str(key), item
            yield from walk_items(item)
    elif isinstance(value, list):
        for item in value:
            yield from walk_items(item)


def to_number(value: Any) -> Optional[float]:
    if value in (None, "", "N/A"):
        return None
    try:
        return float(re.sub(r"[^\d.]", "", str(value)))
    except Exception:
        return None


def summarize_cbc_values(values: Dict[str, float]) -> str:
    parts: List[str] = []
    platelets = values.get("platelets")
    wbc = values.get("wbc")
    hemoglobin = values.get("hemoglobin")

    if platelets is not None:
        status = "low" if platelets < 150000 else "within the usual broad range" if platelets <= 450000 else "high"
        parts.append(f"platelets {platelets:g} ({status})")
    if wbc is not None:
        status = "low" if wbc < 4000 else "within the usual broad range" if wbc <= 11000 else "high"
        parts.append(f"WBC {wbc:g} ({status})")
    if hemoglobin is not None:
        status = "low" if hemoglobin < 12 else "within the usual broad range"
        parts.append(f"hemoglobin {hemoglobin:g} ({status})")

    if not parts:
        return "I could not detect platelets, WBC, or hemoglobin values in the provided context."
    return "; ".join(parts) + "."


def quick_questions() -> List[str]:
    return [
        "What are dengue symptoms?",
        "What does low platelets mean?",
        "When should I see a doctor?",
        "What tests are needed for fever?",
        "What is typhoid?",
        "What is malaria?",
    ]
