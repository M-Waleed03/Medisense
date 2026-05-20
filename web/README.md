# MEDISENSE Web App

Next.js production MVP for Firebase Auth, Firestore data, Cloudinary uploads, FastAPI ML predictions, OCR report analysis, chatbot, profile, dashboard, and settings.

## Setup

The web app loads the repo-root `.env.local` through `web/next.config.ts`.

Required values:

```bash
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
```

Do not expose `CLOUDINARY_API_SECRET` in client code. Uploads go through `src/app/api/cloudinary-upload/route.ts`.

## Run

```bash
npm install
npm run dev --workspace web
```

Start FastAPI separately:

```bash
cd ml
.\venv\Scripts\python.exe app.py
```

## Firebase

Enable Email/Password and Google providers in Firebase Authentication.

Firestore collections used by the app:

- `users`
- `symptom_checks`
- `text_symptom_checks`
- `medical_reports`
- `report_values`
- `chatbot_messages`
- `recommendations`
- `user_settings`
- `notifications`

Every write includes `userId` plus `createdAt`/`updatedAt` where applicable.

## Deploy

Deploy the web app to Vercel/Node hosting with the same env vars. Set `NEXT_PUBLIC_AI_API_URL` to the deployed FastAPI URL.
