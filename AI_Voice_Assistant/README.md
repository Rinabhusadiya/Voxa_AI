# 🎙️ Voxa AI — Multimodal AI Voice Assistant & Android Integration System

Voxa AI is a production-grade, portfolio-ready **AI Voice Assistant Website + Kotlin Android Integration System**. It combines Web Speech recognition and synthesis with modular FastAPI AI services and a secure Kotlin WebView JavaScript bridge for hardware automation (phone calls, SMS, WhatsApp, device contacts, app launcher, and flashlight).

---

## 🎨 Color System

| Role | Color | Hex Code | Purpose |
| :--- | :--- | :--- | :--- |
| **Primary** | Deep Purple | `#6C4AB6` | Brand identity, primary buttons, hero accents, glows |
| **Secondary** | Cyan Blue | `#20C4D8` | Speech ripples, status pills, audio visualizer, interactive highlights |
| **Accent** | Soft Orange | `#FF9F43` | Quick execution alerts, favorites, badges, notification warnings |

---

## 🚀 Key Features

### 1. Frontend Web Application (HTML5, Vanilla CSS3, ES6 JavaScript)
- **Glassmorphism UI**: High-contrast dark cyber theme with clean light mode toggle.
- **Sound Wave Visualizer**: Dynamic HTML5 Canvas audio wave rendered in real-time.
- **Multi-Language Engine**: Full UI localization and speech recognition in:
  - 🇬🇧 **English** (`en-US` / `en-IN`)
  - 🇮🇳 **Hindi** (`hi-IN`)
  - 🇮🇳 **Gujarati** (`gu-IN`)
- **Web Speech API**: Real-time continuous speech recognition with interim transcription and noise tolerance.
- **SpeechSynthesis TTS**: Voice responses with pitch, rate slider (0.5x to 1.5x), and auto-speak controls.
- **9 Core Views**:
  1. Animated Splash Screen
  2. Home / AI Dashboard (live clock, quick actions, recents)
  3. Voice Assistant (large animated state-driven microphone)
  4. Contacts Directory (search, favorite, call/SMS/WhatsApp triggers)
  5. Command History (audited logs, search, category filter, clear all)
  6. Favorites (one-tap voice shortcut execution cards)
  7. AI Chat Studio (conversational ChatGPT-style UI with TTS speech bubble readout)
  8. Settings (language, voice synthesizer, automation confirmations, privacy reset)
  9. Help & About (command cheat sheet + Android bridge hardware diagnostics)

### 2. Python FastAPI Backend (`backend/`)
- **Pluggable AI Provider Architecture**:
  - `GeminiProvider`: Google Gemini 1.5 Flash structured intent extraction.
  - `OpenAIProvider`: OpenAI GPT-4o-mini alternative.
  - `LocalRuleProvider`: High-accuracy offline multilingual NLU engine supporting English, Hindi, and Gujarati commands without requiring paid cloud API keys.
- **REST Endpoints**:
  - `POST /api/voice/process-command`: Extracts intent, parameters, and TTS response text.
  - `POST /api/voice/chat`: Conversational chat endpoint.
  - `GET /api/contacts`: Address book CRUD.
  - `GET /api/system/status`: Diagnostics and active provider info.

### 3. Android Kotlin Integration (`android/`)
- **Secure JavaScript Bridge (`window.VoxaAndroidBridge`)**:
  - `makePhoneCall(number)`: Native `ACTION_CALL` (or dialer fallback).
  - `sendSMS(number, message)`: Telephony `ACTION_SENDTO`.
  - `sendWhatsApp(number, message)`: Direct package intent.
  - `getContactsJson()`: Queries `ContactsContract.CommonDataKinds.Phone`.
  - `openApp(packageName)`: Launches external apps.
  - `toggleFlashlight(state)`: `CameraManager` torch mode.
  - `getBatteryLevel()`: Device battery capacity.

---

## 🛠️ Project Directory Structure

