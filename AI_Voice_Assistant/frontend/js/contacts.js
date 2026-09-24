/**
 * Voxa AI - Contacts Management System
 * Handles device contact synchronization (via Android Bridge) & local/cloud address book.
 */

class ContactsManager {
    constructor() {
        this.STORAGE_KEY = "voxa_contacts";
        this.contacts = [];
        this.filterFavorite = false;
        this.searchQuery = "";

        this.init();
    }

    init() {
        this.loadContacts();
        this.bindEvents();
    }

    getDefaultContacts() {
        return [
            { id: "c1", name: "Mom", phone: "+91 98765 43210", email: "mom@family.local", isFavorite: true, relationship: "Mother" },
            { id: "c2", name: "Rahul Sharma", phone: "+91 98250 12345", email: "rahul.sharma@example.com", isFavorite: true, relationship: "Friend" },
            { id: "c3", name: "Dad", phone: "+91 98765 43211", email: "dad@family.local", isFavorite: true, relationship: "Father" },
            { id: "c4", name: "Priya Patel", phone: "+91 97240 88990", email: "priya.p@tech.io", isFavorite: false, relationship: "Colleague" },
            { id: "c5", name: "Dr. Mehta Clinic", phone: "+91 94260 55443", email: "care@mehtaclinic.com", isFavorite: false, relationship: "Doctor" },
            { id: "c6", name: "Amit Verma", phone: "+91 99090 77123", email: "amit.v@startup.co", isFavorite: false, relationship: "Partner" }
        ];
    }

