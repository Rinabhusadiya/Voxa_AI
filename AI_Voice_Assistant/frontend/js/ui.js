/**
 * Voxa AI - UI Utilities & Modal Controller
 * Provides modal management, confirmation dialogs, and toast notifications.
 */

const UI = {
    activeModal: null,

    init() {
        // Close modal when clicking outside modal-card on backdrop
        document.querySelectorAll(".modal-overlay").forEach(modal => {
            modal.addEventListener("click", (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Global Escape key closes active modal
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && this.activeModal) {
                this.closeModal();
            }
        });
    },

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // Close any previously opened modal
        if (this.activeModal && this.activeModal !== modal) {
            this.activeModal.classList.remove("active");
            this.activeModal.setAttribute("aria-hidden", "true");
        }

        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");
        this.activeModal = modal;

        // Focus first input or button in modal for accessibility
        const focusable = modal.querySelector("input, select, textarea, button");
        if (focusable) {
            setTimeout(() => focusable.focus(), 80);
        }

        // Trap focus & listen to Escape key
        document.body.style.overflow = "hidden";
    },

    closeModal(modalId = null) {
        const modal = modalId ? document.getElementById(modalId) : this.activeModal;
        if (!modal) return;

        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
        if (this.activeModal === modal) {
            this.activeModal = null;
        }

        // Restore body scroll if no modals open
        const anyOpen = document.querySelector(".modal-overlay.active");
        if (!anyOpen) {
            document.body.style.overflow = "";
        }
    },

    closeAllModals() {
        document.querySelectorAll(".modal-overlay.active").forEach(m => {
            m.classList.remove("active");
            m.setAttribute("aria-hidden", "true");
        });
        this.activeModal = null;
        document.body.style.overflow = "";
    },

    /**
     * Show Confirmation Modal Dialog
     * @param {Object} options - { title, message, avatarInitials, confirmText, cancelText, onConfirm, onCancel }
     */
    openConfirmationModal({ title, message, avatarInitials = "📞", confirmText = "Confirm", cancelText = "Cancel", onConfirm = null, onCancel = null }) {
        const modal = document.getElementById("modal-call-confirm");
        if (!modal) return;

        const titleEl = document.getElementById("modal-call-name");
        const promptEl = document.getElementById("modal-call-prompt-text");
        const avatarEl = document.getElementById("modal-call-avatar");
        const confirmBtn = document.getElementById("modal-call-confirm-btn");
        const cancelBtn = document.getElementById("modal-call-cancel-btn");

        if (titleEl) titleEl.textContent = title;
        if (promptEl) promptEl.textContent = message;
        if (avatarEl) avatarEl.textContent = avatarInitials;
        if (confirmBtn) confirmBtn.textContent = confirmText;
        if (cancelBtn) cancelBtn.textContent = cancelText;

        confirmBtn.onclick = () => {
            this.closeModal("modal-call-confirm");
            if (typeof onConfirm === "function") onConfirm();
        };

        cancelBtn.onclick = () => {
            this.closeModal("modal-call-confirm");
            if (typeof onCancel === "function") onCancel();
        };

        this.openModal("modal-call-confirm");
    },

    /**
     * Global Toast Notification
     * @param {'info'|'success'|'warning'|'error'} type 
     * @param {string} message 
     */
    showToast(type, message) {
        const container = document.getElementById("voxa-toast-container");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `voxa-toast toast-${type} glass-card`;
        toast.setAttribute("role", "alert");

        const icon = {
            success: "✓",
            error: "⚠",
            warning: "!",
            info: "ℹ"
        }[type] || "ℹ";

        toast.innerHTML = `<span class="toast-icon" aria-hidden="true">${icon}</span> <span class="toast-msg">${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add("toast-fade-out");
            setTimeout(() => toast.remove(), 400);
        }, 3600);
    }
};

// Global escape key listener to close modals & drawers
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        UI.closeAllModals();
        if (window.Navigation) {
            window.Navigation.closeMobileDrawer();
        }
    }
});

// Close modal when clicking backdrop
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
        UI.closeModal(e.target.id);
    }
});

window.UI = UI;
window.showToast = (type, msg) => UI.showToast(type, msg);