```text
AI_Voice_Assistant/
├── frontend/
│   ├── index.html                 # Complete SPA Shell (9 views + modals)
│   ├── css/
│   │   ├── style.css              # Master tokens, glassmorphic styling, mic states
│   │   └── responsive.css         # Desktop sidebar + mobile bottom navigation
│   └── js/
│       ├── i18n.js                # English, Hindi, Gujarati localization dictionary
│       ├── android-bridge.js      # JS Bridge adapter (native bridge + web fallback)
│       ├── visualizer.js          # Dynamic multi-layer canvas sound wave visualizer
│       ├── voice.js               # Web Speech API recognition & SpeechSynthesis TTS
│       ├── commands.js            # Multilingual command parser & action dispatcher
│       ├── contacts.js            # Contacts manager & address book
│       ├── history.js             # Command history logger & category filter
│       ├── favorites.js           # 1-tap favorite command shortcuts
│       ├── chat.js                # Conversational AI chat studio
│       ├── firebase-config.js     # Firebase Auth & Firestore client layer
│       └── app.js                 # App bootstrap, SPA router, modals & toasts
│
├── backend/
│   ├── main.py                    # FastAPI application & static mount
│   ├── requirements.txt           # Python dependencies
│   ├── .env.example               # Environment template
│   ├── config/settings.py         # Pydantic environment configuration
│   ├── models/schemas.py          # Pydantic request/response models
│   ├── services/ai_service.py     # Modular AI providers (Gemini/OpenAI/Local)
│   └── routes/
│       ├── voice_routes.py        # /api/voice endpoints
│       └── contacts_routes.py     # /api/contacts endpoints
│
├── android/
│   ├── app/src/main/
│   │   ├── AndroidManifest.xml    # Android permissions (Contacts, Call, SMS, Camera)
│   │   ├── java/com/voxa/ai/
│   │   │   ├── MainActivity.kt    # WebView setup & permission pipeline
│   │   │   └── bridge/
│   │   │       └── VoxaWebInterface.kt # @JavascriptInterface hardware bridge
│   │   └── res/layout/activity_main.xml
│   ├── build.gradle.kts
│   └── README.md                  # Android Studio setup guide
│
├── run_backend.py                 # Quick Python runner script
└── README.md                      # Complete system documentation
```

---

## 🚀 Quick Start Guide

### 1. Run the Backend & Website
1. Start the FastAPI backend:
   ```bash
   python run_backend.py
   ```
2. Open your web browser to:
   ```text
   http://localhost:8005
   ```
   *The backend automatically serves the frontend at the root URL! You can also open `frontend/index.html` directly in Chrome or Edge.*

### 2. (Optional) Configure Cloud AI API Keys
In `backend/.env`:
```ini
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
```
*Note: If no API key is set, Voxa AI automatically uses its built-in multilingual NLU engine with zero errors.*

### 3. Run the Android App
1. Open Android Studio and import the `android/` directory.
2. In `MainActivity.kt`, verify the target URL points to `http://10.0.2.2:8005` (for emulator) or your machine's local IP address (for physical device).
3. Click **Run** in Android Studio to test on an emulator or Android phone.

---

## 🗣️ Sample Voice Commands

### English 🇬🇧
- *"Call Mom"*
- *"Open YouTube"*
- *"Search YouTube for Python tutorial"*
- *"Search Google for Django tutorial"*
- *"Send WhatsApp message to Rahul"*
- *"Navigate to Ahmedabad"*
- *"What is the weather today?"*
- *"What time is it?"*
- *"Set a timer for 10 minutes"*
- *"Turn on flashlight"*

### Hindi 🇮🇳
- *"Mummy ko call karo"*
- *"YouTube kholo"*
- *"YouTube par Python tutorial search karo"*
- *"Rahul ko message karo"*
- *"Google par Python search karo"*
- *"Ahmedabad ka rasta dikhao"*
- *"Aaj mausam kaisa hai?"*
- *"Kitne baje hain?"*

### Gujarati 🇮🇳
- *"મમ્મીને ફોન કરો"*
- *"યુટ્યુબ ખોલો"*
- *"યુટ્યુબ પર પાયથોન શોધો"*
- *"રાહુલને મેસેજ કરો"*
- *"ગૂગલ પર પાયથોન શોધો"*
- *"અમદાવાદનો રસ્તો બતાવો"*
- *"આજનું હવામાન કેવું છે?"*
- *"કેટલા વાગ્યા છે?"*
