/**
 * Voxa AI - Natural Language Command Parser & Action Dispatcher
 * Multilingual engine supporting English, Hindi, and Gujarati.
 * Tightly coupled with Android Bridge, Contacts Manager, and FastAPI Backend.
 */

const CommandDispatcher = {
    BACKEND_URL: (typeof window !== "undefined" && window.location.origin && window.location.origin.startsWith("http")) 
        ? window.location.origin 
        : "http://localhost:8005",

    async processCommand(rawCommandText) {
        if (!rawCommandText || !rawCommandText.trim()) return;

        const command = rawCommandText.trim();
        const lang = I18N.currentLang || "en";

        // Dispatch status update
        window.dispatchEvent(new CustomEvent("voxa_command_started", { detail: { command } }));

        let intentData = null;

        // Try FastAPI backend first for deep AI reasoning
        try {
            const res = await fetch(`${this.BACKEND_URL}/api/voice/process-command`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    command,
                    language: lang,
                    is_android: AndroidBridge.isAvailable()
                })
            });

            if (res.ok) {
                intentData = await res.json();
            }
        } catch (e) {
            // Backend offline or unreachable - fallback to internal browser parser
            console.log("Backend API not reachable. Using client-side multilingual parser.", e);
        }

        // Client-side fallback parser if backend was unavailable
        if (!intentData) {
            intentData = this.parseLocally(command, lang);
        }

        // Execute recognized action
        await this.executeAction(intentData, command);
        return intentData;
    },

    parseLocally(command, lang) {
        const text = command.toLowerCase();

        // 1. CALL
        if (
            text.includes("call") || text.includes("phone") || text.includes("dial") ||
            text.includes("કોલ") || text.includes("ફોન") ||
            text.includes("call karo") || text.includes("phone lagao")
        ) {
            let target = text
                .replace(/^(call|dial|phone|make a call to|please call)\s+/i, "")
                .replace(/\s*(ko call karo|ko phone lagao|ne call karo|ને કોલ કરો|ને ફોન કરો)$/i, "")
                .replace(/^(to|my)\s+/i, "")
                .trim();
            if (!target) target = "Mom";

            const speakMap = {
                en: `Found ${target}. Do you want to call now?`,
                hi: `${target} ko call lagane ke liye pushti karein.`,
                gu: `${target} ને કોલ કરવા પુષ્ટિ કરો.`
            };

            return {
                recognized_intent: "call_contact",
                action_type: "phone",
                parameters: { target },
                speak_text: speakMap[lang] || speakMap.en,
                display_text: `📞 **Call Request**: ${target}`,
                requires_confirmation: true
            };
        }

        // 2. WHATSAPP
        if (text.includes("whatsapp") || text.includes("વ્હોટ્સએપ")) {
            let target = text
                .replace(/.*?(whatsapp|વ્હોટ્સએપ)\s*(message\s*)?(to\s*)?/i, "")
                .replace(/\s*(ko|ne|ને|saying|bolkar).*/i, "")
                .trim() || "Rahul";

            return {
                recognized_intent: "send_whatsapp",
                action_type: "message",
                parameters: { target, message: "" },
                speak_text: `Preparing WhatsApp message for ${target}.`,
                display_text: `💬 **WhatsApp**: ${target}`,
                requires_confirmation: true
            };
        }

        // 3. SMS
        if (text.includes("sms") || text.includes("message") || text.includes("ટેક્સ્ટ") || text.includes("મેસેજ")) {
            let target = text
                .replace(/.*?(send\s+)?(sms|message|text)\s*(to\s*)?/i, "")
                .replace(/\s*(ko|ne|ને|saying).*/i, "")
                .trim() || "Rahul";

            return {
                recognized_intent: "send_sms",
                action_type: "message",
                parameters: { target, message: "" },
                speak_text: `Preparing SMS for ${target}.`,
                display_text: `✉️ **SMS**: ${target}`,
                requires_confirmation: true
            };
        }

        // 4. YOUTUBE
        if (text.includes("youtube") || text.includes("યુટ્યુબ")) {
            const query = text
                .replace(/.*?(search|play|for|par|ખોલો|શોધો)\s+(youtube\s+for\s+)?/i, "")
                .replace(/\s*(on youtube|youtube par|યુટ્યુબ પર|kholo|ખોલો)$/i, "")
                .replace(/^(youtube|યુટ્યુબ)$/i, "")
                .trim();

            if (!query || query === "open" || query === "kholo" || query === "ખોલો") {
                return {
                    recognized_intent: "open_youtube",
                    action_type: "app",
                    parameters: { url: "https://www.youtube.com", package: "com.google.android.youtube" },
                    speak_text: "Opening YouTube.",
                    display_text: "▶️ **Opening YouTube**"
                };
            }

            return {
                recognized_intent: "search_youtube",
                action_type: "web",
                parameters: {
                    query,
                    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
                    package: "com.google.android.youtube"
                },
                speak_text: `Searching YouTube for ${query}.`,
                display_text: `▶️ **Searching YouTube**: ${query}`
            };
        }

        // 5. GOOGLE SEARCH
        if (text.includes("google") || text.includes("ગૂગલ")) {
            const query = text
                .replace(/.*?(search|for|par|શોધો)\s+(google\s+for\s+)?/i, "")
                .replace(/\s*(on google|google par|ગૂગલ પર|kholo|ખોલો)$/i, "")
                .replace(/^(google|ગૂગલ)$/i, "")
                .trim();

            if (!query || query === "open" || query === "kholo" || query === "ખોલો") {
                return {
                    recognized_intent: "open_google",
                    action_type: "web",
                    parameters: { url: "https://www.google.com" },
                    speak_text: "Opening Google.",
                    display_text: "🌐 **Opening Google**"
                };
            }

            return {
                recognized_intent: "search_google",
                action_type: "web",
                parameters: { query, url: `https://www.google.com/search?q=${encodeURIComponent(query)}` },
                speak_text: `Searching Google for ${query}.`,
                display_text: `🔍 **Google Search**: ${query}`
            };
        }

        // 6. MAPS
        if (text.includes("map") || text.includes("navigate") || text.includes("મેપ") || text.includes("rasta")) {
            const destMatch = text.match(/(?:to|dikhao|બતાવો)\s+([a-zA-Z\s]+)/i);
            const destination = destMatch ? destMatch[1].trim() : "";
            if (destination) {
                return {
                    recognized_intent: "navigate_maps",
                    action_type: "web",
                    parameters: {
                        destination,
                        url: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`,
                        package: "com.google.android.apps.maps"
                    },
                    speak_text: `Navigating to ${destination}.`,
                    display_text: `🗺️ **Navigating to**: ${destination}`
                };
            }
            return {
                recognized_intent: "open_maps",
                action_type: "app",
                parameters: { url: "https://maps.google.com", package: "com.google.android.apps.maps" },
                speak_text: "Opening Google Maps.",
                display_text: "🗺️ **Opening Google Maps**"
            };
        }

        // 7. TIME / DATE
        if (text.includes("time") || text.includes("clock") || text.includes("વાગ્યા") || text.includes("samay") || text.includes("date")) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
            return {
                recognized_intent: "get_time",
                action_type: "system",
                parameters: { time: timeStr, date: dateStr },
                speak_text: `The time is ${timeStr}, and today is ${dateStr}.`,
                display_text: `⏰ **Current Time**: ${timeStr}  \n📅 **Date**: ${dateStr}`
            };
        }

        // 8. WEATHER
        if (text.includes("weather") || text.includes("mausam") || text.includes("હવામાન")) {
            return {
                recognized_intent: "get_weather",
                action_type: "system",
                parameters: { temperature: "28°C", condition: "Sunny" },
                speak_text: "Today's forecast is mostly sunny and pleasant with a temperature of 28 degrees Celsius.",
                display_text: "☀️ **Weather**: 28°C, Mostly Sunny and pleasant."
            };
        }

        // 9. TIMER
        if (text.includes("timer") || text.includes("ટાઈમર")) {
            const numMatch = text.match(/(\d+)\s*(?:minute|min|sec|second)/i);
            const minutes = numMatch ? parseInt(numMatch[1], 10) : 10;
            return {
                recognized_intent: "set_timer",
                action_type: "system",
                parameters: { minutes },
                speak_text: `Timer set for ${minutes} minutes.`,
                display_text: `⏱️ **Timer Active**: ${minutes} minutes countdown started.`
            };
        }

        // 10. FLASHLIGHT
        if (text.includes("flashlight") || text.includes("torch") || text.includes("ટોર્ચ")) {
            const turnOn = !text.includes("off") && !text.includes("band") && !text.includes("બંધ");
            return {
                recognized_intent: "toggle_flashlight",
                action_type: "system",
                parameters: { state: turnOn },
                speak_text: `Turning flashlight ${turnOn ? "on" : "off"}.`,
                display_text: `🔦 **Flashlight**: ${turnOn ? "ON" : "OFF"}`
            };
        }

        // 11. GENERAL AI / KNOWLEDGE
        if (text.includes("python") || text.includes("પાયથોન")) {
            return {
                recognized_intent: "general_knowledge",
                action_type: "ai",
                parameters: { topic: "Python" },
                speak_text: "Python is a versatile high-level programming language widely used in AI, data science, and web development.",
                display_text: "🐍 **Python**: A high-level, dynamically typed language known for clarity, powering AI, web backends, and scientific computing."
            };
        }

        // DEFAULT WEB SEARCH
        return {
            recognized_intent: "search_google",
            action_type: "web",
            parameters: { query: command, url: `https://www.google.com/search?q=${encodeURIComponent(command)}` },
            speak_text: `Searching for ${command}.`,
            display_text: `🔍 **Search**: ${command}`
        };
    },

    async executeAction(intentData, rawCommand) {
        const { recognized_intent, action_type, parameters, speak_text, display_text, requires_confirmation } = intentData;

        // Update UI result container
        window.dispatchEvent(new CustomEvent("voxa_display_response", {
            detail: {
                command: rawCommand,
                displayText: display_text,
                speakText: speak_text,
                intent: recognized_intent,
                actionType: action_type
            }
        }));

        // Handle Confirmation modals if required (Calling / Messaging)
        const confirmCallingSetting = localStorage.getItem("voxa_confirm_call") !== "false";
        const confirmMsgSetting = localStorage.getItem("voxa_confirm_msg") !== "false";

        if (recognized_intent === "call_contact") {
            const target = parameters.target || "Someone";
            const contact = window.ContactsManager?.findContact(target) || { name: target, phone: target };

            if (confirmCallingSetting || requires_confirmation) {
                window.dispatchEvent(new CustomEvent("voxa_show_call_confirm", { detail: { contact } }));
                VoiceEngine.speak(speak_text);
            } else {
                AndroidBridge.makePhoneCall(contact.phone);
                VoiceEngine.speak(`Calling ${contact.name}`);
            }

            this.logHistory(rawCommand, "phone", `Call ${contact.name}`, "Success");
            return;
        }

        if (recognized_intent === "send_whatsapp") {
            const target = parameters.target || "Rahul";
            const contact = window.ContactsManager?.findContact(target) || { name: target, phone: "+91 98250 12345" };

            if (confirmMsgSetting || requires_confirmation) {
                window.dispatchEvent(new CustomEvent("voxa_show_msg_modal", {
                    detail: { type: "whatsapp", contact, message: parameters.message || "" }
                }));
                VoiceEngine.speak(speak_text);
            } else {
                AndroidBridge.sendWhatsApp(contact.phone, parameters.message || "Hello from Voxa AI");
            }

            this.logHistory(rawCommand, "message", `WhatsApp ${contact.name}`, "Success");
            return;
        }

        if (recognized_intent === "send_sms") {
            const target = parameters.target || "Rahul";
            const contact = window.ContactsManager?.findContact(target) || { name: target, phone: "+91 98250 12345" };

            if (confirmMsgSetting || requires_confirmation) {
                window.dispatchEvent(new CustomEvent("voxa_show_msg_modal", {
                    detail: { type: "sms", contact, message: parameters.message || "" }
                }));
                VoiceEngine.speak(speak_text);
            } else {
                AndroidBridge.sendSMS(contact.phone, parameters.message || "Hello from Voxa AI");
            }

            this.logHistory(rawCommand, "message", `SMS ${contact.name}`, "Success");
            return;
        }

        // Web & App links
        if (action_type === "web" || action_type === "app") {
            VoiceEngine.speak(speak_text, () => {
                if (parameters.package && AndroidBridge.isAvailable()) {
                    AndroidBridge.launchApp(parameters.package, parameters.url);
                } else if (parameters.url) {
                    window.open(parameters.url, "_blank", "noopener,noreferrer");
                }
            });
            this.logHistory(rawCommand, action_type, display_text.replace(/[\*\#]/g, ''), "Success");
            return;
        }

        // Device Controls
        if (recognized_intent === "toggle_flashlight") {
            const state = parameters.state;
            await AndroidBridge.toggleFlashlight(state);
            VoiceEngine.speak(speak_text);
            this.logHistory(rawCommand, "system", `Flashlight ${state ? 'ON' : 'OFF'}`, "Success");
            return;
        }

        if (recognized_intent === "set_timer") {
            const mins = parameters.minutes || 10;
            this.startLocalTimer(mins);
            VoiceEngine.speak(speak_text);
            this.logHistory(rawCommand, "system", `Timer ${mins} mins`, "Success");
            return;
        }

        // General AI / Speak
        VoiceEngine.speak(speak_text);
        this.logHistory(rawCommand, action_type || "ai", display_text.replace(/[\*\#]/g, ''), "Success");
    },

    startLocalTimer(minutes) {
        const ms = minutes * 60 * 1000;
        window.dispatchEvent(new CustomEvent("voxa_toast", {
            detail: { type: "info", message: `⏱️ Timer started for ${minutes} minute(s).` }
        }));

        setTimeout(() => {
            window.dispatchEvent(new CustomEvent("voxa_toast", {
                detail: { type: "success", message: `🔔 Timer for ${minutes} minute(s) has finished!` }
            }));
            VoiceEngine.speak(`Time's up! Your ${minutes} minute timer has completed.`);
        }, ms);
    },

    logHistory(command, category, result, status) {
        if (window.HistoryManager) {
            window.HistoryManager.addEntry({
                command,
                category,
                result,
                status,
                timestamp: new Date().toISOString()
            });
        }
    }
};

window.CommandDispatcher = CommandDispatcher;
