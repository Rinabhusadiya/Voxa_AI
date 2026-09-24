# Voxa AI - Android Native Integration (Kotlin)

This directory contains the production-ready Android Studio project for **Voxa AI**, featuring a two-way JavaScript Bridge (`window.VoxaAndroidBridge`) connecting the web frontend with native Android hardware and telephony APIs.

---

## Key Features

1. **Native Telephony & Dialer (`ACTION_CALL` / `ACTION_DIAL`)**:
   - Executes phone calls initiated via voice commands (e.g. *"Call Mom"*).
   - Validates `CALL_PHONE` runtime permission.

2. **Telephony SMS Intent (`ACTION_SENDTO`)**:
   - Opens Android SMS composer with recipient and draft message pre-filled.

3. **WhatsApp Intent Dispatch**:
   - Directs message delivery to WhatsApp package if installed, with web fallback.

4. **ContactsContract Integration**:
   - Queries the device address book securely upon user consent (`READ_CONTACTS`).
   - Streams contact lists into the WebView as clean JSON for instant voice matching.

5. **Hardware Flashlight Control**:
   - Directly toggles the device camera torch using `CameraManager.setTorchMode()`.

6. **External App Launcher**:
   - Launches external installed apps (YouTube, Maps, Instagram) via Android `PackageManager`.

---

## How to Run in Android Studio

### 1. Prerequisites
- **Android Studio Iguana / Jellyfish** or newer
- **Android SDK** API 26+ (target SDK 34)
- **Host Backend Running**: Start the FastAPI backend on your computer:
  ```bash
  python run_backend.py
  ```

### 2. Open Project
1. Open Android Studio.
2. Select **File > Open** and choose the `android/` directory.
3. Allow Gradle to sync dependencies.

### 3. Configure Target URL
In `MainActivity.kt`:
```kotlin
// For Android Emulator (10.0.2.2 automatically routes to localhost on host PC):
private val appUrl = "http://10.0.2.2:8005"

// For Physical Android Device on the same Wi-Fi network:
// private val appUrl = "http://<YOUR_LOCAL_IP>:8005"
```

### 4. Build and Run
- Select an emulator or connected physical Android device.
- Click **Run (Shift + F10)**.
- When prompted, grant permissions for Microphone, Contacts, and Phone Calls.
