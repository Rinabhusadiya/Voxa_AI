/**
 * Voxa AI - Unified Actions Engine
 * Implements real-world functional workflows for Dashboard Quick Actions:
 * - Call Contact with selection modal, confirmation, tel: and Android ACTION_DIAL
 * - YouTube Direct Launch & Search Hub Modal
 * - Google Search Modal with URL encoding
 * - WhatsApp & SMS with editable message and confirmation
 * - Maps Navigation with destination search and current location
 * - Timer & Reminder scheduling
 */

const Actions = {

    // =========================================================================
    // 1. CALL CONTACT
    // =========================================================================

    /**
     * Open Contact Selection Modal for Calling
     */
    openCallModal() {
        const pickerModal = document.getElementById("modal-call-picker");
        if (!pickerModal) return;

        this.renderCallPickerList();
        UI.openModal("modal-call-picker");

        // Focus search input
        const searchInput = document.getElementById("call-picker-search-input");
        if (searchInput) {
            searchInput.value = "";
            setTimeout(() => searchInput.focus(), 100);
        }
    },

    renderCallPickerList(filter = "") {
        const listContainer = document.getElementById("call-picker-contacts-list");
        if (!listContainer || !window.ContactsManager) return;

        const q = filter.trim().toLowerCase();
        const contacts = window.ContactsManager.contacts.filter(c => {
            if (!q) return true;
            return c.name.toLowerCase().includes(q) || c.phone.includes(q);
        });

        if (contacts.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state" style="padding: 24px;">
                    <p>No contacts found matching "${filter}"</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = contacts.map(c => `
            <div class="picker-contact-item glass-card" data-phone="${c.phone}" data-name="${c.name}">
                <div class="picker-avatar">${window.ContactsManager.getInitials(c.name)}</div>
                <div class="picker-info">
                    <div class="picker-name">${this.escapeHtml(c.name)}</div>
                    <div class="picker-phone">${this.escapeHtml(c.phone)}</div>
                </div>
                <button class="btn-picker-call" onclick="Actions.callContact({ name: '${this.escapeHtml(c.name)}', phone: '${this.escapeHtml(c.phone)}' })" aria-label="Call ${this.escapeHtml(c.name)}">
                    <span>📞</span> Call
                </button>
            </div>
        `).join("");
    },

    /**
     * Call Contact with Confirmation Dialog
     * Respects browser tel: protocol and Android Intent ACTION_DIAL
     */
    callContact(contactOrPhone) {
        let name = "Contact";
        let phone = "";

        if (typeof contactOrPhone === "string") {
            phone = contactOrPhone;
            const found = window.ContactsManager?.findContact(phone);
            name = found ? found.name : phone;
        } else if (contactOrPhone && typeof contactOrPhone === "object") {
            name = contactOrPhone.name || "Contact";
            phone = contactOrPhone.phone || "";
        }

        if (!phone) {
            UI.showToast("warning", "No phone number available to call.");
            return;
        }

        // Close picker modal if open
        UI.closeModal("modal-call-picker");

        const initials = window.ContactsManager ? window.ContactsManager.getInitials(name) : "📞";

        // Show Confirmation Dialog
        UI.openConfirmationModal({
            title: `Call ${name}`,
            message: `Do you want to call ${name} (${phone})?`,
            avatarInitials: initials,
            confirmText: "Call Now",
            cancelText: "Cancel",
            onConfirm: () => {
                this.executeDial(name, phone);
            }
        });
    },

    executeDial(name, phone) {
        const cleanNumber = phone.replace(/[^0-9+]/g, "");
        UI.showToast("info", `Opening phone dialer for ${name}...`);

        // Check if inside Android WebView
        if (window.AndroidBridge && window.AndroidBridge.isAvailable()) {
            window.AndroidBridge.makePhoneCall(cleanNumber);
        } else {
            // Browser Web Fallback using standard tel: protocol
            window.location.href = `tel:${cleanNumber}`;
        }

        // Record in Command History
        if (window.HistoryManager) {
            window.HistoryManager.addEntry({
                command: `Call ${name}`,
                category: "phone",
                result: `Dialed ${phone}`,
                status: "Success"
            });
        }
    },


    // =========================================================================
    // 2. YOUTUBE HUB & SEARCH
    // =========================================================================

    openYouTube(searchQuery = "") {
        if (searchQuery && searchQuery.trim()) {
            const cleanQuery = searchQuery.trim();
            const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanQuery)}`;
            UI.showToast("info", `Opening YouTube search for "${cleanQuery}"...`);

            if (window.AndroidBridge && window.AndroidBridge.isAvailable()) {
                window.AndroidBridge.launchApp("com.google.android.youtube", searchUrl);
            } else {
                window.open(searchUrl, "_blank", "noopener,noreferrer");
            }

            if (window.HistoryManager) {
                window.HistoryManager.addEntry({
                    command: `Search YouTube: ${cleanQuery}`,
                    category: "web",
                    result: `YouTube Search for "${cleanQuery}"`,
                    status: "Success"
                });
            }
            return;
        }

        // Open YouTube modal hub
        UI.openModal("modal-youtube-action");
        const ytInput = document.getElementById("youtube-search-input");
        if (ytInput) {
            ytInput.value = "";
            setTimeout(() => ytInput.focus(), 100);
        }
    },

    launchYouTubeDirect() {
        UI.closeModal("modal-youtube-action");
        UI.showToast("info", "Opening YouTube...");

        const url = "https://www.youtube.com";
        if (window.AndroidBridge && window.AndroidBridge.isAvailable()) {
            window.AndroidBridge.launchApp("com.google.android.youtube", url);
        } else {
            window.open(url, "_blank", "noopener,noreferrer");
        }

        if (window.HistoryManager) {
            window.HistoryManager.addEntry({
                command: "Open YouTube",
                category: "app",
                result: "Launched YouTube",
                status: "Success"
            });
        }
    },


    // =========================================================================
    // 3. GOOGLE SEARCH
    // =========================================================================

    searchGoogle(query = "") {
        if (query && query.trim()) {
            const cleanQuery = query.trim();
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(cleanQuery)}`;
            UI.showToast("info", `Searching Google for "${cleanQuery}"...`);

            window.open(searchUrl, "_blank", "noopener,noreferrer");

            if (window.HistoryManager) {
                window.HistoryManager.addEntry({
                    command: `Search Google: ${cleanQuery}`,
                    category: "web",
                    result: `Google Query: "${cleanQuery}"`,
                    status: "Success"
                });
            }
            return;
        }

        // Open Google Search modal
        UI.openModal("modal-google-search");
        const searchInput = document.getElementById("google-search-input");
        if (searchInput) {
            searchInput.value = "";
            setTimeout(() => searchInput.focus(), 100);
        }
    },


    // =========================================================================
    // 4. SEND MESSAGE (WhatsApp & SMS)
    // =========================================================================

    openMessageModal(contact = null) {
        UI.openModal("modal-message-choice");
        const recipientInput = document.getElementById("msg-choice-recipient");
        const textInput = document.getElementById("msg-choice-text");

        if (contact && contact.phone) {
            if (recipientInput) recipientInput.value = contact.phone;
        } else if (recipientInput && !recipientInput.value) {
            const first = window.ContactsManager?.contacts[0];
            if (first) recipientInput.value = first.phone;
        }

        if (textInput && !textInput.value) {
            textInput.value = "Hello from Voxa AI!";
        }
    },

    sendWhatsApp(phoneNumber, message = "") {
        const cleanNumber = phoneNumber.replace(/[^0-9]/g, "");
        if (!cleanNumber) {
            UI.showToast("warning", "Please provide a valid phone number.");
            return;
        }

        // Confirmation dialog
        UI.openConfirmationModal({
            title: "Send WhatsApp Message?",
            message: `Send this message to +${cleanNumber}?\n\n"${message || 'Hello'}"`,
            avatarInitials: "💬",
            confirmText: "Open WhatsApp",
            cancelText: "Cancel",
            onConfirm: () => {
                UI.showToast("info", "Opening WhatsApp...");
                if (window.AndroidBridge && window.AndroidBridge.isAvailable()) {
                    window.AndroidBridge.sendWhatsApp(cleanNumber, message);
                } else {
                    const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
                    window.open(waUrl, "_blank", "noopener,noreferrer");
                }

                if (window.HistoryManager) {
                    window.HistoryManager.addEntry({
                        command: `WhatsApp to +${cleanNumber}`,
                        category: "message",
                        result: `Message: "${message}"`,
                        status: "Success"
                    });
                }
            }
        });
    },

    sendSMS(phoneNumber, message = "") {
        const cleanNumber = phoneNumber.replace(/[^0-9+]/g, "");
        if (!cleanNumber) {
            UI.showToast("warning", "Please provide a valid phone number.");
            return;
        }

        UI.openConfirmationModal({
            title: "Send SMS Message?",
            message: `Send SMS to ${cleanNumber}?\n\n"${message || 'Hello'}"`,
            avatarInitials: "✉️",
            confirmText: "Open SMS App",
            cancelText: "Cancel",
            onConfirm: () => {
                UI.showToast("info", `Opening SMS composer for ${cleanNumber}...`);
                if (window.AndroidBridge && window.AndroidBridge.isAvailable()) {
                    window.AndroidBridge.sendSMS(cleanNumber, message);
                } else {
                    const smsUrl = `sms:${cleanNumber}?body=${encodeURIComponent(message)}`;
                    window.location.href = smsUrl;
                }

                if (window.HistoryManager) {
                    window.HistoryManager.addEntry({
                        command: `SMS to ${cleanNumber}`,
                        category: "message",
                        result: `Drafted: "${message}"`,
                        status: "Success"
                    });
                }
            }
        });
    },


    // =========================================================================
    // 5. OPEN MAPS & NAVIGATION
    // =========================================================================

    openMaps(destination = "") {
        if (destination && destination.trim()) {
            const cleanDest = destination.trim();
            const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(cleanDest)}`;
            UI.showToast("info", `Navigating to "${cleanDest}"...`);

            if (window.AndroidBridge && window.AndroidBridge.isAvailable()) {
                window.AndroidBridge.launchApp("com.google.android.apps.maps", mapsUrl);
            } else {
                window.open(mapsUrl, "_blank", "noopener,noreferrer");
            }

            if (window.HistoryManager) {
                window.HistoryManager.addEntry({
                    command: `Navigate to ${cleanDest}`,
                    category: "web",
                    result: `Maps Navigation to "${cleanDest}"`,
                    status: "Success"
                });
            }
            return;
        }

        // Open Maps Search Modal
        UI.openModal("modal-maps-action");
        const mapInput = document.getElementById("maps-destination-input");
        if (mapInput) {
            mapInput.value = "";
            setTimeout(() => mapInput.focus(), 100);
        }
    },

    openCurrentLocationMaps() {
        UI.closeModal("modal-maps-action");
        UI.showToast("info", "Opening Google Maps for current location...");

        const mapsUrl = "https://maps.google.com";
        if (window.AndroidBridge && window.AndroidBridge.isAvailable()) {
            window.AndroidBridge.launchApp("com.google.android.apps.maps", mapsUrl);
        } else {
            window.open(mapsUrl, "_blank", "noopener,noreferrer");
        }
    },


    // =========================================================================
    // 6. TAP TO SPEAK
    // =========================================================================

    startVoiceRecognition() {
        if (window.Navigation) {
            window.Navigation.navigateToPage("voice");
        }
        if (window.VoiceEngine) {
            window.VoiceEngine.startListening();
        }
    },


    // =========================================================================
    // 7. SET REMINDER / TIMER
    // =========================================================================

    setReminder(task = "Reminder", minutes = 10) {
        UI.showToast("info", `⏰ Timer set for ${minutes} minute(s). Voxa will notify you.`);
        if (window.VoiceEngine && window.VoiceEngine.autoSpeak) {
            window.VoiceEngine.speak(`Timer set for ${minutes} minutes.`);
        }

        setTimeout(() => {
            UI.showToast("success", `🔔 Time's up! Reminder: "${task}" has elapsed.`);
            if (window.VoiceEngine && window.VoiceEngine.autoSpeak) {
                window.VoiceEngine.speak(`Attention Alex: your timer for ${task} has finished!`);
            }
        }, minutes * 60 * 1000);

        if (window.HistoryManager) {
            window.HistoryManager.addEntry({
                command: `Set timer: ${minutes} mins`,
                category: "system",
                result: `Scheduled alert for ${minutes}m`,
                status: "Success"
            });
        }
    },


    // =========================================================================
    // 8. FAVORITES SHORTCUT CREATOR
    // =========================================================================

    openAddShortcutModal() {
        UI.openModal("modal-add-favorite");
        const titleInput = document.getElementById("shortcut-title-input");
        const cmdInput = document.getElementById("shortcut-cmd-input");
        if (titleInput) titleInput.value = "";
        if (cmdInput) cmdInput.value = "";
    },

    escapeHtml(str) {
        if (!str) return "";
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
};

window.Actions = Actions;
window.openYouTube = (q) => Actions.openYouTube(q);
window.searchGoogle = (q) => Actions.searchGoogle(q);
window.openMaps = (d) => Actions.openMaps(d);
window.callContact = (c) => Actions.callContact(c);
window.sendWhatsApp = (p, m) => Actions.sendWhatsApp(p, m);
window.sendSMS = (p, m) => Actions.sendSMS(p, m);
window.startVoiceRecognition = () => Actions.startVoiceRecognition();
