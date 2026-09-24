/**
 * Voxa AI - Speech Recognition & Speech Synthesis Engine
 * Integrates Web Speech API (Recognition) & SpeechSynthesis (TTS).
 */

class VoiceEngine {
    constructor() {
        this.state = "idle"; // 'idle' | 'listening' | 'processing' | 'speaking'
        this.recognition = null;
        this.synth = window.speechSynthesis;
        this.currentUtterance = null;
        this.voices = [];
        this.selectedVoice = null;
        this.speechRate = parseFloat(localStorage.getItem("voxa_speech_rate") || "1.0");
        this.autoSpeak = localStorage.getItem("voxa_auto_speak") !== "false";
        this.wakeWordEnabled = localStorage.getItem("voxa_wake_word") === "true";
        this.isSupported = false;
        this.mediaStream = null;

        this.initRecognition();
        this.initSynthesis();
    }

    initRecognition() {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
            console.warn("Speech Recognition API not supported in this browser.");
            this.isSupported = false;
            return;
        }

        this.isSupported = true;
        this.recognition = new SpeechRec();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;

        this.updateRecognitionLanguage();

        // Listen for language changes
        window.addEventListener("voxa_language_changed", () => {
            this.updateRecognitionLanguage();
            this.updateVoiceList();
        });

        this.recognition.onstart = () => {
            this.setState("listening");
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = "";
            let finalTranscript = "";

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            window.dispatchEvent(new CustomEvent("voxa_speech_interim", {
                detail: { interim: interimTranscript, final: finalTranscript }
            }));

            if (finalTranscript.trim()) {
                this.setState("processing");
                window.dispatchEvent(new CustomEvent("voxa_speech_final", {
                    detail: { text: finalTranscript.trim() }
                }));
            }
        };

        this.recognition.onerror = (event) => {
            console.warn("Speech recognition error:", event.error);
            this.setState("idle");
            window.dispatchEvent(new CustomEvent("voxa_speech_error", {
                detail: { error: event.error }
            }));
        };

        this.recognition.onend = () => {
            if (this.state === "listening") {
                this.setState("idle");
            }
        };
    }

    updateRecognitionLanguage() {
        if (!this.recognition) return;
        const lang = I18N.currentLang || "en";
        const codeMap = {
            en: "en-US",
            hi: "hi-IN",
            gu: "gu-IN"
        };
        this.recognition.lang = codeMap[lang] || "en-US";
    }

    initSynthesis() {
        if (!this.synth) return;

        const populateVoices = () => {
            this.voices = this.synth.getVoices();
            this.updateVoiceList();
        };

        populateVoices();
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = populateVoices;
        }
    }

    updateVoiceList() {
        if (!this.synth || !this.voices.length) return;
        const currentLang = I18N.currentLang || "en";
        const targetPrefix = currentLang === "hi" ? "hi" : currentLang === "gu" ? "gu" : "en";

        // Find best voice for language
        const matched = this.voices.filter(v => v.lang.startsWith(targetPrefix));
        this.selectedVoice = matched.length > 0 ? matched[0] : (this.voices[0] || null);

        window.dispatchEvent(new CustomEvent("voxa_voices_ready", {
            detail: { voices: this.voices, selected: this.selectedVoice }
        }));
    }

    setVoice(voiceUri) {
        const found = this.voices.find(v => v.voiceURI === voiceUri);
        if (found) {
            this.selectedVoice = found;
        }
    }

    setSpeechRate(rate) {
        this.speechRate = Math.min(2.0, Math.max(0.5, rate));
        localStorage.setItem("voxa_speech_rate", this.speechRate.toString());
    }

    setAutoSpeak(enabled) {
        this.autoSpeak = Boolean(enabled);
        localStorage.setItem("voxa_auto_speak", this.autoSpeak.toString());
    }

    async startListening() {
        if (!this.isSupported) {
            window.dispatchEvent(new CustomEvent("voxa_toast", {
                detail: { type: "warning", message: I18N.t("micNotSupportedToast") }
            }));
            return false;
        }

        // Cancel any active speech synthesis
        this.stopSpeaking();

        try {
            // Request audio stream for visualizer if not already present
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && !this.mediaStream) {
                try {
                    this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    window.dispatchEvent(new CustomEvent("voxa_media_stream", { detail: { stream: this.mediaStream } }));
                } catch (e) {
                    // Audio stream for canvas visualizer denied, recognition might still function
                }
            }

            this.updateRecognitionLanguage();
            this.recognition.start();
            return true;
        } catch (err) {
            if (err.name !== "InvalidStateError") {
                console.error("Error starting speech recognition:", err);
            }
            return false;
        }
    }

    stopListening() {
        if (this.recognition && this.state === "listening") {
            try {
                this.recognition.stop();
            } catch (e) {}
            this.setState("idle");
        }
    }

    toggleListening() {
        if (this.state === "listening") {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    speak(text, onEndCallback = null) {
        if (!this.synth || !text || !this.autoSpeak) return;

        // Clean out any emojis or symbols that might cause weird speech synthesizer artifacts
        const cleanText = text
            .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
            .replace(/[\*\#\_\[\]\(\)\`]/g, '')
            .trim();

        if (!cleanText) return;

        this.stopSpeaking();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = this.speechRate;
        utterance.pitch = 1.0;
        if (this.selectedVoice) {
            utterance.voice = this.selectedVoice;
        }

        utterance.onstart = () => {
            this.setState("speaking");
        };

        utterance.onend = () => {
            this.setState("idle");
            this.currentUtterance = null;
            if (typeof onEndCallback === "function") onEndCallback();
        };

        utterance.onerror = (e) => {
            console.warn("Speech synthesis error:", e);
            this.setState("idle");
            this.currentUtterance = null;
        };

        this.currentUtterance = utterance;
        this.synth.speak(utterance);
    }

    stopSpeaking() {
        if (this.synth) {
            this.synth.cancel();
            if (this.state === "speaking") {
                this.setState("idle");
            }
            this.currentUtterance = null;
        }
    }

    pauseSpeaking() {
        if (this.synth && this.synth.speaking) {
            this.synth.pause();
        }
    }

    resumeSpeaking() {
        if (this.synth && this.synth.paused) {
            this.synth.resume();
        }
    }

    setState(newState) {
        if (this.state === newState) return;
        this.state = newState;
        window.dispatchEvent(new CustomEvent("voxa_state_change", {
            detail: { state: newState }
        }));
    }
}

window.VoiceEngine = new VoiceEngine();
