# MEDISENSE — Backend Schema

## Table: users
- id (uuid)
- name (text)
- email (text)
- avatar_url (text)
- role (text)
- created_at (timestamp)

## Table: symptoms
- id (uuid)
- user_id (FK → users.id)
- symptom_list (json)
- predicted_disease (text)
- confidence_score (float)
- created_at (timestamp)

## Table: reports
- id (uuid)
- user_id (FK → users.id)
- report_url (text)
- extracted_text (text)
- platelets (integer)
- wbc (integer)
- hemoglobin (float)
- diagnosis (text)
- created_at (timestamp)

## Table: chatbot_messages
- id (uuid)
- user_id (FK → users.id)
- user_message (text)
- ai_response (text)
- created_at (timestamp)

## Relationships
- users → symptoms
- users → reports
- users → chatbot_messages

## Authentication
- Supabase Auth
- JWT tokens

## Roles
### Admin
- Full access

### User
- Personal data only

## Storage
- /reports/{user_id}
- /avatars/{user_id}

## Security
- Row Level Security enabled
- Encrypted sensitive data
