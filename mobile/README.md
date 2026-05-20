# MEDISENSE Flutter App

Flutter MVP using Firebase Auth, Google login, Firestore data, FastAPI predictions, web Cloudinary upload route, dashboard, symptom checker, text prediction, report upload, chatbot, profile, and settings.

## Setup

Install Flutter dependencies:

```bash
flutter pub get
```

Add Firebase platform files with FlutterFire, or pass Firebase options through `--dart-define`.

Example:

```bash
flutter run ^
  --dart-define=FIREBASE_API_KEY=... ^
  --dart-define=FIREBASE_AUTH_DOMAIN=... ^
  --dart-define=FIREBASE_PROJECT_ID=... ^
  --dart-define=FIREBASE_STORAGE_BUCKET=... ^
  --dart-define=FIREBASE_MESSAGING_SENDER_ID=... ^
  --dart-define=FIREBASE_APP_ID=... ^
  --dart-define=AI_API_URL=http://localhost:8000 ^
  --dart-define=WEB_API_URL=http://localhost:3000
```

`WEB_API_URL` is used only for secure Cloudinary upload signing through the Next.js API route.

## Firebase

Enable Email/Password and Google login. Firestore uses the same collections as the web app:

- `users`
- `symptom_checks`
- `text_symptom_checks`
- `medical_reports`
- `report_values`
- `chatbot_messages`
- `user_settings`
- `notifications`

## Notes

For Android emulator, use host machine URLs such as `http://10.0.2.2:8000` and `http://10.0.2.2:3000`.
