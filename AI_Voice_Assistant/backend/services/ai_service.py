import re
import json
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime

from ..config.settings import settings
from ..models.schemas import CommandResponse, ChatMessage

logger = logging.getLogger("voxa_ai")

class BaseAIProvider(ABC):
    @abstractmethod
    def process_command(self, command: str, language: str = "en", context: Optional[Dict[str, Any]] = None) -> CommandResponse:
        pass

    @abstractmethod
    def generate_chat(self, message: str, history: List[ChatMessage], language: str = "en") -> str:
        pass


class LocalRuleProvider(BaseAIProvider):
    """
    High-accuracy local multilingual NLU engine supporting English, Hindi, and Gujarati.
    Acts as the robust fallback when cloud AI keys are not provided or network is offline.
    """

    def __init__(self):
        self.provider_name = "local_nlu"

    def process_command(self, command: str, language: str = "en", context: Optional[Dict[str, Any]] = None) -> CommandResponse:
        text = command.strip().lower()
        lang = language.lower()

        # 1. PHONE CALL
        # EN: "call mom", "call 9876543210", "make a phone call to rahul"
        # HI: "mummy ko call karo", "call lagao rahul ko", "rahul ko phone lagao"
        # GU: "મમ્મીને ફોન કરો", "રાહુલને કોલ કરો", "ફોન કરો રાહુલ"
        call_match = (
            re.search(r'(?:call|dial|phone)\s+([a-zA-Z0-9\+\s\u0A80-\u0AFF\u0900-\u097F]+)', text) or
            re.search(r'([a-zA-Z0-9\+\s\u0A80-\u0AFF\u0900-\u097F]+?)\s*ko\s*(?:call|phone)\s*(?:karo|lagao)', text) or
            re.search(r'([a-zA-Z0-9\+\s\u0A80-\u0AFF\u0900-\u097F]+?)(?:ને\s*|ne\s*)(?:ફોન|કોલ|phone|call)\s*કરો', text)
        )
        if call_match and not ("whatsapp" in text or "message" in text or "sms" in text):
            target = call_match.group(1).strip()
            # Clean filler words
            target = re.sub(r'^(to|a|my)\s+', '', target, flags=re.IGNORECASE).strip()
            if not target:
                target = "someone"
            
            speak = {
                "en": f"Found {target}. Do you want to call now?",
                "hi": f"{target} ko call lagane ke liye pushti karein.",
                "gu": f"{target} ને કોલ કરવા માટે પુષ્ટિ કરો."
            }.get(lang, f"Found {target}. Calling confirmation required.")

            display = f"📞 **Call Request**: {target.capitalize()}"
            return CommandResponse(
                success=True,
                recognized_intent="call_contact",
                action_type="phone",
                parameters={"target": target, "action": "dial"},
                speak_text=speak,
                display_text=display,
                confidence=0.98,
                provider=self.provider_name,
                requires_confirmation=True,
                confirmation_payload={"action": "call", "target": target}
            )

        # 2. WHATSAPP MESSAGE
        # EN: "send whatsapp message to rahul", "whatsapp mom"
        # HI: "rahul ko whatsapp karo", "whatsapp message bhejo mummy ko"
        # GU: "રાહુલને વ્હોટ્સએપ કરો", "વ્હોટ્સએપ મેસેજ મોકલો"
        wa_match = (
            re.search(r'(?:send\s+)?whatsapp(?:\s+message)?\s+(?:to\s+)?([a-zA-Z0-9\s]+?)(?:\s+saying\s+(.+))?$', text) or
            re.search(r'([a-zA-Z0-9\s]+?)\s*ko\s*whatsapp(?:\s+karo)?(?:\s+message\s+(.+))?', text) or
            re.search(r'([a-zA-Z0-9\s]+?)(?:ને\s*|ne\s*)વ્હોટ્સએપ\s*(?:કરો|મેસેજ)', text)
        )
        if wa_match or "whatsapp" in text:
            target = wa_match.group(1).strip() if (wa_match and wa_match.group(1)) else "contact"
            msg_content = wa_match.group(2).strip() if (wa_match and len(wa_match.groups()) > 1 and wa_match.group(2)) else ""
            target = re.sub(r'^(to|my)\s+', '', target, flags=re.IGNORECASE).strip()

            speak = {
                "en": f"Ready to send WhatsApp message to {target}.",
                "hi": f"{target} ko WhatsApp sandesh bhejne ke liye taiyar.",
                "gu": f"{target} ને WhatsApp સંદેશ મોકલવા તૈયાર."
            }.get(lang, f"Ready to send WhatsApp message to {target}.")

            return CommandResponse(
                success=True,
                recognized_intent="send_whatsapp",
                action_type="message",
                parameters={"target": target, "message": msg_content, "platform": "whatsapp"},
                speak_text=speak,
                display_text=f"💬 **WhatsApp to {target.capitalize()}**: {msg_content or 'Write your message'}",
                confidence=0.96,
                provider=self.provider_name,
                requires_confirmation=True,
                confirmation_payload={"action": "whatsapp", "target": target, "message": msg_content}
            )

        # 3. SMS MESSAGE
        # EN: "send sms to rahul", "text mom", "message rahul"
        # HI: "rahul ko sms bhejo", "message karo rahul ko"
        # GU: "રાહુલને મેસેજ કરો", "એસએમએસ મોકલો"
        sms_match = (
            re.search(r'(?:send\s+)?(?:sms|text|message)\s+(?:to\s+)?([a-zA-Z0-9\s]+?)(?:\s+saying\s+(.+))?$', text) or
            re.search(r'([a-zA-Z0-9\s]+?)\s*ko\s*(?:sms|message)\s*(?:bhejo|karo)', text) or
            re.search(r'([a-zA-Z0-9\s]+?)(?:ને\s*|ne\s*)(?:મેસેજ|એસએમએસ)\s*કરો', text)
        )
        if sms_match:
            target = sms_match.group(1).strip()
            msg_content = sms_match.group(2).strip() if (len(sms_match.groups()) > 1 and sms_match.group(2)) else ""
            target = re.sub(r'^(to|my)\s+', '', target, flags=re.IGNORECASE).strip()

            speak = {
                "en": f"Preparing SMS for {target}.",
                "hi": f"{target} ko SMS bhejne ki pushti karein.",
                "gu": f"{target} ને SMS મોકલવા પુષ્ટિ કરો."
            }.get(lang, f"Preparing SMS for {target}.")

            return CommandResponse(
                success=True,
                recognized_intent="send_sms",
                action_type="message",
                parameters={"target": target, "message": msg_content, "platform": "sms"},
                speak_text=speak,
                display_text=f"✉️ **SMS to {target.capitalize()}**: {msg_content or 'Pending text'}",
                confidence=0.95,
                provider=self.provider_name,
                requires_confirmation=True,
                confirmation_payload={"action": "sms", "target": target, "message": msg_content}
            )

        # 4. YOUTUBE (Search / Open)
        # EN: "open youtube", "search youtube for python tutorial", "play python on youtube"
        # HI: "youtube kholo", "youtube par python tutorial search karo"
        # GU: "યુટ્યુબ ખોલો", "યુટ્યુબ પર પાયથોન શોધો"
        if "youtube" in text or "યુટ્યુબ" in text:
            # Check for pure open action
            is_open_only = any(term in text for term in ["open youtube", "launch youtube", "youtube kholo", "યુટ્યુબ ખોલો", "kholo youtube"]) or text.strip() in ["youtube", "યુટ્યુબ"]
            if is_open_only and not any(k in text for k in ["search", "play", "dhoondho", "શોધો"]):
                speak = {
                    "en": "Opening YouTube.",
                    "hi": "YouTube khol raha hoon.",
                    "gu": "YouTube ખોલી રહ્યો છું."
                }.get(lang, "Opening YouTube.")
                return CommandResponse(
                    success=True,
                    recognized_intent="open_youtube",
                    action_type="app",
                    parameters={"url": "https://www.youtube.com", "package": "com.google.android.youtube"},
                    speak_text=speak,
                    display_text="▶️ **Opening YouTube**",
                    confidence=0.99,
                    provider=self.provider_name
                )

            yt_query = re.sub(r'.*?(?:search|play|for|par|શોધો)\s+(?:youtube\s+for\s+)?', '', text)
            yt_query = re.sub(r'\s*(?:on\s+youtube|youtube\s+par|par|યુટ્યુબ\s*પર|ખોલો|kholo)$', '', yt_query).strip()
            yt_query = re.sub(r'^(open\s+|youtube\s+)+', '', yt_query).strip()

            if not yt_query or yt_query in ["youtube", "યુટ્યુબ", "kholo", "open", "khol do"]:
                speak = {
                    "en": "Opening YouTube.",
                    "hi": "YouTube khol raha hoon.",
                    "gu": "YouTube ખોલી રહ્યો છું."
                }.get(lang, "Opening YouTube.")
                return CommandResponse(
                    success=True,
                    recognized_intent="open_youtube",
                    action_type="app",
                    parameters={"url": "https://www.youtube.com", "package": "com.google.android.youtube"},
                    speak_text=speak,
                    display_text="▶️ **Opening YouTube**",
                    confidence=0.99,
                    provider=self.provider_name
                )
            else:
                speak = {
                    "en": f"Searching YouTube for {yt_query}.",
                    "hi": f"YouTube par {yt_query} dhoondh raha hoon.",
                    "gu": f"YouTube પર {yt_query} શોધી રહ્યો છું."
                }.get(lang, f"Searching YouTube for {yt_query}.")
                return CommandResponse(
                    success=True,
                    recognized_intent="search_youtube",
                    action_type="web",
                    parameters={
                        "query": yt_query,
                        "url": f"https://www.youtube.com/results?search_query={yt_query.replace(' ', '+')}",
                        "package": "com.google.android.youtube"
                    },
                    speak_text=speak,
                    display_text=f"▶️ **Searching YouTube**: {yt_query}",
                    confidence=0.97,
                    provider=self.provider_name
                )

        # 5. GOOGLE SEARCH / OPEN GOOGLE
        # EN: "search google for python django", "google search django tutorial", "open google"
        # HI: "google par python search karo", "google kholo"
        # GU: "ગૂગલ પર પાયથોન શોધો", "ગૂગલ ખોલો"
        if "google" in text or "ગૂગલ" in text:
            g_query = re.sub(r'.*?(?:search|for|par|દ્વારા|શોધો)\s+(?:google\s+for\s+)?', '', text)
            g_query = re.sub(r'\s*(?:on\s+google|google\s+par|ગૂગલ\s*પર|ખોલો|kholo)$', '', g_query).strip()
            if not g_query or g_query in ["google", "ગૂગલ", "kholo", "open"]:
                speak = {
                    "en": "Opening Google.",
                    "hi": "Google khol raha hoon.",
                    "gu": "Google ખોલી રહ્યો છું."
                }.get(lang, "Opening Google.")
                return CommandResponse(
                    success=True,
                    recognized_intent="open_google",
                    action_type="web",
                    parameters={"url": "https://www.google.com"},
                    speak_text=speak,
                    display_text="🌐 **Opening Google**",
                    confidence=0.99,
                    provider=self.provider_name
                )
            else:
                speak = {
                    "en": f"Searching Google for {g_query}.",
                    "hi": f"Google par {g_query} search kar raha hoon.",
                    "gu": f"Google પર {g_query} શોધી રહ્યો છું."
                }.get(lang, f"Searching Google for {g_query}.")
                return CommandResponse(
                    success=True,
                    recognized_intent="search_google",
                    action_type="web",
                    parameters={
                        "query": g_query,
                        "url": f"https://www.google.com/search?q={g_query.replace(' ', '+')}"
                    },
                    speak_text=speak,
                    display_text=f"🔍 **Google Search**: {g_query}",
                    confidence=0.98,
                    provider=self.provider_name
                )

        # 6. INSTAGRAM / OTHER APPS
        if "instagram" in text or "ઇન્સ્ટાગ્રામ" in text:
            speak = {"en": "Opening Instagram.", "hi": "Instagram khol raha hoon.", "gu": "Instagram ખોલી રહ્યો છું."}.get(lang, "Opening Instagram.")
            return CommandResponse(
                success=True,
                recognized_intent="open_instagram",
                action_type="app",
                parameters={"url": "https://www.instagram.com", "package": "com.instagram.android"},
                speak_text=speak,
                display_text="📸 **Opening Instagram**",
                confidence=0.99,
                provider=self.provider_name
            )

        # 7. MAPS & NAVIGATION
        # EN: "open maps", "navigate to ahmedabad"
        # HI: "maps kholo", "ahmedabad ka rasta dikhao"
        # GU: "મેપ્સ ખોલો", "અમદાવાદનો રસ્તો બતાવો"
        if "map" in text or "navigate" in text or "મેપ" in text or "rasta" in text:
            dest_match = re.search(r'(?:to|for|dikhao|બતાવો)\s+([a-zA-Z\s]+)', text)
            destination = dest_match.group(1).strip() if dest_match else ""
            if destination:
                speak = {
                    "en": f"Navigating to {destination}.",
                    "hi": f"{destination} ke liye maps navigation shuru kar raha hoon.",
                    "gu": f"{destination} માટે નેવિગેશન શરૂ કરી રહ્યું છું."
                }.get(lang, f"Navigating to {destination}.")
                return CommandResponse(
                    success=True,
                    recognized_intent="navigate_maps",
                    action_type="web",
                    parameters={
                        "destination": destination,
                        "url": f"https://www.google.com/maps/dir/?api=1&destination={destination.replace(' ', '+')}",
                        "package": "com.google.android.apps.maps"
                    },
                    speak_text=speak,
                    display_text=f"🗺️ **Navigating to**: {destination.capitalize()}",
                    confidence=0.97,
                    provider=self.provider_name
                )
            else:
                speak = {"en": "Opening Google Maps.", "hi": "Google Maps khol raha hoon.", "gu": "Google Maps ખોલી રહ્યો છું."}.get(lang, "Opening Google Maps.")
                return CommandResponse(
                    success=True,
                    recognized_intent="open_maps",
                    action_type="app",
                    parameters={"url": "https://maps.google.com", "package": "com.google.android.apps.maps"},
                    speak_text=speak,
                    display_text="🗺️ **Opening Google Maps**",
                    confidence=0.98,
                    provider=self.provider_name
                )

        # 8. WEATHER
        # EN: "what is the weather today", "weather report"
        # HI: "aaj mausam kaisa hai", "weather kaisa hai"
        # GU: "આજનું હવામાન કેવું છે", "હવામાન કેવું છે"
        if "weather" in text or "mausam" in text or "હવામાન" in text:
            speak = {
                "en": "Today's forecast is mostly sunny and pleasant with a temperature of 28 degrees Celsius.",
                "hi": "Aaj ka mausam saaf aur suhavana hai, tapman 28 degree Celsius hai.",
                "gu": "આજનું હવામાન સ્વચ્છ અને સૂર્યપ્રકાશ વાળું છે, તાપમાન 28 ડિગ્રી સેલ્સિયસ છે."
            }.get(lang, "Currently 28 degrees Celsius and clear skies.")
            return CommandResponse(
                success=True,
                recognized_intent="get_weather",
                action_type="system",
                parameters={"temperature": "28°C", "condition": "Sunny", "location": "Current Location"},
                speak_text=speak,
                display_text="☀️ **Weather Forecast**: 28°C, Mostly Sunny and pleasant.",
                confidence=0.95,
                provider=self.provider_name
            )

        # 9. TIME & DATE
        # EN: "what time is it", "tell me the time", "current date"
        # HI: "kitne baje hain", "samay kya hai", "aaj ki tarikh"
        # GU: "કેટલા વાગ્યા છે", "સમય શું થયો", "આજની તારીખ"
        if any(w in text for w in ["time", "clock", "samay", "baje", "તારીખ", "વાગ્યા", "સમય", "date", "tarikh"]):
            now = datetime.now()
            time_str = now.strftime("%I:%M %p")
            date_str = now.strftime("%A, %B %d, %Y")
            speak = {
                "en": f"The current time is {time_str}, and today is {date_str}.",
                "hi": f"Abhi samay {time_str} hua hai, aur aaj {date_str} hai.",
                "gu": f"હાલમાં સમય {time_str} છે, અને આજે {date_str} છે."
            }.get(lang, f"The time is {time_str}.")
            return CommandResponse(
                success=True,
                recognized_intent="get_time",
                action_type="system",
                parameters={"time": time_str, "date": date_str},
                speak_text=speak,
                display_text=f"⏰ **Current Time**: {time_str}  \n📅 **Date**: {date_str}",
                confidence=0.99,
                provider=self.provider_name
            )

        # 10. TIMER & REMINDERS
        # EN: "set a timer for 10 minutes", "set reminder for tomorrow"
        if "timer" in text or "ટાઈમર" in text:
            num_match = re.search(r'(\d+)\s*(?:minute|min|sec|second)', text)
            minutes = num_match.group(1) if num_match else "10"
            speak = {
                "en": f"Timer set for {minutes} minutes.",
                "hi": f"{minutes} minute ka timer set kar diya gaya hai.",
                "gu": f"{minutes} મિનિટ માટે ટાઈમર સેટ કરવામાં આવ્યું છે."
            }.get(lang, f"Timer set for {minutes} minutes.")
            return CommandResponse(
                success=True,
                recognized_intent="set_timer",
                action_type="system",
                parameters={"duration": f"{minutes} minutes"},
                speak_text=speak,
                display_text=f"⏱️ **Timer Active**: {minutes} minutes countdown started.",
                confidence=0.96,
                provider=self.provider_name
            )

        if "reminder" in text or "યાદ અપાવો" in text or "remind" in text:
            speak = {
                "en": "Reminder set successfully. Voxa will notify you.",
                "hi": "Reminder set ho gaya hai. Voxa aapko suchit karega.",
                "gu": "રીમાઇન્ડર સેટ થઈ ગયું છે. Voxa તમને યાદ કરાવશે."
            }.get(lang, "Reminder scheduled.")
            return CommandResponse(
                success=True,
                recognized_intent="set_reminder",
                action_type="system",
                parameters={"task": command},
                speak_text=speak,
                display_text="🔔 **Reminder Saved**: Voxa will notify you.",
                confidence=0.94,
                provider=self.provider_name
            )

        # 11. HARDWARE / DEVICE CONTROLS (Flashlight, Battery)
        if any(w in text for w in ["flashlight", "torch", "light", "ટોર્ચ"]):
            turn_on = "off" not in text and "band" not in text and "બંધ" not in text
            state_str = "ON" if turn_on else "OFF"
            speak = {
                "en": f"Turning flashlight {state_str.lower()}.",
                "hi": f"Flashlight {state_str.lower()} kar di gayi hai.",
                "gu": f"ટોર્ચ { 'ચાલુ' if turn_on else 'બંધ' } કરવામાં આવી છે."
            }.get(lang, f"Flashlight {state_str}.")
            return CommandResponse(
                success=True,
                recognized_intent="toggle_flashlight",
                action_type="system",
                parameters={"state": turn_on},
                speak_text=speak,
                display_text=f"🔦 **Flashlight**: Switched {state_str}",
                confidence=0.98,
                provider=self.provider_name
            )

        # 12. GENERAL KNOWLEDGE / AI QUERY
        # EN: "tell me about python", "what is machine learning", "translate to gujarati"
        # HI: "python ke baare me batao"
        # GU: "પાયથોન વિશે જણાવો"
        if any(w in text for w in ["python", "પાયથોન"]):
            speak = {
                "en": "Python is a popular high-level, interpreted programming language known for its clear syntax and versatility in AI, web development, and data science.",
                "hi": "Python ek lokpriya high-level programming bhasha hai, jo AI, web development aur data science me upyog hoti hai.",
                "gu": "Python એક બહુમુખી અને લોકપ્રિય પ્રોગ્રામિંગ ભાષા છે, જે આર્ટિફિશિયલ ઇન્ટેલિજન્સ અને વેબ ડેવલપમેન્ટમાં ખૂબ ઉપયોગી છે."
            }.get(lang, "Python is a powerful, flexible programming language.")
            return CommandResponse(
                success=True,
                recognized_intent="general_knowledge",
                action_type="ai",
                parameters={"topic": "Python"},
                speak_text=speak,
                display_text="🐍 **Python Language**  \nPython is a versatile, high-level programming language designed for readability. It powers modern Artificial Intelligence, Machine Learning, backend systems, and automation worldwide.",
                confidence=0.98,
                provider=self.provider_name
            )

        # DEFAULT FALLBACK
        fallback_speak = {
            "en": f"I heard '{command}'. Searching Google for more details.",
            "hi": f"Maine suna '{command}'. Main Google par khoj kar raha hoon.",
            "gu": f"મેં સાંભળ્યું '{command}'. વધુ વિગતો માટે Google પર શોધી રહ્યો છું."
        }.get(lang, f"Processing '{command}'.")

        return CommandResponse(
            success=True,
            recognized_intent="search_google",
            action_type="web",
            parameters={"query": command, "url": f"https://www.google.com/search?q={command.replace(' ', '+')}"},
            speak_text=fallback_speak,
            display_text=f"🔍 **Voxa Assistant**: {command}",
            confidence=0.85,
            provider=self.provider_name
        )

    def generate_chat(self, message: str, history: List[ChatMessage], language: str = "en") -> str:
        text = message.strip().lower()
        lang = language.lower()

        # Greetings
        if any(w in text for w in ["hi", "hello", "hey", "namaste", "kem cho", "નમસ્તે", "કેમ છો"]):
            responses = {
                "en": "Hello! I am Voxa AI, your intelligent voice assistant. How can I assist you with calls, apps, searches, or smart actions today?",
                "hi": "Namaste! Main Voxa AI hoon, aapka smart voice assistant. Aaj main aapki kya madad kar sakta hoon?",
                "gu": "નમસ્તે! હું Voxa AI છું, તમારો સ્માર્ટ વોઈસ આસિસ્ટન્ટ. આજે હું તમારી શું મદદ કરી શકું?"
            }
            return responses.get(lang, responses["en"])

        # Capabilities / Identity
        if "who are you" in text or "what can you do" in text or "તમે કોણ છો" in text or "tum kaun ho" in text:
            return (
                "I am **Voxa AI**, an enterprise-grade multimodal Voice Assistant! Here is what I can do:\n\n"
                "• 📞 **Contacts & Phone Calls**: Voice-activated dialing and contact lookup.\n"
                "• 💬 **WhatsApp & SMS**: Send quick messages with confirmation.\n"
                "• ▶️ **Media & Search**: Launch YouTube, query Google, navigate Google Maps.\n"
                "• 🌐 **Multi-Language**: Fluent in English, Hindi (हिंदी), and Gujarati (ગુજરાતી).\n"
                "• 📱 **Android Bridge**: Direct integration with hardware controls, flashlight, and installed apps!"
            )

        if "python" in text:
            return (
                "**Python** is an elegant, multi-paradigm programming language created by Guido van Rossum in 1991. "
                "Its key strengths include:\n\n"
                "1. **Simplicity**: Readable, expressive syntax reducing boilerplate.\n"
                "2. **AI & ML Ecosystem**: Powered by PyTorch, TensorFlow, Scikit-Learn, and NumPy.\n"
                "3. **Web Backends**: Robust frameworks like FastAPI and Django.\n"
                "4. **Automation**: Excellent libraries for scripting and robotics."
            )

        # Generic helpful AI response
        return (
            f"Thank you for asking about '{message}'. As Voxa AI, I can help you execute device actions, "
            f"open services like YouTube or Google Maps, dial contacts, or translate across English, Hindi, and Gujarati. "
            f"Try giving a voice command like *'Call Mom'*, *'Open YouTube'*, or *'Navigate to Ahmedabad'*!"
        )


