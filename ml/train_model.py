import csv
from pathlib import Path

import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

ROOT = Path(__file__).resolve().parent
DATASET = ROOT / "training_data" / "symptom_cases.csv"
MODEL_PATH = ROOT / "models" / "symptom_model.joblib"


def load_rows():
    if not DATASET.exists():
        raise SystemExit(f"Missing {DATASET}. See DATASETS.md for dataset preparation.")
    with DATASET.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        rows = [(row["symptoms"].strip().lower(), row["label"].strip()) for row in reader if row.get("symptoms") and row.get("label")]
    if len(rows) < 20:
        raise SystemExit("At least 20 labeled rows are required for a useful train/test split.")
    return rows


def main():
    rows = load_rows()
    texts, labels = zip(*rows)
    x_train, x_test, y_train, y_test = train_test_split(texts, labels, test_size=0.2, random_state=42, stratify=labels)
    model = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1)),
        ("classifier", RandomForestClassifier(n_estimators=320, class_weight="balanced", random_state=42)),
    ])
    model.fit(x_train, y_train)
    predictions = model.predict(x_test)
    print(classification_report(y_test, predictions))
    MODEL_PATH.parent.mkdir(exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"Saved {MODEL_PATH}")


if __name__ == "__main__":
    main()
