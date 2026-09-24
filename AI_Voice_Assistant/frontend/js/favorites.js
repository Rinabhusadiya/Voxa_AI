/**
 * Voxa AI - Favorite Commands Management
 * Quick-execution shortcuts for voice commands.
 */

class FavoritesManager {
    constructor() {
        this.STORAGE_KEY = "voxa_favorites";
        this.favorites = [];

        this.init();
    }

    init() {
        this.loadFavorites();
        this.bindEvents();
    }

    getDefaultFavorites() {
        return [
            { id: "fav1", title: "Call Mom", command: "Call Mom", icon: "📞", color: "purple", category: "Phone" },
            { id: "fav2", title: "Open YouTube", command: "Open YouTube", icon: "▶️", color: "cyan", category: "App" },
            { id: "fav3", title: "Navigate Maps", command: "Navigate to Ahmedabad", icon: "🗺️", color: "orange", category: "Maps" },
            { id: "fav4", title: "Search Python", command: "Search Google for Python tutorial", icon: "🔍", color: "cyan", category: "Web" },
            { id: "fav5", title: "Check Weather", command: "What is the weather today?", icon: "☀️", color: "orange", category: "System" },
            { id: "fav6", title: "WhatsApp Rahul", command: "Send WhatsApp message to Rahul", icon: "💬", color: "purple", category: "Message" }
        ];
    }

    loadFavorites() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                this.favorites = JSON.parse(stored);
            } catch (e) {
                this.favorites = this.getDefaultFavorites();
            }
        } else {
            this.favorites = this.getDefaultFavorites();
            this.saveFavorites();
        }
    }

    saveFavorites() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.favorites));
        this.render();
        this.renderDashboardFavorites();
        window.dispatchEvent(new CustomEvent("voxa_favorites_updated", { detail: { favorites: this.favorites } }));
    }

    addFavorite(title, command, icon = "⚡", category = "Custom") {
        if (!command || !command.trim()) return;
        const newFav = {
            id: `fav_${Date.now()}`,
            title: title.trim() || command.trim(),
            command: command.trim(),
            icon: icon || "⚡",
            color: ["purple", "cyan", "orange"][Math.floor(Math.random() * 3)],
            category: category || "Custom"
        };
        this.favorites.push(newFav);
        this.saveFavorites();
        window.dispatchEvent(new CustomEvent("voxa_toast", {
            detail: { type: "success", message: `Shortcut "${newFav.title}" added to favorites!` }
        }));
    }

    removeFavorite(id) {
        this.favorites = this.favorites.filter(f => f.id !== id);
        this.saveFavorites();
    }

    executeFavorite(command) {
        if (window.CommandDispatcher) {
            window.CommandDispatcher.processCommand(command);
        }
    }

    render() {
        const container = document.getElementById("favorites-grid-container");
        if (!container) return;

        if (this.favorites.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⭐</div>
                    <p data-i18n="noFavorites">${I18N.t("noFavorites")}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.favorites.map(fav => `
            <div class="favorite-card glass-card card-${fav.color}" data-id="${fav.id}">
                <div class="fav-header">
                    <span class="fav-icon">${fav.icon}</span>
                    <button class="btn-del-fav" data-id="${fav.id}" title="Remove shortcut">✕</button>
                </div>
                <div class="fav-body">
                    <h4 class="fav-title">${this.escapeHtml(fav.title)}</h4>
                    <p class="fav-command">"${this.escapeHtml(fav.command)}"</p>
                </div>
                <button class="btn-run-fav" data-command="${this.escapeHtml(fav.command)}">
                    <span>${I18N.t("runNow")}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                </button>
            </div>
        `).join("");

        container.querySelectorAll(".btn-run-fav").forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const cmd = btn.getAttribute("data-command");
                this.executeFavorite(cmd);
            };
        });

        container.querySelectorAll(".btn-del-fav").forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const id = btn.getAttribute("data-id");
                this.removeFavorite(id);
            };
        });
    }

    renderDashboardFavorites() {
        const dashContainer = document.getElementById("dashboard-favorites-container");
        if (!dashContainer) return;

        const topFavs = this.favorites.slice(0, 4);
        if (topFavs.length === 0) {
            dashContainer.innerHTML = `<p class="text-muted" data-i18n="noFavorites">${I18N.t("noFavorites")}</p>`;
            return;
        }

        const favsHtml = topFavs.map(fav => `
            <div class="dash-fav-card glass-card" onclick="FavoritesManager.executeFavorite('${this.escapeHtml(fav.command)}')" role="button" tabindex="0" title="Click to run shortcut">
                <span class="dash-fav-icon">${fav.icon}</span>
                <div class="dash-fav-info">
                    <span class="dash-fav-name">${this.escapeHtml(fav.title)}</span>
                    <span class="dash-fav-cmd">"${this.escapeHtml(fav.command)}"</span>
                </div>
                <span class="dash-fav-run">▶</span>
            </div>
        `).join("");

        const addShortcutCard = `
            <div class="dash-fav-add-card glass-card" onclick="Actions.openAddShortcutModal()" role="button" tabindex="0" title="Add new favorite shortcut">
                <span>➕</span>
                <span style="font-weight: 600; font-size: 13px;">Add Shortcut</span>
            </div>
        `;

        dashContainer.innerHTML = favsHtml + addShortcutCard;
    }

    bindEvents() {
        const addBtn = document.getElementById("add-favorite-btn");
        if (addBtn) {
            addBtn.addEventListener("click", () => {
                if (window.Actions) window.Actions.openAddShortcutModal();
            });
        }
    }

    escapeHtml(str) {
        if (!str) return "";
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
}

window.FavoritesManager = new FavoritesManager();