    loadContacts() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                this.contacts = JSON.parse(stored);
            } catch (e) {
                this.contacts = this.getDefaultContacts();
            }
        } else {
            this.contacts = this.getDefaultContacts();
            this.saveContacts();
        }
    }

    saveContacts() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.contacts));
        this.render();
        this.renderDashboardRecentContacts();
        window.dispatchEvent(new CustomEvent("voxa_contacts_updated", { detail: { contacts: this.contacts } }));
    }

    findContact(query) {
        if (!query) return null;
        const q = query.trim().toLowerCase();

        // Check exact name
        let found = this.contacts.find(c => c.name.toLowerCase() === q);
        if (found) return found;

        // Check if query is contained in name
        found = this.contacts.find(c => c.name.toLowerCase().includes(q) || q.includes(c.name.toLowerCase()));
        if (found) return found;

        // Check phone number match
        const cleanDigits = q.replace(/[^0-9]/g, "");
        if (cleanDigits.length >= 4) {
            found = this.contacts.find(c => c.phone.replace(/[^0-9]/g, "").includes(cleanDigits));
            if (found) return found;
        }

        // Relationship match
        found = this.contacts.find(c => c.relationship && c.relationship.toLowerCase() === q);
        return found || null;
    }

    async syncWithDevice() {
        if (AndroidBridge.isAvailable()) {
            window.dispatchEvent(new CustomEvent("voxa_toast", {
                detail: { type: "info", message: "Querying device contacts from Android ContactsContract..." }
            }));
            const res = await AndroidBridge.getDeviceContacts();
            if (res.success && res.contacts && res.contacts.length > 0) {
                // Merge unique device contacts
                res.contacts.forEach(dc => {
                    if (!this.contacts.some(c => c.phone.replace(/\s+/g, '') === dc.phone.replace(/\s+/g, ''))) {
                        this.contacts.push({
                            id: `dev_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                            name: dc.name || "Device Contact",
                            phone: dc.phone,
                            email: dc.email || "",
                            isFavorite: false,
                            relationship: "Device"
                        });
                    }
                });
                this.saveContacts();
                window.dispatchEvent(new CustomEvent("voxa_toast", {
                    detail: { type: "success", message: `Successfully synced ${res.count} contacts from Android device!` }
                }));
                return;
            }
        }

        // Running in Browser
        window.dispatchEvent(new CustomEvent("voxa_toast", {
            detail: {
                type: "info",
                message: "Running in Browser. Native device contacts sync requires the Voxa Kotlin Android App with READ_CONTACTS permission."
            }
        }));
    }

    addContact(name, phone, relationship = "Contact", email = "") {
        if (!name || !phone) return false;
        const newContact = {
            id: `c_${Date.now()}`,
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            isFavorite: false,
            relationship: relationship.trim() || "Contact"
        };
        this.contacts.unshift(newContact);
        this.saveContacts();
        return true;
    }

    toggleFavorite(id) {
        const c = this.contacts.find(item => item.id === id);
        if (c) {
            c.isFavorite = !c.isFavorite;
            this.saveContacts();
        }
    }

    deleteContact(id) {
        this.contacts = this.contacts.filter(item => item.id !== id);
        this.saveContacts();
    }

    getFilteredContacts() {
        return this.contacts.filter(c => {
            if (this.filterFavorite && !c.isFavorite) return false;
            if (this.searchQuery) {
                const q = this.searchQuery.toLowerCase();
                const nameMatch = c.name.toLowerCase().includes(q);
                const phoneMatch = c.phone.includes(q);
                const relMatch = c.relationship && c.relationship.toLowerCase().includes(q);
                return nameMatch || phoneMatch || relMatch;
            }
            return true;
        });
    }

    getInitials(name) {
        if (!name) return "V";
        const parts = name.trim().split(" ");
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.slice(0, 2).toUpperCase();
    }

    render() {
        const container = document.getElementById("contacts-list-container");
        if (!container) return;

        const filtered = this.getFilteredContacts();
        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <p data-i18n="noContactsFound">${I18N.t("noContactsFound")}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(c => `
            <div class="contact-card glass-card" data-id="${c.id}">
                <div class="contact-avatar-wrap">
                    <div class="contact-avatar">${this.getInitials(c.name)}</div>
                    ${c.isFavorite ? '<span class="favorite-badge">★</span>' : ''}
                </div>
                <div class="contact-details">
                    <div class="contact-name-row">
                        <h4 class="contact-name">${this.escapeHtml(c.name)}</h4>
                        ${c.relationship ? `<span class="contact-tag">${this.escapeHtml(c.relationship)}</span>` : ''}
                    </div>
                    <p class="contact-phone">${this.escapeHtml(c.phone)}</p>
                </div>
                <div class="contact-actions">
                    <button class="btn-icon btn-action-call" data-id="${c.id}" title="${I18N.t('callNow')}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    </button>
                    <button class="btn-icon btn-action-sms" data-id="${c.id}" title="${I18N.t('sendSms')}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    </button>
                    <button class="btn-icon btn-action-wa" data-id="${c.id}" title="${I18N.t('sendWhatsApp')}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"></path><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"></path></svg>
                    </button>
                    <button class="btn-icon btn-action-fav ${c.isFavorite ? 'active' : ''}" data-id="${c.id}" title="${I18N.t('favorite')}">
                        ★
                    </button>
                </div>
            </div>
        `).join("");

        // Attach action click listeners
        container.querySelectorAll(".btn-action-call").forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const id = btn.getAttribute("data-id");
                const c = this.contacts.find(item => item.id === id);
                if (c) window.dispatchEvent(new CustomEvent("voxa_show_call_confirm", { detail: { contact: c } }));
            };
        });

        container.querySelectorAll(".btn-action-sms").forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const id = btn.getAttribute("data-id");
                const c = this.contacts.find(item => item.id === id);
                if (c) window.dispatchEvent(new CustomEvent("voxa_show_msg_modal", { detail: { type: "sms", contact: c } }));
            };
        });

        container.querySelectorAll(".btn-action-wa").forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const id = btn.getAttribute("data-id");
                const c = this.contacts.find(item => item.id === id);
                if (c) window.dispatchEvent(new CustomEvent("voxa_show_msg_modal", { detail: { type: "whatsapp", contact: c } }));
            };
        });

        container.querySelectorAll(".btn-action-fav").forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const id = btn.getAttribute("data-id");
                this.toggleFavorite(id);
            };
        });
    }

    bindEvents() {
        const searchInput = document.getElementById("contacts-search-input");
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                this.searchQuery = e.target.value;
                this.render();
            });
        }

        const syncBtn = document.getElementById("sync-contacts-btn");
        if (syncBtn) {
            syncBtn.addEventListener("click", () => this.syncWithDevice());
        }

        const filterAllBtn = document.getElementById("filter-all-contacts");
        const filterFavBtn = document.getElementById("filter-fav-contacts");
        if (filterAllBtn && filterFavBtn) {
            filterAllBtn.addEventListener("click", () => {
                this.filterFavorite = false;
                filterAllBtn.classList.add("active");
                filterFavBtn.classList.remove("active");
                this.render();
            });
            filterFavBtn.addEventListener("click", () => {
                this.filterFavorite = true;
                filterFavBtn.classList.add("active");
                filterAllBtn.classList.remove("active");
                this.render();
            });
        }
    }

    renderDashboardRecentContacts() {
        const cContainer = document.getElementById("dashboard-recent-contacts");
        if (!cContainer) return;

        const topContacts = this.contacts.slice(0, 4);
        if (topContacts.length === 0) {
            cContainer.innerHTML = `<p class="text-muted">No recent contacts saved.</p>`;
            return;
        }

        cContainer.innerHTML = topContacts.map(c => `
            <div class="dash-recent-contact-card glass-card">
                <div class="dash-rc-avatar">${this.getInitials(c.name)}</div>
                <div class="dash-rc-info">
                    <span class="dash-rc-name">${this.escapeHtml(c.name)}</span>
                    <span class="dash-rc-phone">${this.escapeHtml(c.phone)}</span>
                </div>
                <div class="dash-rc-actions">
                    <button class="btn-dash-call" onclick="Actions.callContact({ name: '${this.escapeHtml(c.name)}', phone: '${this.escapeHtml(c.phone)}' })" aria-label="Call ${this.escapeHtml(c.name)}" title="Call ${this.escapeHtml(c.name)}">
                        <span>📞</span>
                    </button>
                    <button class="btn-dash-msg" onclick="Actions.openMessageModal({ name: '${this.escapeHtml(c.name)}', phone: '${this.escapeHtml(c.phone)}' })" aria-label="Message ${this.escapeHtml(c.name)}" title="Message ${this.escapeHtml(c.name)}">
                        <span>💬</span>
                    </button>
                </div>
            </div>
        `).join("");
    }

    escapeHtml(str) {
        if (!str) return "";
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
}

window.ContactsManager = new ContactsManager();
