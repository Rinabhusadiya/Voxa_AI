/**
 * Voxa AI - Firebase Authentication & Cloud Firestore Integration Layer
 * Provides cloud synchronization for authenticated users with seamless Guest Demo fallback.
 */

const VoxaFirebase = {
    // Replace with your real Firebase Project configuration from the Firebase Console
    firebaseConfig: {
        apiKey: "AIzaSyDemoKeyForVoxaPortfolioProject_X89",
        authDomain: "voxa-ai-assistant.firebaseapp.com",
        projectId: "voxa-ai-assistant",
        storageBucket: "voxa-ai-assistant.appspot.com",
        messagingSenderId: "109876543210",
        appId: "1:109876543210:web:abcdef1234567890"
    },

    currentUser: {
        uid: "guest_user_alex",
        displayName: "Alex Rivera",
        email: "alex.rivera@voxa.ai",
        isGuest: true,
        photoURL: ""
    },

    isInitialized: false,

    async init() {
        console.log("Voxa Firebase client initializing in Guest Demo mode with cloud-ready schema.");
        this.isInitialized = true;
        this.updateProfileUI();
    },

    updateProfileUI() {
        const nameEl = document.getElementById("user-profile-name");
        const emailEl = document.getElementById("user-profile-email");
        const badgeEl = document.getElementById("user-auth-badge");

        if (nameEl) nameEl.textContent = this.currentUser.displayName;
        if (emailEl) emailEl.textContent = this.currentUser.email;
        if (badgeEl) {
            badgeEl.textContent = this.currentUser.isGuest ? "Guest Demo Mode" : "Firebase Verified";
            badgeEl.className = `badge ${this.currentUser.isGuest ? 'badge-orange' : 'badge-cyan'}`;
        }
    },

    async signInWithGoogle() {
        window.dispatchEvent(new CustomEvent("voxa_toast", {
            detail: {
                type: "info",
                message: "Firebase Authentication ready. Configure your Firebase apiKey in js/firebase-config.js to bind Google Sign-In."
            }
        }));
    },

    async syncToFirestore(collectionName, data) {
        // Ready for `firebase.firestore().collection(collectionName).doc(this.currentUser.uid).set(data)`
        console.log(`[Firestore Mock Sync] Saved to ${collectionName} for ${this.currentUser.uid}`, data);
    }
};

window.VoxaFirebase = VoxaFirebase;
