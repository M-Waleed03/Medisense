# MEDISENSE — App Flow

## Public Pages
- /
- /about
- /features
- /contact
- /login
- /signup

## Protected Pages
- /dashboard
- /symptom-checker
- /report-analysis
- /chatbot
- /history
- /profile
- /settings
- /admin

## Navigation
### Web
- Sticky navbar
- Sidebar navigation
- Floating chatbot button

### Mobile
- Bottom tab navigation
- Slide drawer

## First Screen
Modern animated landing page with:
- 3D medical visuals
- CTA buttons
- Feature highlights

## Authentication Flow
Landing → Signup/Login → Dashboard

## Core Journey 1
1. Login
2. Open symptom checker
3. Select symptoms
4. AI predicts disease
5. Results shown
6. Recommendations saved

## Core Journey 2
1. Upload report
2. OCR extracts data
3. AI analyzes report
4. Dashboard shows insights

## Error States
- Upload failed
- OCR failed
- Invalid login
- Internet disconnected

## Redirects
- After login → /dashboard
- After logout → /
