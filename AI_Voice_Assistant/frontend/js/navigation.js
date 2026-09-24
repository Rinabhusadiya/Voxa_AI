/**
 * Voxa AI - Unified Navigation & Drawer Controller
 * Handles routing between all 9 application pages, mobile drawer, and active tab states.
 */

const Navigation = {
    activePage: "dashboard",

    init() {
        this.bindEvents();
    },

    navigateToPage(pageId) {
        if (!pageId) return;

        // Dismiss splash screen if active
        const splash = document.getElementById("page-splash");
        if (splash && splash.classList.contains("active")) {
            splash.classList.remove("active");
            splash.style.display = "none";
        }

        // Deactivate all page sections
        document.querySelectorAll(".voxa-page").forEach(page => {
            page.classList.remove("active");
            page.setAttribute("aria-hidden", "true");
        });

        // Activate target page
        const targetPage = document.getElementById(`page-${pageId}`);
        if (targetPage) {
            targetPage.classList.add("active");
            targetPage.setAttribute("aria-hidden", "false");
            this.activePage = pageId;
            window.scrollTo({ top: 0, behavior: "smooth" });
        }

        // Update active class on all navigation buttons (sidebar, drawer, mobile bottom bar)
        document.querySelectorAll("[data-nav-target]").forEach(btn => {
            if (btn.getAttribute("data-nav-target") === pageId) {
                btn.classList.add("active");
                btn.setAttribute("aria-selected", "true");
            } else {
                btn.classList.remove("active");
                btn.setAttribute("aria-selected", "false");
            }
        });

        // Close mobile drawer if open
        this.closeMobileDrawer();

        // Refresh views
        if (pageId === "contacts" && window.ContactsManager) window.ContactsManager.render();
        if (pageId === "history" && window.HistoryManager) window.HistoryManager.render();
        if (pageId === "favorites" && window.FavoritesManager) window.FavoritesManager.render();
        if (pageId === "help" && typeof window.updateBridgeDiagnostics === "function") window.updateBridgeDiagnostics();

        window.dispatchEvent(new CustomEvent("voxa_page_navigated", { detail: { page: pageId } }));
    },

    openMobileDrawer() {
        const drawer = document.getElementById("mobile-side-drawer");
        const backdrop = document.getElementById("mobile-drawer-backdrop");
        if (drawer) {
            drawer.classList.add("open");
            drawer.setAttribute("aria-hidden", "false");
        }
        if (backdrop) backdrop.classList.add("open");
        document.body.style.overflow = "hidden";
    },

    closeMobileDrawer() {
        const drawer = document.getElementById("mobile-side-drawer");
        const backdrop = document.getElementById("mobile-drawer-backdrop");
        if (drawer) {
            drawer.classList.remove("open");
            drawer.setAttribute("aria-hidden", "true");
        }
        if (backdrop) backdrop.classList.remove("open");
        document.body.style.overflow = "";
    },

    toggleMobileDrawer() {
        const drawer = document.getElementById("mobile-side-drawer");
        if (drawer && drawer.classList.contains("open")) {
            this.closeMobileDrawer();
        } else {
            this.openMobileDrawer();
        }
    },

    bindEvents() {
        // Universal navigation target listener
        document.addEventListener("click", (e) => {
            const navBtn = e.target.closest("[data-nav-target]");
            if (navBtn) {
                const target = navBtn.getAttribute("data-nav-target");
                this.navigateToPage(target);
            }
        });

        // Hamburger button in mobile header
        const hamburgerBtn = document.getElementById("mobile-hamburger-btn");
        if (hamburgerBtn) {
            hamburgerBtn.addEventListener("click", () => this.toggleMobileDrawer());
        }

        // Close drawer button inside drawer
        const closeDrawerBtn = document.getElementById("close-drawer-btn");
        if (closeDrawerBtn) {
            closeDrawerBtn.addEventListener("click", () => this.closeMobileDrawer());
        }

        // Backdrop click closes drawer
        const backdrop = document.getElementById("mobile-drawer-backdrop");
        if (backdrop) {
            backdrop.addEventListener("click", () => this.closeMobileDrawer());
        }
    }
};

window.Navigation = Navigation;
window.navigateToPage = (pageId) => Navigation.navigateToPage(pageId);
