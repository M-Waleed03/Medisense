import re
from difflib import SequenceMatcher
from typing import Dict, Iterable, List, Optional, Tuple, Union

Number = Union[int, float, str]

NUMERIC_MARKERS = [
    "platelets",
    "wbc",
    "rbc",
    "hemoglobin",
    "hematocrit",
    "mcv",
    "mch",
    "mchc",
    "neutrophils",
    "lymphocytes",
    "monocytes",
]

STATUS_MARKERS = ["dengue_igg", "dengue_igm"]
ALL_MARKERS = NUMERIC_MARKERS + STATUS_MARKERS

FIELD_ORDER = [
    "dengue_igm",
    "dengue_igg",
    "mchc",
    "mch",
    "mcv",
    "hematocrit",
    "hemoglobin",
    "platelets",
    "wbc",
    "rbc",
    "neutrophils",
    "lymphocytes",
    "monocytes",
]

FIELD_ALIASES = {
    "platelets": ["platelet count", "platelets", "platelet", "plt", "thrombocytes"],
    "wbc": ["white blood cell count", "white blood cells", "white cell count", "total leukocyte count", "total leucocyte count", "leukocyte count", "leucocyte count", "wbc", "tlc"],
    "rbc": ["red blood cell count", "red blood cells", "erythrocyte count", "rbc"],
    "hemoglobin": ["hemoglobin", "haemoglobin", "hgb", "hb"],
    "hematocrit": ["packed cell volume", "hematocrit", "haematocrit", "pcv", "hct"],
    "mcv": ["mean corpuscular volume", "mean cell volume", "mcv"],
    "mch": ["mean corpuscular hemoglobin", "mean corpuscular haemoglobin", "mean cell hemoglobin", "mch"],
    "mchc": [
        "mean corpuscular hemoglobin concentration",
        "mean corpuscular haemoglobin concentration",
        "mean cell hemoglobin concentration",
        "mchc",
    ],
    "neutrophils": ["neutrophils", "neutrophil", "neut", "polymorphs", "polys"],
    "lymphocytes": ["lymphocytes", "lymphocyte", "lymph"],
    "monocytes": ["monocytes", "monocyte", "mono"],
    "dengue_igg": ["anti dengue igg", "dengue igg", "igg anti dengue", "anti-dengue igg", "igg"],
    "dengue_igm": ["anti dengue igm", "dengue igm", "igm anti dengue", "anti-dengue igm", "igm"],
}

FIELD_EXCLUSIONS = {
    "hemoglobin": ["mch", "mchc", "mean corpuscular", "mean cell"],
    "mch": ["mchc", "concentration"],
    "dengue_igg": ["igm"],
    "dengue_igm": ["igg"],
}

NUMBER_RE = re.compile(r"(?<![A-Za-z])(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?(?![A-Za-z])")
STATUS_RE = re.compile(r"\b(non[\s-]?reactive|not\s+detected|negative|positive|reactive|detected|present|absent)\b", re.IGNORECASE)

SEGMENT_TRIGGER_RE = re.compile(
    r"(?i)(?="
    r"anti[\s-]*dengue\s+ig[gm]\b|"
    r"dengue\s+ig[gm]\b|"
    r"ig[gm]\s+anti[\s-]*dengue\b|"
    r"mean\s+corpuscular\s+ha?emoglobin\s+concentration\b|"
    r"mean\s+cell\s+ha?emoglobin\s+concentration\b|"
    r"mean\s+corpuscular\s+ha?emoglobin\b|"
    r"mean\s+cell\s+ha?emoglobin\b|"
    r"mean\s+corpuscular\s+volume\b|"
    r"packed\s+cell\s+volume\b|"
    r"total\s+leu[ck]ocyte\s+count\b|"
    r"white\s+blood\s+cell(?:\s+count)?\b|"
    r"red\s+blood\s+cell(?:\s+count)?\b|"
    r"platelet(?:s|\s+count)?\b|"
    r"thrombocytes?\b|"
    r"mchc\b|mch\b|mcv\b|pcv\b|hct\b|wbc\b|rbc\b|tlc\b|plt\b|hgb\b|hb\b|"
    r"(?<!corpuscular\s)(?<!cell\s)ha?emoglobin\b|"
    r"neutrophils?\b|neut\b|lymphocytes?\b|lymph\b|monocytes?\b|mono\b"
    r")"
)


