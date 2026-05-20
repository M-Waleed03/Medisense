import re
from typing import Dict, List, Union

Number = Union[int, float, str]


def _clean_number(value: str) -> Number:
    cleaned = re.sub(r"[^0-9.]", "", value).strip(".")
    if not cleaned or not re.search(r"\d", cleaned):
        return "N/A"
    match = re.search(r"\d+(?:\.\d+)?", cleaned)
    if not match:
        return "N/A"
    number = float(match.group(0))
    return int(number) if number.is_integer() else number


def parse_medical_report(text: str) -> Dict[str, Number]:
    normalized = text.lower().replace(",", "")
    patterns = {
        "platelets": [
            r"platelet(?:s| count)?\s*[:\-]?\s*([0-9][0-9,.]*)",
            r"plt\s*[:\-]?\s*([0-9][0-9,.]*)"
        ],
        "wbc": [
            r"(?:wbc|white blood cells?|total leukocyte count|tlc)\s*[:\-]?\s*([0-9][0-9,.]*)"
        ],
        "rbc": [
            r"(?:rbc|red blood cells?)\s*[:\-]?\s*([0-9][0-9,.]*)"
        ],
        "hemoglobin": [
            r"(?:hemoglobin|haemoglobin|hb)\s*[:\-]?\s*([0-9][0-9,.]*)"
        ],
        "hematocrit": [
            r"(?:hematocrit|haematocrit|hct|pcv)\s*[:\-]?\s*([0-9][0-9,.]*)"
        ],
        "mcv": [
            r"(?:mcv|mean corpuscular volume)\s*[:\-]?\s*([0-9][0-9,.]*)"
        ],
        "mch": [
            r"(?:mch|mean corpuscular hemoglobin)\s*[:\-]?\s*([0-9][0-9,.]*)"
        ],
        "mchc": [
            r"(?:mchc|mean corpuscular hemoglobin concentration)\s*[:\-]?\s*([0-9][0-9,.]*)"
        ],
        "neutrophils": [
            r"(?:neutrophils?|neut)\s*[:\-]?\s*([0-9][0-9,.]*)\s*%?"
        ],
        "lymphocytes": [
            r"(?:lymphocytes?|lymph)\s*[:\-]?\s*([0-9][0-9,.]*)\s*%?"
        ]
    }

    data: Dict[str, Number] = {
        "platelets": "N/A",
        "wbc": "N/A",
        "rbc": "N/A",
        "hemoglobin": "N/A",
        "hematocrit": "N/A",
        "mcv": "N/A",
        "mch": "N/A",
        "mchc": "N/A",
        "neutrophils": "N/A",
        "lymphocytes": "N/A",
    }
    for key, expressions in patterns.items():
        for expression in expressions:
            match = re.search(expression, normalized)
            if match:
                data[key] = _clean_number(match.group(1))
                break
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

    if isinstance(platelets, (int, float)):
        if platelets < 50000:
            flags.append({"severity": "critical", "label": "Platelets are dangerously low", "detail": "Bleeding risk can rise at this level. Consult a doctor immediately."})
        elif platelets < 100000:
            flags.append({"severity": "high", "label": "Platelets are lower than normal", "detail": "This can fit dengue or other viral illnesses when fever is present."})
        elif platelets < 150000:
            flags.append({"severity": "moderate", "label": "Platelets are mildly reduced", "detail": "Repeat CBC and correlate with fever, rash, pain, or bleeding symptoms."})

    if isinstance(wbc, (int, float)):
        if wbc < 4000:
            flags.append({"severity": "moderate", "label": "WBC is low", "detail": "Low WBC can appear in viral fever and dengue."})
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
