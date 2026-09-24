/**
 * Voxa AI - Main Application Controller
 * Coordinates SPA Navigation, Voice Engine, Visualizer, Modals, System Clock, and Settings.
 */

document.addEventListener("DOMContentLoaded", () => {
    // =========================================================================
    // 1. Core Engines Initialization (Safely wrapped)
    // =========================================================================
    try { if (window.I18N && typeof I18N.init === "function") I18N.init(); } catch (e) { console.warn("I18N init:", e); }
    try { if (window.VoxaFirebase && typeof VoxaFirebase.init === "function") VoxaFirebase.init(); } catch (e) { console.warn("Firebase init:", e); }
    try { if (window.UI && typeof UI.init === "function") UI.init(); } catch (e) { console.warn("UI init:", e); }
    try { if (window.Navigation && typeof Navigation.init === "function") Navigation.init(); } catch (e) { console.warn("Navigation init:", e); }

    // Visualizer instance
    let visualizer = null;
    try {
        visualizer = new SoundWaveVisualizer("voice-wave-canvas");
    } catch (e) {
        console.warn("Visualizer init:", e);
    }

    // Initialize Dashboard Data
    try {
        if (window.ContactsManager && typeof ContactsManager.renderDashboardRecentContacts === "function") {
            ContactsManager.renderDashboardRecentContacts();
        }
    } catch (e) { console.warn("ContactsManager error:", e); }

    try {
        if (window.HistoryManager && typeof HistoryManager.renderDashboardRecent === "function") {
            HistoryManager.renderDashboardRecent();
        }
    } catch (e) { console.warn("HistoryManager error:", e); }

    try {
        if (window.FavoritesManager && typeof FavoritesManager.renderDashboardFavorites === "function") {
            FavoritesManager.renderDashboardFavorites();
        }
    } catch (e) { console.warn("FavoritesManager error:", e); }

    // Refresh Dashboard Views on Data Events
    window.addEventListener("voxa_contacts_updated", () => {
        try { if (window.ContactsManager) ContactsManager.renderDashboardRecentContacts(); } catch (e) {}
    });
    window.addEventListener("voxa_history_updated", () => {
        try { if (window.HistoryManager) HistoryManager.renderDashboardRecent(); } catch (e) {}
    });
    window.addEventListener("voxa_favorites_updated", () => {
        try { if (window.FavoritesManager) FavoritesManager.renderDashboardFavorites(); } catch (e) {}
    });

    // =========================================================================
    // 2. Splash Screen Transition
    // =========================================================================
    window.dismissSplashScreen = function() {
        const splash = document.getElementById("page-splash");
        if (splash) {
            splash.classList.remove("active");
            splash.style.display = "none";
            splash.style.visibility = "hidden";
            splash.style.opacity = "0";
            splash.style.pointerEvents = "none";
        }
        if (window.Navigation && typeof Navigation.navigateToPage === "function") {
            Navigation.navigateToPage("dashboard");
        }
    };

    const splashTimer = setTimeout(window.dismissSplashScreen, 2200);

    const skipSplashBtn = document.getElementById("skip-splash-btn");
    if (skipSplashBtn) {
        skipSplashBtn.addEventListener("click", () => {
            clearTimeout(splashTimer);
            window.dismissSplashScreen();
        });
    }

    // =========================================================================
    // 3. Live Clock, Date, and Dynamic Greeting
    // =========================================================================
    const updateDateTime = () => {
        const dateEl = document.getElementById("dashboard-date");
        const timeEl = document.getElementById("dashboard-time");
        const greetingEl = document.getElementById("dashboard-greeting-text");

        const now = new Date();
        if (dateEl) {
            dateEl.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
        }
        if (timeEl) {
            timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        if (greetingEl) {
            const hour = now.getHours();
            let greetKey = "greetingMorning";
            if (hour >= 12 && hour < 17) greetKey = "greetingAfternoon";
            else if (hour >= 17) greetKey = "greetingEvening";
            greetingEl.textContent = `${I18N.t(greetKey)}, Alex`;
        }
    };
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // =========================================================================
    // 4. Voice Assistant Triggers & Central Hero Mic
    // =========================================================================
    document.querySelectorAll(".trigger-voice-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            if (window.Actions) {
                Actions.startVoiceRecognition();
            } else if (window.Navigation) {
                Navigation.navigateToPage("voice");
                if (window.VoiceEngine) VoiceEngine.startListening();
            }
        });
    });

    // Central Voice Assistant Mic Button
    const mainVoiceMic = document.getElementById("main-voice-mic");
    if (mainVoiceMic) {
        mainVoiceMic.addEventListener("click", () => {
            if (window.VoiceEngine) VoiceEngine.toggleListening();
        });
    }

    // Voice State Changes
    window.addEventListener("voxa_state_change", (e) => {
        const state = e.detail.state;
        if (visualizer) visualizer.setState(state);

        // Update mic button styling & status text
        const micWrap = document.getElementById("voice-mic-wrapper");
        const stateText = document.getElementById("voice-state-text");
        const aiStatusPill = document.getElementById("ai-status-pill");

        if (micWrap) {
            micWrap.className = `voice-mic-wrapper state-${state}`;
        }

        if (stateText) {
            const textKey = {
                idle: "micIdle",
                listening: "micListening",
                processing: "micProcessing",
                speaking: "micSpeaking"
            }[state] || "micIdle";
            stateText.textContent = I18N.t(textKey);
        }

        if (aiStatusPill) {
            aiStatusPill.textContent = state === "idle" ? I18N.t("aiStatusOnline") : I18N.t(`mic${state.charAt(0).toUpperCase() + state.slice(1)}`);
        }
    });

    // Speech Transcript Streaming
    window.addEventListener("voxa_speech_interim", (e) => {
        const transcriptEl = document.getElementById("voice-transcript-text");
        if (transcriptEl) {
            transcriptEl.textContent = e.detail.interim || e.detail.final || I18N.t("transcriptPlaceholder");
        }
    });

    window.addEventListener("voxa_speech_final", (e) => {
        const transcriptEl = document.getElementById("voice-transcript-text");
        if (transcriptEl) {
            transcriptEl.textContent = e.detail.text;
        }
        if (window.CommandDispatcher) {
            CommandDispatcher.processCommand(e.detail.text);
        }
    });

    window.addEventListener("voxa_speech_error", (e) => {
        if (window.UI) UI.showToast("error", `Voice error: ${e.detail.error}`);
    });

    // Media stream for visualizer
    window.addEventListener("voxa_media_stream", (e) => {
        if (visualizer) visualizer.attachStream(e.detail.stream);
    });

    // =========================================================================
    // 5. Voice Response Display & Audio Controls
    // =========================================================================
    let lastSpokenText = "";
    window.addEventListener("voxa_display_response", (e) => {
        const respBox = document.getElementById("voice-response-container");
        const respText = document.getElementById("voice-response-text");
        const audioControls = document.getElementById("voice-audio-controls");

        if (respText && window.ChatStudio) {
            respText.innerHTML = ChatStudio.formatMarkdown(e.detail.displayText);
        } else if (respText) {
            respText.textContent = e.detail.displayText;
        }
        if (respBox) respBox.style.display = "block";
        if (audioControls) audioControls.style.display = "flex";
        lastSpokenText = e.detail.speakText;
    });

    const playBtn = document.getElementById("btn-resp-play");
    const pauseBtn = document.getElementById("btn-resp-pause");
    const stopBtn = document.getElementById("btn-resp-stop");
    const speedSlider = document.getElementById("resp-voice-speed");

    if (playBtn) playBtn.onclick = () => { if (window.VoiceEngine) VoiceEngine.speak(lastSpokenText); };
    if (pauseBtn) pauseBtn.onclick = () => { if (window.VoiceEngine) VoiceEngine.pauseSpeaking(); };
    if (stopBtn) stopBtn.onclick = () => { if (window.VoiceEngine) VoiceEngine.stopSpeaking(); };
    if (speedSlider) {
        speedSlider.oninput = (e) => {
            if (window.VoiceEngine) VoiceEngine.setSpeechRate(parseFloat(e.target.value));
        };
    }

    // =========================================================================
    // 6. Action Event Hooks
    // =========================================================================
    window.addEventListener("voxa_show_call_confirm", (e) => {
        if (window.Actions && e.detail.contact) {
            Actions.callContact(e.detail.contact);
        }
    });

    window.addEventListener("voxa_show_msg_modal", (e) => {
        if (window.Actions) {
            Actions.openMessageModal(e.detail.contact);
        }
    });

    // =========================================================================
    // 7. Modals: Add New Contact
    // =========================================================================
    const openAddContactBtn = document.getElementById("open-add-contact-modal-btn");
    const saveContactBtn = document.getElementById("modal-contact-save-btn");

    if (openAddContactBtn) {
        openAddContactBtn.onclick = () => {
            if (window.UI) UI.openModal("modal-add-contact");
        };
    }

    if (saveContactBtn) {
        saveContactBtn.onclick = () => {
            const name = document.getElementById("input-new-contact-name")?.value;
            const phone = document.getElementById("input-new-contact-phone")?.value;
            const rel = document.getElementById("input-new-contact-rel")?.value;
            const email = document.getElementById("input-new-contact-email")?.value;

            if (name && phone && window.ContactsManager) {
                ContactsManager.addContact(name, phone, rel, email);
                if (window.UI) {
                    UI.showToast("success", I18N.t("contactAddedToast"));
                    UI.closeModal("modal-add-contact");
                }
                const nameInput = document.getElementById("input-new-contact-name");
                const phoneInput = document.getElementById("input-new-contact-phone");
                if (nameInput) nameInput.value = "";
                if (phoneInput) phoneInput.value = "";
            } else if (window.UI) {
                UI.showToast("warning", "Please provide at least a name and phone number.");
            }
        };
    }

    // =========================================================================
    // 8. Settings & Preferences
    // =========================================================================
    const langSelect = document.getElementById("settings-language-select");
    const topLangSelect = document.getElementById("top-bar-language-select");
    const setLanguage = (lang) => {
        I18N.setLanguage(lang);
        if (langSelect) langSelect.value = lang;
        if (topLangSelect) topLangSelect.value = lang;
        updateDateTime();
    };

    if (langSelect) langSelect.onchange = (e) => setLanguage(e.target.value);
    if (topLangSelect) topLangSelect.onchange = (e) => setLanguage(e.target.value);

    // Voice Selector
    window.addEventListener("voxa_voices_ready", (e) => {
        const voiceSelect = document.getElementById("settings-voice-select");
        if (!voiceSelect) return;
        voiceSelect.innerHTML = e.detail.voices.map(v => `
            <option value="${v.voiceURI}" ${v === e.detail.selected ? 'selected' : ''}>
                ${v.name} (${v.lang})
            </option>
        `).join("");

        voiceSelect.onchange = () => {
            if (window.VoiceEngine) VoiceEngine.setVoice(voiceSelect.value);
        };
    });

    // Auto-Speak Toggle
    const autoSpeakToggle = document.getElementById("settings-auto-speak-toggle");
    if (autoSpeakToggle && window.VoiceEngine) {
        autoSpeakToggle.checked = VoiceEngine.autoSpeak;
        autoSpeakToggle.onchange = (e) => VoiceEngine.setAutoSpeak(e.target.checked);
    }

    // Call and Message Confirmations
    const confirmCallToggle = document.getElementById("settings-confirm-call-toggle");
    if (confirmCallToggle) {
        confirmCallToggle.checked = localStorage.getItem("voxa_confirm_call") !== "false";
        confirmCallToggle.onchange = (e) => localStorage.setItem("voxa_confirm_call", e.target.checked.toString());
    }

    const confirmMsgToggle = document.getElementById("settings-confirm-msg-toggle");
    if (confirmMsgToggle) {
        confirmMsgToggle.checked = localStorage.getItem("voxa_confirm_msg") !== "false";
        confirmMsgToggle.onchange = (e) => localStorage.setItem("voxa_confirm_msg", e.target.checked.toString());
    }

    // Theme Toggle (Dark vs Light)
    const themeToggle = document.getElementById("settings-theme-toggle");
    const topThemeToggle = document.getElementById("top-theme-toggle");

    const applyTheme = (theme) => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("voxa_theme", theme);
        if (themeToggle) themeToggle.value = theme;
    };

    const savedTheme = localStorage.getItem("voxa_theme") || "dark";
    applyTheme(savedTheme);

    if (themeToggle) themeToggle.onchange = (e) => applyTheme(e.target.value);
    if (topThemeToggle) {
        topThemeToggle.onclick = () => {
            const current = document.documentElement.getAttribute("data-theme") || "dark";
            applyTheme(current === "dark" ? "light" : "dark");
        };
    }

    // Reset All Local Data
    const resetDataBtn = document.getElementById("btn-reset-local-data");
    if (resetDataBtn) {
        resetDataBtn.onclick = () => {
            if (confirm("Reset all local contacts, history, and favorites to defaults?")) {
                localStorage.clear();
                location.reload();
            }
        };
    }

    // =========================================================================
    // 9. Android Bridge Diagnostics (Help & About Page)
    // =========================================================================
    window.updateBridgeDiagnostics = function() {
        if (!window.AndroidBridge) return;
        const envInfo = AndroidBridge.getEnvironmentInfo();
        const modeEl = document.getElementById("diag-bridge-mode");
        const statusEl = document.getElementById("diag-bridge-status");
        const versionEl = document.getElementById("diag-bridge-version");
        const batteryEl = document.getElementById("diag-battery-level");

        if (modeEl) modeEl.textContent = envInfo.environment;
        if (statusEl) {
            statusEl.textContent = envInfo.isNativeAndroid ? "Connected (Hardware Enabled)" : "Browser Web Fallback Active";
            statusEl.className = `badge ${envInfo.isNativeAndroid ? 'badge-cyan' : 'badge-orange'}`;
        }
        if (versionEl) versionEl.textContent = envInfo.bridgeVersion;

        AndroidBridge.getBatteryLevel().then(bat => {
            if (batteryEl) batteryEl.textContent = `${bat.level}% ${bat.charging ? '(Charging)' : ''}`;
        });
    };

    // Flashlight Test Button in Diagnostics
    const testFlashlightBtn = document.getElementById("btn-test-flashlight");
    let flashState = false;
    if (testFlashlightBtn) {
        testFlashlightBtn.onclick = async () => {
            if (!window.AndroidBridge) return;
            flashState = !flashState;
            const res = await AndroidBridge.toggleFlashlight(flashState);
            if (window.UI) UI.showToast("info", res.message);
            testFlashlightBtn.textContent = flashState ? "Turn Flashlight OFF" : "Turn Flashlight ON";
        };
    }
});
