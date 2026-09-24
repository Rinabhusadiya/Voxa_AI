/**
 * Voxa AI - Android Bridge Client Adapter
 * Manages communication between Web Frontend and Kotlin Android WebView Interface.
 * Gracefully provides web fallbacks when running in standard desktop/mobile browsers.
 */

const AndroidBridge = {
    BRIDGE_NAME: "VoxaAndroidBridge",

    isAvailable() {
        return typeof window[this.BRIDGE_NAME] !== "undefined" && window[this.BRIDGE_NAME] !== null;
    },

    getEnvironmentInfo() {
        const hasNative = this.isAvailable();
        return {
            isNativeAndroid: hasNative,
            environment: hasNative ? "Kotlin Native WebView" : "Web Browser Sandbox",
            bridgeVersion: hasNative ? (window[this.BRIDGE_NAME].getBridgeVersion?.() || "1.0.0") : "N/A (Web Fallback)",
            capabilities: {
                directCalling: hasNative,
                directSms: hasNative,
                deviceContacts: hasNative,
                hardwareFlashlight: hasNative,
                appLauncher: hasNative
            }
        };
    },

    /**
     * Start Phone Call
     * Uses Android Intent.ACTION_CALL in app, or tel: protocol in browser.
     */
    async makePhoneCall(phoneNumber) {
        const cleanNumber = phoneNumber.replace(/[^0-9\+]/g, "");
        if (this.isAvailable() && typeof window[this.BRIDGE_NAME].makePhoneCall === "function") {
            try {
                window[this.BRIDGE_NAME].makePhoneCall(cleanNumber);
                return { success: true, mode: "native_intent", message: `Calling ${cleanNumber} via Android Intent.` };
            } catch (err) {
                console.error("Android bridge call error:", err);
            }
        }

        // Web Browser Fallback
        window.location.href = `tel:${cleanNumber}`;
        return {
            success: true,
            mode: "web_fallback",
            message: `Initiating call via browser dialer (${cleanNumber}). Native in-app calling enabled in Voxa Android App.`
        };
    },

    /**
     * Send SMS Message
     * Uses Android Telephony / ACTION_SENDTO in app, or sms: protocol in browser.
     */
    async sendSMS(phoneNumber, message = "") {
        const cleanNumber = phoneNumber.replace(/[^0-9\+]/g, "");
        if (this.isAvailable() && typeof window[this.BRIDGE_NAME].sendSMS === "function") {
            try {
                const res = window[this.BRIDGE_NAME].sendSMS(cleanNumber, message);
                return { success: true, mode: "native_intent", message: `SMS intent dispatched to ${cleanNumber}.` };
            } catch (err) {
                console.error("Android bridge SMS error:", err);
            }
        }

        // Web Browser Fallback
        const smsUrl = `sms:${cleanNumber}?body=${encodeURIComponent(message)}`;
        window.location.href = smsUrl;
        return {
            success: true,
            mode: "web_fallback",
            message: `Opening SMS app with draft message for ${cleanNumber}.`
        };
    },

    /**
     * Send WhatsApp Message
     * Uses WhatsApp Package Intent in Android, or https://wa.me/ in browser.
     */
    async sendWhatsApp(phoneNumber, message = "") {
        const cleanNumber = phoneNumber.replace(/[^0-9]/g, "");
        if (this.isAvailable() && typeof window[this.BRIDGE_NAME].sendWhatsApp === "function") {
            try {
                window[this.BRIDGE_NAME].sendWhatsApp(cleanNumber, message);
                return { success: true, mode: "native_intent", message: "WhatsApp launched via Android Intent." };
            } catch (err) {
                console.error("Android bridge WhatsApp error:", err);
            }
        }

        // Web Browser Fallback
        const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, "_blank", "noopener,noreferrer");
        return {
            success: true,
            mode: "web_fallback",
            message: "Opened WhatsApp Web / App intent in new tab."
        };
    },

    /**
     * Query Device Contacts
     * Returns JSON array from Kotlin ContactsContract in Android, or null in browser.
     */
    async getDeviceContacts() {
        if (this.isAvailable() && typeof window[this.BRIDGE_NAME].getContactsJson === "function") {
            try {
                const jsonStr = window[this.BRIDGE_NAME].getContactsJson();
                const contacts = JSON.parse(jsonStr || "[]");
                return { success: true, contacts, count: contacts.length, mode: "native_contacts_api" };
            } catch (err) {
                console.error("Failed to fetch device contacts via Android Bridge:", err);
            }
        }

        return {
            success: false,
            contacts: [],
            mode: "browser_sandbox",
            message: "Device contacts require the Voxa Android Application with READ_CONTACTS permission."
        };
    },

    /**
     * Launch External Android App
     */
    async launchApp(packageName, fallbackUrl = "") {
        if (this.isAvailable() && typeof window[this.BRIDGE_NAME].openApp === "function") {
            try {
                const launched = window[this.BRIDGE_NAME].openApp(packageName);
                if (launched) {
                    return { success: true, mode: "native_app_launcher" };
                }
            } catch (err) {
                console.error("Android bridge openApp error:", err);
            }
        }

        // Web fallback
        if (fallbackUrl) {
            window.open(fallbackUrl, "_blank", "noopener,noreferrer");
            return { success: true, mode: "web_redirect" };
        }
        return { success: false, message: "App launcher requires the Android App." };
    },

    /**
     * Toggle Device Hardware Flashlight
     */
    async toggleFlashlight(state) {
        if (this.isAvailable() && typeof window[this.BRIDGE_NAME].toggleFlashlight === "function") {
            try {
                const result = window[this.BRIDGE_NAME].toggleFlashlight(Boolean(state));
                return { success: result, mode: "native_camera_torch", state };
            } catch (err) {
                console.error("Android bridge flashlight error:", err);
            }
        }

        return {
            success: true,
            mode: "web_simulation",
            state,
            message: `Flashlight switched ${state ? "ON" : "OFF"} (Hardware control active in Android App).`
        };
    },

    /**
     * Get Device Battery Info
     */
    async getBatteryLevel() {
        if (this.isAvailable() && typeof window[this.BRIDGE_NAME].getBatteryLevel === "function") {
            try {
                const level = window[this.BRIDGE_NAME].getBatteryLevel();
                return { level, isNative: true };
            } catch (err) {
                console.error("Android bridge battery error:", err);
            }
        }

        if (navigator.getBattery) {
            try {
                const battery = await navigator.getBattery();
                return { level: Math.round(battery.level * 100), charging: battery.charging, isNative: false };
            } catch (e) {
                // Ignore
            }
        }

        return { level: 85, isNative: false };
    }
};

window.AndroidBridge = AndroidBridge;
