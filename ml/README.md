# MEDISENSE FastAPI ML Backend

FastAPI service for trained model predictions, report OCR, report value analysis, and safe chatbot routing.

## Model Loading

Models are loaded from:

```text
ml/models
```

Supported artifacts:

- `disease_model.pkl`
- `symptom_columns.pkl`
- `disease_label_encoder.pkl`
- `symptom_text_model.pkl`
- `tfidf_vectorizer.pkl`
- `text_label_encoder.pkl`
- `dengue_report_model.pkl`
- `report_columns.pkl`
- `report_label_encoder.pkl`
- `symptom_model.joblib`

If trained model confidence is low, the API applies conservative fallback rules for dengue, malaria, typhoid, anemia, WBC infection signals, and platelet warnings.

## Run

```bash
cd ml
.\venv\Scripts\python.exe app.py
```

Or:

```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

Install dependencies when needed:

```bash
pip install -r requirements.txt
```

OCR requires the Tesseract executable. On Windows, install Tesseract OCR and either add it to PATH or set:

```bash
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
```

`GET /health` reports whether FastAPI can find Tesseract.

## API Endpoints

- `GET /health`
- `POST /predict-symptoms`
- `POST /predict-text-symptoms`
- `POST /analyze-report-values`
- `POST /ocr-report`
- `POST /ocr`
- `POST /chatbot`

All diagnostic responses include:

```text
This is AI-based pre-diagnosis support and not a replacement for professional medical advice.
```

## Chatbot

`POST /chatbot` is local-only for now. It uses the rule engine in `local_chatbot.py`, does not call paid or quota-based chatbot APIs, and returns the required chatbot disclaimer:

```text
This is AI-based guidance and not a replacement for a doctor.
```

The endpoint accepts `message`, optional `userId`, and optional `context`. It can save messages to Firestore when Firebase Admin credentials are configured; otherwise web/mobile clients save the same chat record in Firestore as a fallback.

## Deployment

Deploy as a Python service with the `ml/models` folder included. Configure CORS via:

```bash
CORS_ORIGINS=https://your-web-domain.com,http://localhost:3000
```