def _clean_number(value: str) -> Number:
    cleaned = re.sub(r"[^0-9.]", "", value).strip(".")
    if not cleaned or not re.search(r"\d", cleaned):
        return "N/A"
    match = re.search(r"\d+(?:\.\d+)?", cleaned)
    if not match:
        return "N/A"
    number = float(match.group(0))
    return int(number) if number.is_integer() else number


def _normalize_label(value: str) -> str:
    normalized = value.lower()
    normalized = normalized.replace("|", " ").replace("_", " ")
    normalized = re.sub(r"[^a-z0-9]+", " ", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized


def _alias_pattern(alias: str) -> re.Pattern[str]:
    normalized_alias = _normalize_label(alias)
    parts = [re.escape(part) for part in normalized_alias.split()]
    return re.compile(r"(?<![a-z0-9])" + r"\s+".join(parts) + r"(?![a-z0-9])")


def _contains_alias(label: str, alias: str) -> bool:
    return bool(_alias_pattern(alias).search(label))


def _token_windows(tokens: List[str], size: int) -> Iterable[str]:
    if size <= 0 or len(tokens) < size:
        return []
    return (" ".join(tokens[index:index + size]) for index in range(0, len(tokens) - size + 1))


def _fuzzy_score(label: str, alias: str) -> float:
    normalized_alias = _normalize_label(alias)
    if not label or not normalized_alias:
        return 0.0
    if _contains_alias(label, normalized_alias):
        return 1.0 + min(len(normalized_alias), 40) / 1000

    alias_tokens = normalized_alias.split()
    label_tokens = label.split()
    candidates = [label]
    candidates.extend(_token_windows(label_tokens, len(alias_tokens)))
    if len(alias_tokens) == 1:
        candidates.extend(token for token in label_tokens if abs(len(token) - len(normalized_alias)) <= 2)

    best = 0.0
    for candidate in candidates:
        ratio = SequenceMatcher(None, candidate, normalized_alias).ratio()
        if len(normalized_alias) <= 4 and not _contains_alias(label, normalized_alias):
            if abs(len(candidate) - len(normalized_alias)) > 1:
                continue
            ratio -= 0.08
        best = max(best, ratio)
    return best


def _label_matches_marker(label: str, marker: str) -> bool:
    exclusions = FIELD_EXCLUSIONS.get(marker, [])
    if any(exclusion in label for exclusion in exclusions):
        return False
    return True


def _best_marker_for_label(label: str) -> Optional[str]:
    normalized = _normalize_label(label)
    if not normalized:
        return None

    best_marker: Optional[str] = None
    best_score = 0.0
    for marker in FIELD_ORDER:
        if not _label_matches_marker(normalized, marker):
            continue
        for alias in FIELD_ALIASES[marker]:
            score = _fuzzy_score(normalized, alias)
            if score > best_score:
                best_marker = marker
                best_score = score

    return best_marker if best_score >= 0.82 else None


def _split_segments(text: str) -> List[str]:
    segments: List[str] = []
    for raw_line in re.split(r"[\r\n]+", text):
        line = raw_line.strip()
        if not line:
            continue
        segments.append(line)
        positions = sorted({match.start() for match in SEGMENT_TRIGGER_RE.finditer(line)})
        for index, start in enumerate(positions):
            end = positions[index + 1] if index + 1 < len(positions) else len(line)
            segment = line[start:end].strip(" :;|,\t")
            if segment:
                segments.append(segment)

    deduped: List[str] = []
    seen = set()
    for segment in segments:
        key = segment.lower()
        if key not in seen:
            seen.add(key)
            deduped.append(segment)
    return deduped


def _value_span(segment: str) -> Optional[Tuple[int, int, str]]:
    number = NUMBER_RE.search(segment)
    status = STATUS_RE.search(segment)
    if number and (not status or number.start() <= status.start()):
        return number.start(), number.end(), number.group(0)
    if status:
        return status.start(), status.end(), status.group(0)
    return None


def _extract_line_value(segment: str) -> Tuple[Optional[str], Optional[str]]:
    span = _value_span(segment)
    if not span:
        return None, None
    start, _, value = span
    label = segment[:start].strip(" :;|=-\t")
    if not label:
        return None, None
    return _best_marker_for_label(label), value


def _normalize_status(value: str) -> str:
    status = re.sub(r"\s+", " ", value.strip().lower().replace("-", " "))
    if status in {"positive", "reactive", "detected", "present"}:
        return "Positive"
    if status in {"negative", "non reactive", "not detected", "absent"}:
        return "Negative"
    return value.strip().title() or "N/A"


def _is_positive(value: object) -> bool:
    return str(value).strip().lower() in {"positive", "reactive", "detected", "present"}


def _regex_value_for_marker(text: str, marker: str) -> Optional[Number]:
    if marker in STATUS_MARKERS:
        return _regex_status_for_marker(text, marker)

    label_patterns = {
        "platelets": [r"platelet(?:s|\s+count)?", r"plt", r"thrombocytes?"],
        "wbc": [r"wbc", r"white\s+blood\s+cell(?:s|\s+count)?", r"total\s+leu[ck]ocyte\s+count", r"tlc"],
        "rbc": [r"rbc", r"red\s+blood\s+cell(?:s|\s+count)?", r"erythrocyte\s+count"],
        "hemoglobin": [r"ha?emoglobin", r"hgb", r"hb"],
        "hematocrit": [r"ha?ematocrit", r"hct", r"pcv", r"packed\s+cell\s+volume"],
        "mcv": [r"mcv", r"mean\s+corpuscular\s+volume", r"mean\s+cell\s+volume"],
        "mch": [r"mch(?!c)", r"mean\s+corpuscular\s+ha?emoglobin(?!\s+concentration)", r"mean\s+cell\s+ha?emoglobin(?!\s+concentration)"],
        "mchc": [r"mchc", r"mean\s+corpuscular\s+ha?emoglobin\s+concentration", r"mean\s+cell\s+ha?emoglobin\s+concentration"],
        "neutrophils": [r"neutrophils?", r"neut", r"polymorphs?", r"polys"],
        "lymphocytes": [r"lymphocytes?", r"lymph"],
        "monocytes": [r"monocytes?", r"mono"],
    }

    for label_pattern in label_patterns[marker]:
        expression = re.compile(
            rf"(?im)(?:^|[\n;|])\s*{label_pattern}\b[^\n0-9]{{0,45}}({NUMBER_RE.pattern})"
        )
        for match in expression.finditer(text):
            line_prefix = text[max(0, match.start() - 35):match.start()].lower()
            if marker == "hemoglobin" and ("mch" in line_prefix or "mean corpuscular" in line_prefix or "mean cell" in line_prefix):
                continue
            return _clean_number(match.group(1))
    return None


def _regex_status_for_marker(text: str, marker: str) -> Optional[str]:
    if marker == "dengue_igg":
        label_patterns = [r"anti[\s-]*dengue\s+igg", r"dengue\s+igg", r"igg\s+anti[\s-]*dengue"]
    else:
        label_patterns = [r"anti[\s-]*dengue\s+igm", r"dengue\s+igm", r"igm\s+anti[\s-]*dengue"]

    for label_pattern in label_patterns:
        expression = re.compile(rf"(?im){label_pattern}[^\n]{{0,50}}{STATUS_RE.pattern}")
        match = expression.search(text)
        if match:
            return _normalize_status(match.group(match.lastindex or 0))
    return None


def parse_medical_report(text: str) -> Dict[str, Number]:
    data: Dict[str, Number] = {marker: "N/A" for marker in ALL_MARKERS}

    for segment in _split_segments(text):
        marker, value = _extract_line_value(segment)
        if not marker or data[marker] != "N/A":
            continue
        if marker in STATUS_MARKERS:
            data[marker] = _normalize_status(value or "")
        elif value:
            data[marker] = _clean_number(value)

    for marker in FIELD_ORDER:
        if data[marker] != "N/A":
            continue
        value = _regex_value_for_marker(text, marker)
        if value is not None:
            data[marker] = value

    return data


def build_report_flags(data: Dict[str, Number]) -> List[Dict[str, str]]:
    flags: List[Dict[str, str]] = []
    platelets = data.get("platelets")
    wbc = data.get("wbc")
    rbc = data.get("rbc")
    hemoglobin = data.get("hemoglobin")
    hematocrit = data.get("hematocrit")
    mcv = data.get("mcv")
    mch = data.get("mch")
    mchc = data.get("mchc")
    neutrophils = data.get("neutrophils")
    lymphocytes = data.get("lymphocytes")
    monocytes = data.get("monocytes")
    dengue_igg = data.get("dengue_igg")
    dengue_igm = data.get("dengue_igm")

    if isinstance(platelets, (int, float)):
        if platelets < 50000:
            flags.append({"severity": "critical", "label": "Low Platelets", "detail": "Platelet count is critically low. Bleeding risk can rise at this level. Consult a doctor immediately."})
        elif platelets < 100000:
            flags.append({"severity": "high", "label": "Low Platelets", "detail": "Platelets are lower than normal. This can fit dengue or other viral illnesses when fever is present."})
        elif platelets < 150000:
            flags.append({"severity": "moderate", "label": "Low Platelets", "detail": "Platelets are mildly reduced. Repeat CBC and correlate with fever, rash, pain, or bleeding symptoms."})

    if isinstance(wbc, (int, float)):
        if wbc < 4000:
            flags.append({"severity": "moderate", "label": "Low WBC", "detail": "Low WBC can appear in viral fever and dengue."})
        elif wbc > 11000:
            flags.append({"severity": "moderate", "label": "WBC is elevated", "detail": "Elevated WBC may indicate infection or inflammation."})

    if isinstance(rbc, (int, float)) and rbc < 4:
        flags.append({"severity": "low", "label": "RBC is below common adult reference levels", "detail": "Discuss anemia or blood loss evaluation with a clinician."})

    if isinstance(hemoglobin, (int, float)) and hemoglobin < 12:
        flags.append({"severity": "moderate", "label": "Hemoglobin is low", "detail": "Low hemoglobin can suggest anemia and needs clinical context."})

    if isinstance(hematocrit, (int, float)) and hematocrit < 36:
        flags.append({"severity": "low", "label": "Hematocrit is low", "detail": "This can align with anemia or hydration status changes."})

    if isinstance(mcv, (int, float)) and (mcv < 80 or mcv > 100):
        flags.append({"severity": "low", "label": "MCV is outside common reference range", "detail": "MCV changes can help classify anemia and should be interpreted clinically."})

    if isinstance(mch, (int, float)) and (mch < 27 or mch > 33):
        flags.append({"severity": "low", "label": "MCH is outside common reference range", "detail": "MCH changes can appear with anemia patterns."})

    if isinstance(mchc, (int, float)) and (mchc < 32 or mchc > 36):
        flags.append({"severity": "low", "label": "MCHC is outside common reference range", "detail": "MCHC should be reviewed with hemoglobin, MCV, and clinical history."})

    if isinstance(neutrophils, (int, float)) and neutrophils > 75:
        flags.append({"severity": "moderate", "label": "Neutrophils are high", "detail": "High neutrophils may occur with bacterial infection, inflammation, or stress responses."})

    if isinstance(lymphocytes, (int, float)) and lymphocytes > 45:
        flags.append({"severity": "moderate", "label": "Lymphocytes are high", "detail": "High lymphocytes can occur with viral infections and needs clinical context."})

    if isinstance(monocytes, (int, float)) and (monocytes < 2 or monocytes > 10):
        flags.append({"severity": "low", "label": "Monocytes are outside common reference range", "detail": "Monocyte percentage should be interpreted with the full differential count."})

    positive_markers = []
    if _is_positive(dengue_igg):
        positive_markers.append("ANTI DENGUE IgG Positive")
    if _is_positive(dengue_igm):
        positive_markers.append("ANTI DENGUE IgM Positive")
    if positive_markers:
        flags.append({"severity": "high", "label": "Positive Dengue markers", "detail": f"{', '.join(positive_markers)} detected. Correlate with illness day, fever history, CBC trend, and clinician assessment."})

    if isinstance(platelets, (int, float)) and isinstance(wbc, (int, float)) and platelets < 150000 and wbc < 4000:
        flags.append({"severity": "high", "label": "Possible dengue indication", "detail": "Low platelets plus low WBC with fever should be reviewed urgently."})

    return flags


def get_health_recommendation(data: Dict[str, Number]) -> str:
    alerts: List[str] = []
    for flag in build_report_flags(data):
        alerts.append(f"{flag['label']}. {flag['detail']}")

    if not alerts:
        return "Extracted values are not showing obvious danger thresholds. Continue monitoring and consult a licensed clinician for diagnosis."

    return " ".join(alerts)
