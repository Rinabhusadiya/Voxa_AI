/**
 * Voxa AI - Command History Tracker
 * Persists voice commands, execution status, categories, and timestamps.
 */

class HistoryManager {
    constructor() {
        this.STORAGE_KEY = "voxa_history";
        this.history = [];
        this.selectedCategory = "all";
        this.searchQuery = "";

        this.init();
    }

    init() {
        this.loadHistory();
        this.bindEvents();
    }

    getDefaultHistory() {
        return [
            { id: "h1", command: "Open YouTube", category: "app", result: "Launched YouTube Application", status: "Success", timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
            { id: "h2", command: "Call Mom", category: "phone", result: "Voice call initiated to Mom", status: "Success", timestamp: new Date(Date.now() - 3600000 * 4).toISOString() },
            { id: "h3", command: "Search Python Django tutorial", category: "web", result: "Google Search Executed", status: "Success", timestamp: new Date(Date.now() - 3600000 * 7).toISOString() },
            { id: "h4", command: "Send WhatsApp message to Rahul", category: "message", result: "WhatsApp draft opened", status: "Success", timestamp: new Date(Date.now() - 3600000 * 12).toISOString() },
            { id: "h5", command: "What is the weather today?", category: "system", result: "28°C Sunny", status: "Success", timestamp: new Date(Date.now() - 3600000 * 24).toISOString() }
        ];
    }

    loadHistory() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                this.history = JSON.parse(stored);
            } catch (e) {
                this.history = this.getDefaultHistory();
            }
        } else {
            this.history = this.getDefaultHistory();
            this.saveHistory();
        }
    }

    saveHistory() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.history));
        this.render();
        this.renderDashboardRecent();
        window.dispatchEvent(new CustomEvent("voxa_history_updated", { detail: { history: this.history } }));
    }

    addEntry({ command, category, result, status }) {
        const entry = {
            id: `h_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            command: command.trim(),
            category: category || "ai",
            result: result || "Completed",
            status: status || "Success",
            timestamp: new Date().toISOString()
        };
        this.history.unshift(entry);
        if (this.history.length > 100) this.history.pop();
        this.saveHistory();
    }

    deleteEntry(id) {
        this.history = this.history.filter(item => item.id !== id);
        this.saveHistory();
    }

    clearAll() {
        this.history = [];
        this.saveHistory();
        window.dispatchEvent(new CustomEvent("voxa_toast", {
            detail: { type: "info", message: I18N.t("historyClearedToast") }
        }));
    }

    getFilteredHistory() {
        return this.history.filter(item => {
            if (this.selectedCategory !== "all" && item.category !== this.selectedCategory) return false;
            if (this.searchQuery) {
                const q = this.searchQuery.toLowerCase();
                return item.command.toLowerCase().includes(q) || (item.result && item.result.toLowerCase().includes(q));
            }
            return true;
        });
    }

    formatTime(isoString) {
        try {
            const date = new Date(isoString);
            return date.toLocaleDateString([], { month: "short", day: "numeric" }) + " • " +
                   date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        } catch (e) {
            return "Just now";
        }
    }

    getCategoryBadge(cat) {
        const badges = {
            phone: { label: I18N.t("catPhone"), class: "badge-purple", icon: "📞" },
            message: { label: I18N.t("catMessage"), class: "badge-cyan", icon: "💬" },
            app: { label: I18N.t("catApp"), class: "badge-orange", icon: "📱" },
            web: { label: I18N.t("catWeb"), class: "badge-cyan", icon: "🌐" },
            system: { label: I18N.t("catSystem"), class: "badge-purple", icon: "⚙️" },
            ai: { label: I18N.t("catAI"), class: "badge-orange", icon: "🧠" }
        };
        return badges[cat] || { label: cat, class: "badge-purple", icon: "⚡" };
    }

    render() {
        const container = document.getElementById("history-list-container");
        if (!container) return;

        const filtered = this.getFilteredHistory();
        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📜</div>
                    <p data-i18n="noHistory">${I18N.t("noHistory")}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(item => {
            const b = this.getCategoryBadge(item.category);
            return `
                <div class="history-item glass-card" data-id="${item.id}">
                    <div class="history-icon-col">
                        <span class="history-type-icon">${b.icon}</span>
                    </div>
                    <div class="history-body">
                        <div class="history-header-row">
                            <span class="history-command">"${this.escapeHtml(item.command)}"</span>
                            <span class="badge ${b.class}">${b.label}</span>
                        </div>
                        <div class="history-meta-row">
                            <span class="history-result">${this.escapeHtml(item.result)}</span>
                            <span class="history-time">${this.formatTime(item.timestamp)}</span>
                        </div>
                    </div>
                    <div class="history-actions">
                        <span class="status-indicator status-success">✓</span>
                        <button class="btn-icon btn-del-history" data-id="${item.id}" title="Delete">✕</button>
                    </div>
                </div>
            `;
        }).join("");

        container.querySelectorAll(".btn-del-history").forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const id = btn.getAttribute("data-id");
                this.deleteEntry(id);
            };
        });
    }

    formatRecentTime(isoString) {
        try {
            const date = new Date(isoString);
            const now = new Date();
            const isToday = date.toDateString() === now.toDateString();
            const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            return isToday ? `Today • ${timeStr}` : `${date.toLocaleDateString([], { month: "short", day: "numeric" })} • ${timeStr}`;
        } catch (e) {
            return "Recently";
        }
    }

    renderDashboardRecent() {
        const dashContainer = document.getElementById("dashboard-recent-commands");
        if (!dashContainer) return;

        const recent = this.history.slice(0, 4);
        if (recent.length === 0) {
            dashContainer.innerHTML = `<p class="text-muted" data-i18n="noHistory">${I18N.t("noHistory")}</p>`;
            return;
        }

        dashContainer.innerHTML = recent.map(item => {
            const b = this.getCategoryBadge(item.category);
            const timeText = this.formatRecentTime(item.timestamp);
            return `
                <div class="recent-command-card glass-card" onclick="CommandDispatcher.processCommand('${this.escapeHtml(item.command)}')" role="button" tabindex="0" title="Click to replay command">
                    <div class="recent-cmd-left">
                        <span class="recent-cmd-icon">${b.icon}</span>
                        <div class="recent-cmd-info">
                            <span class="recent-cmd-title">${this.escapeHtml(item.command)}</span>
                            <span class="recent-cmd-time">${timeText}</span>
                        </div>
                    </div>
                    <span class="recent-cmd-run" title="Run command">▶</span>
                </div>
            `;
        }).join("");
    }

    bindEvents() {
        const searchInput = document.getElementById("history-search-input");
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                this.searchQuery = e.target.value;
                this.render();
            });
        }

        const catSelect = document.getElementById("history-category-select");
        if (catSelect) {
            catSelect.addEventListener("change", (e) => {
                this.selectedCategory = e.target.value;
                this.render();
            });
        }

        const clearBtn = document.getElementById("clear-history-btn");
        if (clearBtn) {
            clearBtn.addEventListener("click", () => {
                if (confirm("Are you sure you want to clear all command history?")) {
                    this.clearAll();
                }
            });
        }
    }

    escapeHtml(str) {
        if (!str) return "";
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
}

window.HistoryManager = new HistoryManager();
