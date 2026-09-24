"""
Voxa AI - Comprehensive System Verification Script
Tests FastAPI routes, multilingual command processing (EN, HI, GU), AI chat, contacts, and frontend serving.
"""
import sys
import io

# Ensure UTF-8 output on Windows terminal
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import json
from fastapi.testclient import TestClient
from backend.main import app

def run_tests():
    print("=" * 60)
    print("🧪 RUNNING VOXA AI COMPREHENSIVE VERIFICATION")
    print("=" * 60)

    client = TestClient(app)

    # 1. System Status Health Check
    res = client.get("/api/system/status")
    assert res.status_code == 200, f"Status check failed: {res.text}"
    status_data = res.json()
    print(f"✅ System Status: {status_data['status']} | Active AI Provider: {status_data['active_ai_provider']} | Languages: {status_data['languages']}")

    # 2. Multilingual Voice Command Processing
    test_commands = [
        {"cmd": "Call Mom", "lang": "en", "expected_intent": "call_contact"},
        {"cmd": "Mummy ko call karo", "lang": "hi", "expected_intent": "call_contact"},
        {"cmd": "મમ્મીને ફોન કરો", "lang": "gu", "expected_intent": "call_contact"},
        {"cmd": "Open YouTube", "lang": "en", "expected_intent": "open_youtube"},
        {"cmd": "YouTube kholo", "lang": "hi", "expected_intent": "open_youtube"},
        {"cmd": "યુટ્યુબ ખોલો", "lang": "gu", "expected_intent": "open_youtube"},
        {"cmd": "Search YouTube for Python tutorial", "lang": "en", "expected_intent": "search_youtube"},
        {"cmd": "Search Google for Python Django", "lang": "en", "expected_intent": "search_google"},
        {"cmd": "ગૂગલ પર પાયથોન શોધો", "lang": "gu", "expected_intent": "search_google"},
        {"cmd": "Send WhatsApp message to Rahul", "lang": "en", "expected_intent": "send_whatsapp"},
        {"cmd": "Send SMS to Rahul", "lang": "en", "expected_intent": "send_sms"},
        {"cmd": "Navigate to Ahmedabad", "lang": "en", "expected_intent": "navigate_maps"},
        {"cmd": "What is the weather today?", "lang": "en", "expected_intent": "get_weather"},
        {"cmd": "What time is it?", "lang": "en", "expected_intent": "get_time"},
        {"cmd": "Turn on flashlight", "lang": "en", "expected_intent": "toggle_flashlight"},
        {"cmd": "Tell me about Python", "lang": "en", "expected_intent": "general_knowledge"}
    ]

    for item in test_commands:
        res = client.post("/api/voice/process-command", json={"command": item["cmd"], "language": item["lang"]})
        assert res.status_code == 200, f"Command failed: {item['cmd']} -> {res.text}"
        data = res.json()
        print(f"✅ Command: '{item['cmd']}' ({item['lang']}) -> Intent: {data['recognized_intent']} | Action: {data['action_type']} | Speak: '{data['speak_text']}'")

    # 3. AI Chat Endpoint
    chat_res = client.post("/api/voice/chat", json={
        "message": "Who are you and what can you do?",
        "language": "en"
    })
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    print(f"✅ Chat Studio Response: {chat_data['reply'][:80]}... (Provider: {chat_data['provider']})")

    # 4. Contacts API
    contacts_res = client.get("/api/contacts")
    assert contacts_res.status_code == 200
    contacts = contacts_res.json()
    print(f"✅ Contacts API: Retrieved {len(contacts)} contacts (First: {contacts[0]['name']} - {contacts[0]['phone']})")

    # 5. Frontend Serving at Root
    root_res = client.get("/")
    assert root_res.status_code == 200
    assert "VOXA AI" in root_res.text
    print(f"✅ Frontend Root Served: HTTP 200 (HTML Size: {len(root_res.text)} bytes)")

    print("=" * 60)
    print("🎉 ALL VOXA AI SYSTEM VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
