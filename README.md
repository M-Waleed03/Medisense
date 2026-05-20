# MEDISENSE

MEDISENSE is a full-stack healthcare MVP with a Next.js web app, Firebase Authentication, Firestore, Cloudinary uploads, a Python FastAPI ML/OCR service, and a Flutter mobile app.

## Services

- `web`: Next.js 15, TypeScript, Tailwind CSS, ShadCN-style UI, Framer Motion, Three.js/React Three Fiber visuals, Recharts, Firebase Auth, Firestore, and secure Cloudinary upload API route.
- `ml`: FastAPI service with trained model loading, symptom prediction, text symptom prediction, Tesseract OCR, OpenCV preprocessing, PDF rendering, report value analysis, and OpenAI/Gemini chatbot routing.
- `mobile`: Flutter app using Firebase Auth, Google login, Firestore, FastAPI, and the web Cloudinary upload route.
- `backend`: legacy Express/Supabase service kept in the repo but not required for the Firebase production MVP.

## Run Locally

```powershell
npm install
npm run dev --workspace web
```

In another terminal:

```powershell
cd ml
.\venv\Scripts\python.exe app.py
```

Open `http://localhost:3000`.

## Environment

The web app loads the repo-root `.env.local` through `web/next.config.ts`.

Required values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_AI_API_URL=http://localhost:8000
OPENAI_API_KEY=
GEMINI_API_KEY=
```

`CLOUDINARY_API_SECRET`, `OPENAI_API_KEY`, and `GEMINI_API_KEY` must stay server-side.

## Firebase

Enable Authentication providers:

- Email/password
- Google

Firestore collections used:

- `users`
- `symptom_checks`
- `text_symptom_checks`
- `medical_reports`
- `report_values`
- `chatbot_messages`
- `recommendations`
- `user_settings`
- `notifications`

Use Firestore security rules so signed-in users can access only documents where `userId == request.auth.uid`, with `users/{uid}` limited to the same authenticated uid.

## Documentation

- Web setup and deployment: `web/README.md`
- FastAPI backend, model loading, OCR, chatbot, endpoints: `ml/README.md`
- Flutter setup: `mobile/README.md`
