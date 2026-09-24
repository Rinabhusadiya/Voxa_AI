/**
 * Voxa AI - Internationalization (i18n) Engine
 * Full UI translation & speech codes for English, Hindi, and Gujarati.
 */

const I18N = {
    currentLang: "en",

    speechCodes: {
        en: { recognition: "en-US", synth: "en-US", name: "English" },
        hi: { recognition: "hi-IN", synth: "hi-IN", name: "हिन्दी (Hindi)" },
        gu: { recognition: "gu-IN", synth: "gu-IN", name: "ગુજરાતી (Gujarati)" }
    },

    translations: {
        en: {
            appName: "Voxa AI",
            tagline: "Your Intelligent Voice Assistant",
            splashSubtitle: "Next-Generation Multimodal Voice AI & Device Automation",
            startNow: "Get Started",
            skip: "Skip",

            // Navigation
            navDashboard: "Dashboard",
            navVoice: "Voice Assistant",
            navContacts: "Contacts",
            navHistory: "History",
            navFavorites: "Favorites",
            navChat: "AI Chat",
            navSettings: "Settings",
            navHelp: "Help & About",

            // Dashboard
            greetingMorning: "Good morning",
            greetingAfternoon: "Good afternoon",
            greetingEvening: "Good evening",
            tapToSpeak: "Tap to Speak",
            listeningNow: "Listening to your voice...",
            aiStatusOnline: "AI Engine Online",
            bridgeWeb: "Browser Mode",
            bridgeAndroid: "Android Native Bridge Active",
            quickActions: "Quick Actions",
            recentCommands: "Recent Voice Commands",
            favoriteCommands: "Favorite Shortcuts",
            recentContacts: "Recent Contacts",

            // Quick actions
            qaCall: "Call Contact",
            qaYouTube: "Open YouTube",
            qaGoogle: "Search Google",
            qaMessage: "Send Message",
            qaMaps: "Open Maps",
            qaReminder: "Set Reminder",

            // Voice Assistant View
            micIdle: "Tap to Speak",
            micListening: "Listening...",
            micProcessing: "Understanding...",
            micSpeaking: "Speaking...",
            trySaying: "Try saying:",
            transcriptPlaceholder: "Your transcribed voice command will appear here...",
            responsePlaceholder: "Voxa's intelligent response will display here...",
            playAudio: "Play",
            pauseAudio: "Pause",
            stopAudio: "Stop",
            voiceSpeed: "Voice Speed",

            // Contacts
            contactsTitle: "Contacts Directory",
            searchContacts: "Search contacts by name or number...",
            addNewContact: "Add Contact",
            syncDeviceContacts: "Sync Device Contacts",
            callNow: "Call",
            sendSms: "SMS",
            sendWhatsApp: "WhatsApp",
            favorite: "Favorite",
            noContactsFound: "No contacts found matching your search.",
            allContacts: "All Contacts",
            favoriteContacts: "Favorites Only",

            // Call Confirmation Modal
            callConfirmationTitle: "Confirm Phone Call",
            callConfirmationPrompt: "Do you want to start a phone call to:",
            confirmCallBtn: "Call Now",
            cancelBtn: "Cancel",

            // Message Modal
            msgModalTitle: "Send Message",
            msgRecipientLabel: "Recipient:",
            msgTextLabel: "Message Content:",
            msgPlaceholder: "Type your message here...",
            sendBtn: "Send Now",

            // Command History
            historyTitle: "Command Activity History",
            searchHistory: "Search history records...",
            filterCategory: "Filter by category",
            allCategories: "All Categories",
            catPhone: "Phone",
            catMessage: "Message",
            catApp: "App Launch",
            catWeb: "Web Search",
            catSystem: "System & Device",
            catAI: "AI Knowledge",
            clearHistory: "Clear All History",
            noHistory: "No command activity recorded yet.",
            statusSuccess: "Success",
            statusPending: "Pending",
            statusFailed: "Failed",

            // Favorites
            favoritesTitle: "Quick Execution Shortcuts",
            addFavorite: "Add Shortcut",
            noFavorites: "You haven't saved any favorite commands yet.",
            runNow: "Run",

            // AI Chat
            chatTitle: "Conversational AI Studio",
            chatSubtitle: "Chat with Voxa AI using voice or text",
            chatPlaceholder: "Ask Voxa anything (e.g. 'Explain Quantum Computing' or 'How do I cook pasta?')...",
            clearChat: "Clear Conversation",
            copyMessage: "Copy",
            readAloud: "Read Aloud",

            // Settings
            settingsTitle: "Voxa System Settings",
            secAccount: "Account & Profile",
            secVoice: "Voice & Speech Engine",
            secAssistant: "Assistant Automation",
            secAppearance: "Appearance & Theme",
            secPrivacy: "Privacy & Permissions",

            lblLanguage: "Interface & Speech Language",
            lblVoiceSelect: "Synthesizer Voice",
            lblSpeechRate: "Speech Rate Speed",
            lblAutoSpeak: "Auto-Speak Responses",
            lblWakeWord: "Wake Word Detection ('Hey Voxa')",
            lblCallConfirm: "Require Confirmation Before Calling",
            lblMsgConfirm: "Require Confirmation Before Messaging",
            lblContinuousListening: "Continuous Auto-Listening Mode",
            lblTheme: "Color Theme",
            themeDark: "Dark Cyber (Recommended)",
            themeLight: "Clean Light",

            permMic: "Microphone Access",
            permContacts: "Contacts Access",
            permGranted: "Granted",
            permDenied: "Denied / Prompt Required",
            clearAllData: "Reset All Local Data",

            // Help
            helpTitle: "Help, Commands & System Diagnostics",
            commandsCheatSheet: "Voice Commands Cheat Sheet",
            androidBridgeStatus: "Android Bridge Diagnostics",

            // Toasts & Errors
            micDeniedToast: "Microphone access was denied. Please allow microphone permissions in your browser.",
            micNotSupportedToast: "Speech recognition is not supported in this browser. Please use Chrome, Edge, or the Android App.",
            copiedToast: "Copied to clipboard!",
            contactAddedToast: "Contact added successfully.",
            historyClearedToast: "History cleared successfully."
        },

        hi: {
            appName: "વોક્ષા AI (Voxa AI)",
            tagline: "आपका बुद्धिमान वॉयस असिस्टेंट",
            splashSubtitle: "अगली पीढ़ी का मल्टीमॉडल वॉयस AI और डिवाइस ऑटोमेशन",
            startNow: "शुरू करें",
            skip: "आगे बढ़ें",

            navDashboard: "डैशबोर्ड",
            navVoice: "वॉयस असिस्टेंट",
            navContacts: "संपर्क (Contacts)",
            navHistory: "इतिहास (History)",
            navFavorites: "पसंदीदा (Favorites)",
            navChat: "AI चैट",
            navSettings: "सेटिंग्स",
            navHelp: "मदद व जानकारी",

            greetingMorning: "सुप्रभात",
            greetingAfternoon: "शुभ दोपहर",
            greetingEvening: "शुभ संध्या",
            tapToSpeak: "बोलने के लिए टैप करें",
            listeningNow: "आपकी आवाज़ सुन रहे हैं...",
            aiStatusOnline: "AI इंजन सक्रिय",
            bridgeWeb: "ब्राउज़र मोड",
            bridgeAndroid: "एंड्रॉइड नेटिव ब्रिज चालू",
            quickActions: "त्वरित क्रियाएं",
            recentCommands: "हाल के वॉयस कमांड",
            favoriteCommands: "पसंदीदा शॉर्टकट",
            recentContacts: "हाल के संपर्क",

            qaCall: "कॉल करें",
            qaYouTube: "YouTube खोलें",
            qaGoogle: "Google खोजें",
            qaMessage: "संदेश भेजें",
            qaMaps: "Maps खोलें",
            qaReminder: "रिमाइंडर लगाएं",

            micIdle: "बोलने के लिए माइक पर टैप करें",
            micListening: "सुन रहे हैं...",
            micProcessing: "आपका कमांड समझ रहे हैं...",
            micSpeaking: "Voxa उत्तर दे रहा है...",
            trySaying: "यह बोलकर देखें:",
            transcriptPlaceholder: "आपका बोला हुआ कमांड यहाँ दिखेगा...",
            responsePlaceholder: "Voxa का उत्तर यहाँ दिखाई देगा...",
            playAudio: "सुनाएं",
            pauseAudio: "रोकें",
            stopAudio: "बंद करें",
            voiceSpeed: "आवाज़ की गति",

            contactsTitle: "संपर्क सूची",
            searchContacts: "नाम या नंबर से खोजें...",
            addNewContact: "नया संपर्क जोड़ें",
            syncDeviceContacts: "डिवाइस संपर्क सिंक करें",
            callNow: "कॉल",
            sendSms: "SMS",
            sendWhatsApp: "WhatsApp",
            favorite: "पसंदीदा",
            noContactsFound: "कोई संपर्क नहीं मिला।",
            allContacts: "सभी संपर्क",
            favoriteContacts: "केवल पसंदीदा",

            callConfirmationTitle: "कॉल की पुष्टि करें",
            callConfirmationPrompt: "क्या आप इस नंबर पर कॉल लगाना चाहते हैं:",
            confirmCallBtn: "कॉल लगाएं",
            cancelBtn: "रद्द करें",

            msgModalTitle: "संदेश भेजें",
            msgRecipientLabel: "प्राप्तकर्ता:",
            msgTextLabel: "संदेश सामग्री:",
            msgPlaceholder: "यहाँ अपना संदेश लिखें...",
            sendBtn: "भेजें",

            historyTitle: "कमांड गतिविधि इतिहास",
            searchHistory: "इतिहास खोजें...",
            filterCategory: "श्रेणी द्वारा फ़िल्टर",
            allCategories: "सभी श्रेणियां",
            catPhone: "फ़ोन कॉल",
            catMessage: "संदेश",
            catApp: "ऐप खोलना",
            catWeb: "वेब खोज",
            catSystem: "सिस्टम व डिवाइस",
            catAI: "AI ज्ञान",
            clearHistory: "सारा इतिहास मिटाएं",
            noHistory: "अभी तक कोई इतिहास दर्ज नहीं है।",
            statusSuccess: "सफल",
            statusPending: "प्रतीक्षारत",
            statusFailed: "विफल",

            favoritesTitle: "त्वरित शॉर्टकट",
            addFavorite: "शॉर्टकट जोड़ें",
            noFavorites: "आपने अभी तक कोई पसंदीदा कमांड नहीं जोड़ा है।",
            runNow: "चलाएं",

            chatTitle: "AI वार्तालाप स्टूडियो",
            chatSubtitle: "Voxa AI से आवाज़ या टेक्स्ट द्वारा बात करें",
            chatPlaceholder: "Voxa से कुछ भी पूछें...",
            clearChat: "चैट मिटाएं",
            copyMessage: "कॉपी",
            readAloud: "पढ़कर सुनाएं",

            settingsTitle: "Voxa सिस्टम सेटिंग्स",
            secAccount: "खाता और प्रोफ़ाइल",
            secVoice: "आवाज़ और स्पीच इंजन",
            secAssistant: "असिस्टेंट ऑटोमेशन",
            secAppearance: "रंग और थीम",
            secPrivacy: "गोपनीयता और अनुमतियां",

            lblLanguage: "भाषा चुनें",
            lblVoiceSelect: "सिंथेसाइज़र आवाज़",
            lblSpeechRate: "बोलने की गति",
            lblAutoSpeak: "उत्तर अपने आप बोलें",
            lblWakeWord: "वेक वर्ड ('Hey Voxa')",
            lblCallConfirm: "कॉल से पहले पुष्टि आवश्यक करें",
            lblMsgConfirm: "मैसेज से पहले पुष्टि आवश्यक करें",
            lblContinuousListening: "लगातार सुनने का मोड",
            lblTheme: "थीम",
            themeDark: "डार्क साइबर (अनुशंसित)",
            themeLight: "लाइट मोड",

            permMic: "माइक्रोफ़ोन अनुमति",
            permContacts: "संपर्क अनुमति",
            permGranted: "स्वीकृत",
            permDenied: "अस्वीकृत",
            clearAllData: "सभी डेटा रीसेट करें",

            helpTitle: "मदद और सिस्टम जानकारी",
            commandsCheatSheet: "वॉयस कमांड गाइड",
            androidBridgeStatus: "एंड्रॉइड ब्रिज स्थिति",

            micDeniedToast: "माइक्रोफ़ोन की अनुमति अस्वीकृत की गई थी। कृपया अनुमति दें।",
            micNotSupportedToast: "इस ब्राउज़र में स्पीच रिकॉग्निशन समर्थित नहीं है।",
            copiedToast: "कॉपी कर लिया गया!",
            contactAddedToast: "संपर्क सफलतापूर्वक जोड़ा गया।",
            historyClearedToast: "इतिहास मिटा दिया गया।"
        },

        gu: {
            appName: "વોક્ષા AI (Voxa AI)",
            tagline: "તમારો બુદ્ધિશાળી વોઇસ આસિસ્ટન્ટ",
            splashSubtitle: "નેક્સ્ટ જનરેશન મલ્ટિમોડલ વોઇસ AI અને ડિવાઇસ ઓટોમેશન",
            startNow: "શરૂ કરો",
            skip: "આગળ વધો",

            navDashboard: "ડેશબોર્ડ",
            navVoice: "વોઇસ આસિસ્ટન્ટ",
            navContacts: "સંપર્કો (Contacts)",
            navHistory: "ઇતિહાસ (History)",
            navFavorites: "મનપસંદ (Favorites)",
            navChat: "AI ચેટ",
            navSettings: "સેટિંગ્સ",
            navHelp: "મદદ અને માહિતી",

            greetingMorning: "શુભ સવાર",
            greetingAfternoon: "શુભ બપોર",
            greetingEvening: "શુભ સાંજ",
            tapToSpeak: "બોલવા માટે ટેપ કરો",
            listeningNow: "તમારો અવાજ સાંભળી રહ્યા છીએ...",
            aiStatusOnline: "AI એન્જિન કાર્યરત",
            bridgeWeb: "બ્રાઉઝર મોડ",
            bridgeAndroid: "Android નેટિવ બ્રિજ સક્રિય",
            quickActions: "ઝડપી ક્રિયાઓ",
            recentCommands: "તાજેતરના કમાન્ડ્સ",
            favoriteCommands: "મનપસંદ શોર્ટકટ્સ",
            recentContacts: "તાજેતરના સંપર્કો",

            qaCall: "કોલ કરો",
            qaYouTube: "YouTube ખોલો",
            qaGoogle: "Google શોધો",
            qaMessage: "સંદેશ મોકલો",
            qaMaps: "Maps ખોલો",
            qaReminder: "રીમાઇન્ડર ગોઠવો",

            micIdle: "બોલવા માટે માઇક પર ટેપ કરો",
            micListening: "સાંભળી રહ્યા છીએ...",
            micProcessing: "તમારો આદેશ સમજી રહ્યા છીએ...",
            micSpeaking: "Voxa જવાબ આપી રહ્યું છે...",
            trySaying: "આ બોલવાનો પ્રયાસ કરો:",
            transcriptPlaceholder: "તમે બોલેલ કમાન્ડ અહીં દેખાશે...",
            responsePlaceholder: "Voxa નો બુદ્ધિશાળી જવાબ અહીં જોવા મળશે...",
            playAudio: "સાંભળો",
            pauseAudio: "અટકાવો",
            stopAudio: "બંધ કરો",
            voiceSpeed: "વાણીની ઝડપ",

            contactsTitle: "સંપર્ક યાદી",
            searchContacts: "નામ અથવા નંબર દ્વારા શોધો...",
            addNewContact: "નવો સંપર્ક ઉમેરો",
            syncDeviceContacts: "ડિવાઇસ સંપર્કો સિન્ક કરો",
            callNow: "કોલ",
            sendSms: "SMS",
            sendWhatsApp: "WhatsApp",
            favorite: "મનપસંદ",
            noContactsFound: "કોઈ સંપર્ક મળ્યો નથી.",
            allContacts: "બધા સંપર્કો",
            favoriteContacts: "માત્ર મનપસંદ",

            callConfirmationTitle: "કોલની પુષ્ટિ કરો",
            callConfirmationPrompt: "શું તમે આ નંબર પર કોલ કરવા માંગો છો:",
            confirmCallBtn: "કોલ કરો",
            cancelBtn: "રદ કરો",

            msgModalTitle: "સંદેશ મોકલો",
            msgRecipientLabel: "મેળવનાર:",
            msgTextLabel: "સંદેશ લખાણ:",
            msgPlaceholder: "અહીં તમારો સંદેશ લખો...",
            sendBtn: "મોકલો",

            historyTitle: "કમાન્ડ પ્રવૃત્તિ ઇતિહાસ",
            searchHistory: "ઇતિહાસ શોધો...",
            filterCategory: "શ્રેણી દ્વારા ફિલ્ટર કરો",
            allCategories: "બધી શ્રેણીઓ",
            catPhone: "ફોન કોલ",
            catMessage: "સંદેશ",
            catApp: "એપ ખોલવી",
            catWeb: "વેબ શોધ",
            catSystem: "સિસ્ટમ અને ડિવાઇસ",
            catAI: "AI જ્ઞાન",
            clearHistory: "બધો ઇતિહાસ સાફ કરો",
            noHistory: "હજી સુધી કોઈ કમાન્ડ ઇતિહાસ નોંધાયો નથી.",
            statusSuccess: "સફળ",
            statusPending: "બાકી",
            statusFailed: "નિષ્ફળ",

            favoritesTitle: "ઝડપી શોર્ટકટ્સ",
            addFavorite: "શોર્ટકટ ઉમેરો",
            noFavorites: "તમે હજી સુધી કોઈ મનપસંદ કમાન્ડ સેવ કર્યો નથી.",
            runNow: "ચલાવો",

            chatTitle: "AI વાતચીત સ્ટુડિયો",
            chatSubtitle: "Voxa AI સાથે અવાજ અથવા લખાણ દ્વારા વાત કરો",
            chatPlaceholder: "Voxa ને કંઈપણ પૂછો...",
            clearChat: "ચેટ સાફ કરો",
            copyMessage: "કોપી કરો",
            readAloud: "વાંચી સંભળાવો",

            settingsTitle: "Voxa સિસ્ટમ સેટિંગ્સ",
            secAccount: "ખાતું અને પ્રોફાઇલ",
            secVoice: "અવાજ અને વાણી એન્જિન",
            secAssistant: "આસિસ્ટન્ટ ઓટોમેશન",
            secAppearance: "રંગ અને થીમ",
            secPrivacy: "ગોપનીયતા અને પરવાનગીઓ",

            lblLanguage: "ઇન્ટરફેસ અને વાણી ભાષા",
            lblVoiceSelect: "અવાજ પસંદ કરો",
            lblSpeechRate: "બોલવાની ઝડપ",
            lblAutoSpeak: "જવાબ આપમેળે બોલો",
            lblWakeWord: "વેક વર્ડ ('Hey Voxa')",
            lblCallConfirm: "કોલ પહેલાં પુષ્ટિ ફરજિયાત કરો",
            lblMsgConfirm: "મેસેજ પહેલાં પુષ્ટિ ફરજિયાત કરો",
            lblContinuousListening: "સતત સાંભળવાનો મોડ",
            lblTheme: "થીમ",
            themeDark: "ડાર્ક સાયબર (ભલામણ કરેલ)",
            themeLight: "લાઇટ મોડ",

            permMic: "માઇક્રોફોન પરવાનગી",
            permContacts: "સંપર્કોની પરવાનગી",
            permGranted: "મંજૂર",
            permDenied: "નામંજૂર",
            clearAllData: "બધો ડેટા રીસેટ કરો",

            helpTitle: "મદદ અને સિસ્ટમ સ્થિતિ",
            commandsCheatSheet: "વોઇસ કમાન્ડ ગાઇડ",
            androidBridgeStatus: "Android બ્રિજ સ્થિતિ",

            micDeniedToast: "માઇક્રોફોનની પરવાનગી નકારવામાં આવી હતી. કૃપા કરીને પરવાનગી આપો.",
            micNotSupportedToast: "આ બ્રાઉઝરમાં સ્પીચ રેકગ્નિશન સપોર્ટેડ નથી.",
            copiedToast: "ક્લિપબોર્ડમાં કોપી થઈ ગયું!",
            contactAddedToast: "સંપર્ક સફળતાપૂર્વક ઉમેરાયો.",
            historyClearedToast: "ઇતિહાસ સાફ કરવામાં આવ્યો."
        }
    },

    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLang = lang;
            localStorage.setItem("voxa_language", lang);
            this.applyTranslations();
            return true;
        }
        return false;
    },

    t(key) {
        const langTable = this.translations[this.currentLang] || this.translations.en;
        return langTable[key] || this.translations.en[key] || key;
    },

    applyTranslations() {
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            const text = this.t(key);
            if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
                if (el.hasAttribute("placeholder")) el.placeholder = text;
            } else {
                el.textContent = text;
            }
        });

        document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
            const key = el.getAttribute("data-i18n-placeholder");
            el.placeholder = this.t(key);
        });

        document.querySelectorAll("[data-i18n-title]").forEach(el => {
            const key = el.getAttribute("data-i18n-title");
            el.title = this.t(key);
        });

        // Dispatch language change event for voice & synthesis engines
        window.dispatchEvent(new CustomEvent("voxa_language_changed", { detail: { lang: this.currentLang } }));
    },

    init() {
        const savedLang = localStorage.getItem("voxa_language") || "en";
        this.setLanguage(savedLang);
    }
};

window.I18N = I18N;
