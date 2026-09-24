/**
 * Voxa AI - Conversational AI Chat Studio
 * ChatGPT-style conversational assistant with voice prompt, TTS readout, and copy actions.
 */

class ChatStudio {
    constructor() {
        this.STORAGE_KEY = "voxa_chat_history";
        this.messages = [];
        this.BACKEND_URL = (typeof window !== "undefined" && window.location.origin && window.location.origin.startsWith("http"))
            ? window.location.origin
            : "http://localhost:8005";

        this.init();
    }

    init() {
        this.loadChat();
        this.bindEvents();
    }

    getDefaultGreeting() {
        return [
            {
                role: "assistant",
                content: "Hello! I am **Voxa AI**, your conversational voice assistant. How can I help you today? You can ask me questions, practice commands, or dictate using the microphone.",
                timestamp: new Date().toISOString()
            }
        ];
    }

    loadChat() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                this.messages = JSON.parse(stored);
            } catch (e) {
                this.messages = this.getDefaultGreeting();
            }
        } else {
            this.messages = this.getDefaultGreeting();
            this.saveChat();
        }
    }

    saveChat() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.messages));
        this.render();
    }

    clearChat() {
        this.messages = this.getDefaultGreeting();
        this.saveChat();
    }

    async sendMessage(text) {
        if (!text || !text.trim()) return;

        const userMsg = {
            role: "user",
            content: text.trim(),
            timestamp: new Date().toISOString()
        };

        this.messages.push(userMsg);
        this.saveChat();

        // Show typing indicator
        this.renderTypingIndicator();

        const lang = I18N.currentLang || "en";
        let aiReply = "";

        // Query FastAPI backend
        try {
            const res = await fetch(`${this.BACKEND_URL}/api/voice/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMsg.content,
                    language: lang,
                    history: this.messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
                })
            });

            if (res.ok) {
                const data = await res.json();
                aiReply = data.reply;
            }
        } catch (e) {
            console.log("Chat backend offline, using local conversational fallback.", e);
        }

        // Local fallback if backend unavailable
        if (!aiReply) {
            aiReply = this.generateLocalReply(userMsg.content, lang);
        }

        this.removeTypingIndicator();

        const assistantMsg = {
            role: "assistant",
            content: aiReply,
            timestamp: new Date().toISOString()
        };

        this.messages.push(assistantMsg);
        this.saveChat();

        // If auto-speak enabled, read out
        if (VoiceEngine.autoSpeak) {
            VoiceEngine.speak(aiReply);
        }
    }

    generateLocalReply(query, lang) {
        const q = query.toLowerCase();
        if (q.includes("python")) {
            return "**Python** is a versatile, high-level programming language known for readability and efficiency. It is the premier language for Artificial Intelligence, Machine Learning, backend web development (FastAPI/Django), and automation scripts.";
        }
        if (q.includes("who are you") || q.includes("who made you") || q.includes("તમે કોણ છો") || q.includes("tum kaun ho")) {
            return "I am **Voxa AI**, a high-performance Multimodal Voice Assistant and device automation platform. I support full multilingual voice commands in **English**, **Hindi (हिन्दी)**, and **Gujarati (ગુજરાતી)**!";
        }
        if (q.includes("hello") || q.includes("hi") || q.includes("namaste") || q.includes("kem cho")) {
            const greetings = {
                en: "Hello there! What would you like to explore or automate with Voxa today?",
                hi: "Namaste! Main Voxa AI hoon. Aap mujhse koi bhi sawal pooch sakte hain ya command de sakte hain.",
                gu: "નમસ્તે! હું Voxa AI છું. તમે મને કોઈપણ પ્રશ્ન પૂછી શકો છો અથવા વૉઇસ કમાન્ડ આપી શકો છો."
            };
            return greetings[lang] || greetings.en;
        }

        return `Thank you for asking about **"${query}"**. As Voxa AI, I can help answer questions, trigger phone calls, launch YouTube videos, or search the web. Try clicking the microphone below or asking for something specific!`;
    }

    renderTypingIndicator() {
        const container = document.getElementById("chat-messages-container");
        if (!container) return;

        const typingDiv = document.createElement("div");
        typingDiv.id = "chat-typing-indicator";
        typingDiv.className = "chat-message assistant-message glass-card typing";
        typingDiv.innerHTML = `
            <div class="msg-avatar">🤖</div>
            <div class="msg-body">
                <div class="typing-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        container.appendChild(typingDiv);
        container.scrollTop = container.scrollHeight;
    }

    removeTypingIndicator() {
        const ind = document.getElementById("chat-typing-indicator");
        if (ind) ind.remove();
    }

    formatMarkdown(text) {
        if (!text) return "";
        let formatted = this.escapeHtml(text);
        // Bold
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Bullet points
        formatted = formatted.replace(/^\s*•\s*(.*)$/gm, '<li>$1</li>');
        formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        // Linebreaks
        formatted = formatted.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
        return formatted;
    }

    render() {
        const container = document.getElementById("chat-messages-container");
        if (!container) return;

        container.innerHTML = this.messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            return `
                <div class="chat-message ${isUser ? 'user-message' : 'assistant-message'} glass-card">
                    <div class="msg-avatar">${isUser ? '👤' : '🤖'}</div>
                    <div class="msg-body">
                        <div class="msg-sender">${isUser ? 'You' : 'Voxa AI'}</div>
                        <div class="msg-content">${this.formatMarkdown(msg.content)}</div>
                        ${!isUser ? `
                            <div class="msg-actions">
                                <button class="btn-chat-action btn-copy-msg" data-idx="${idx}" title="${I18N.t('copyMessage')}">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                    <span>${I18N.t("copyMessage")}</span>
                                </button>
                                <button class="btn-chat-action btn-speak-msg" data-idx="${idx}" title="${I18N.t('readAloud')}">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                                    <span>${I18N.t("readAloud")}</span>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join("");

        container.querySelectorAll(".btn-copy-msg").forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.getAttribute("data-idx"), 10);
                const msg = this.messages[idx];
                if (msg) {
                    navigator.clipboard.writeText(msg.content);
                    window.dispatchEvent(new CustomEvent("voxa_toast", {
                        detail: { type: "info", message: I18N.t("copiedToast") }
                    }));
                }
            };
        });

        container.querySelectorAll(".btn-speak-msg").forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.getAttribute("data-idx"), 10);
                const msg = this.messages[idx];
                if (msg) {
                    VoiceEngine.speak(msg.content);
                }
            };
        });

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    bindEvents() {
        const form = document.getElementById("chat-input-form");
        const input = document.getElementById("chat-text-input");
        const micBtn = document.getElementById("chat-mic-btn");
        const clearBtn = document.getElementById("clear-chat-btn");

        if (form && input) {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                const text = input.value;
                if (text && text.trim()) {
                    input.value = "";
                    this.sendMessage(text);
                }
            });
        }

        if (micBtn && input) {
            micBtn.addEventListener("click", () => {
                VoiceEngine.startListening();
                const handleFinal = (ev) => {
                    input.value = ev.detail.text;
                    window.removeEventListener("voxa_speech_final", handleFinal);
                    this.sendMessage(ev.detail.text);
                };
                window.addEventListener("voxa_speech_final", handleFinal, { once: true });
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener("click", () => {
                if (confirm("Clear conversation history?")) {
                    this.clearChat();
                }
            });
        }
    }

    escapeHtml(str) {
        if (!str) return "";
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
}

window.ChatStudio = new ChatStudio();