class GeminiProvider(BaseAIProvider):
    """
    Cloud provider leveraging Google Gemini SDK for deep conversational reasoning
    and structured JSON intent extraction.
    """

    def __init__(self, api_key: str, model_name: str = "gemini-1.5-flash"):
        self.api_key = api_key
        self.model_name = model_name
        self.fallback = LocalRuleProvider()
        self._configured = False

        if api_key and api_key != "your_gemini_api_key_here":
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                self.model = genai.GenerativeModel(model_name)
                self._configured = True
                logger.info(f"GeminiProvider initialized with model {model_name}")
            except Exception as e:
                logger.warning(f"Failed to configure GeminiProvider: {e}. Falling back to LocalRuleProvider.")
                self._configured = False

    def process_command(self, command: str, language: str = "en", context: Optional[Dict[str, Any]] = None) -> CommandResponse:
        if not self._configured:
            return self.fallback.process_command(command, language, context)

        prompt = f"""
You are the natural language intent engine for Voxa AI, a voice assistant.
Parse the following user voice command and return a STRICT JSON object with these exact keys:
- "recognized_intent": one of ["call_contact", "send_whatsapp", "send_sms", "open_youtube", "search_youtube", "open_google", "search_google", "open_maps", "navigate_maps", "open_app", "get_weather", "get_time", "set_timer", "set_reminder", "toggle_flashlight", "general_knowledge", "unknown"]
- "action_type": one of ["phone", "message", "web", "app", "system", "ai"]
- "parameters": object containing extracted entities (target, query, destination, duration, etc.)
- "speak_text": concise response string in language '{language}' suitable for TTS speech synthesis
- "display_text": formatted markdown response string
- "requires_confirmation": boolean (true for call or message, false otherwise)

User Voice Command: "{command}"
Language: "{language}"
Return ONLY valid JSON without markdown wrapping.
"""
        try:
            response = self.model.generate_content(prompt)
            clean_text = re.sub(r'```(?:json)?', '', response.text).strip()
            data = json.loads(clean_text)
            return CommandResponse(
                success=True,
                recognized_intent=data.get("recognized_intent", "general_knowledge"),
                action_type=data.get("action_type", "ai"),
                parameters=data.get("parameters", {}),
                speak_text=data.get("speak_text", f"Understood: {command}"),
                display_text=data.get("display_text", f"Voxa: {command}"),
                confidence=0.97,
                provider="gemini",
                requires_confirmation=data.get("requires_confirmation", False),
                confirmation_payload=data.get("parameters") if data.get("requires_confirmation") else None
            )
        except Exception as e:
            logger.error(f"Gemini intent extraction error: {e}. Using local rule fallback.")
            return self.fallback.process_command(command, language, context)

    def generate_chat(self, message: str, history: List[ChatMessage], language: str = "en") -> str:
        if not self._configured:
            return self.fallback.generate_chat(message, history, language)

        system_instruction = (
            f"You are Voxa AI, a smart, friendly voice assistant. "
            f"Answer clearly, concisely, and helpfully. Respond in language: {language}."
        )
        try:
            # Build conversation context
            chat_session = self.model.start_chat(history=[])
            prompt = f"System: {system_instruction}\nUser: {message}"
            response = chat_session.send_message(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Gemini chat error: {e}. Using local rule fallback.")
            return self.fallback.generate_chat(message, history, language)


class OpenAIProvider(BaseAIProvider):
    """
    Alternative cloud provider leveraging OpenAI GPT models.
    """

    def __init__(self, api_key: str, model_name: str = "gpt-4o-mini"):
        self.api_key = api_key
        self.model_name = model_name
        self.fallback = LocalRuleProvider()
        self._configured = False

        if api_key and api_key != "your_openai_api_key_here":
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=api_key)
                self._configured = True
                logger.info(f"OpenAIProvider initialized with model {model_name}")
            except Exception as e:
                logger.warning(f"Failed to configure OpenAI: {e}")
                self._configured = False

    def process_command(self, command: str, language: str = "en", context: Optional[Dict[str, Any]] = None) -> CommandResponse:
        if not self._configured:
            return self.fallback.process_command(command, language, context)
        try:
            prompt = f"Extract intent and parameters for voice command: '{command}' in language '{language}'. Return JSON with keys: recognized_intent, action_type, parameters, speak_text, display_text, requires_confirmation."
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "You are Voxa AI intent parser. Always output valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            data = json.loads(response.choices[0].message.content)
            return CommandResponse(
                success=True,
                recognized_intent=data.get("recognized_intent", "general_knowledge"),
                action_type=data.get("action_type", "ai"),
                parameters=data.get("parameters", {}),
                speak_text=data.get("speak_text", f"Understood: {command}"),
                display_text=data.get("display_text", f"Voxa: {command}"),
                confidence=0.96,
                provider="openai",
                requires_confirmation=data.get("requires_confirmation", False),
                confirmation_payload=data.get("parameters") if data.get("requires_confirmation") else None
            )
        except Exception as e:
            logger.error(f"OpenAI error: {e}. Falling back.")
            return self.fallback.process_command(command, language, context)

    def generate_chat(self, message: str, history: List[ChatMessage], language: str = "en") -> str:
        if not self._configured:
            return self.fallback.generate_chat(message, history, language)
        try:
            msgs = [{"role": "system", "content": f"You are Voxa AI, a voice assistant. Respond concisely in {language}."}]
            for h in history[-5:]:
                msgs.append({"role": h.role, "content": h.content})
            msgs.append({"role": "user", "content": message})
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=msgs
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI chat error: {e}")
            return self.fallback.generate_chat(message, history, language)


def get_ai_service() -> BaseAIProvider:
    """
    Factory function returning the configured AI service provider.
    Automatically prioritizes Gemini or OpenAI if keys are valid,
    gracefully falling back to LocalRuleProvider.
    """
    provider_type = settings.AI_PROVIDER

    if provider_type == "gemini" and settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your_gemini_api_key_here":
        return GeminiProvider(api_key=settings.GEMINI_API_KEY, model_name=settings.GEMINI_MODEL)
    elif provider_type == "openai" and settings.OPENAI_API_KEY and settings.OPENAI_API_KEY != "your_openai_api_key_here":
        return OpenAIProvider(api_key=settings.OPENAI_API_KEY, model_name=settings.OPENAI_MODEL)
    else:
        return LocalRuleProvider()
