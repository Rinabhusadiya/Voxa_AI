from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class CommandRequest(BaseModel):
    command: str = Field(..., description="Transcribed voice command or text input")
    language: str = Field("en", description="Language code: en, hi, gu")
    is_android: bool = Field(False, description="Whether request originates from native Android bridge")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Session context")

class CommandResponse(BaseModel):
    success: bool = True
    recognized_intent: str = Field(..., description="Normalized intent code")
    action_type: str = Field(..., description="Category: phone, message, web, app, system, ai, contacts")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Extracted parameters like query, target, duration")
    speak_text: str = Field(..., description="Concise speech text for TTS response")
    display_text: str = Field(..., description="Formatted response text for UI display")
    confidence: float = Field(0.95, description="Intent classification confidence")
    provider: str = Field("local_nlu", description="Provider used: gemini, openai, or local_nlu")
    requires_confirmation: bool = Field(False, description="Sensitive action requiring user confirmation dialog")
    confirmation_payload: Optional[Dict[str, Any]] = Field(None, description="Details for confirmation modal")

class ChatMessage(BaseModel):
    role: str = Field(..., description="user or assistant")
    content: str = Field(..., description="Message text")

class ChatRequest(BaseModel):
    message: str = Field(..., description="User chat query")
    language: str = Field("en", description="Language: en, hi, gu")
    history: List[ChatMessage] = Field(default_factory=list, description="Recent conversation turns")

class ChatResponse(BaseModel):
    reply: str = Field(..., description="AI response text")
    speak_text: Optional[str] = Field(None, description="Clean TTS audio-friendly text")
    provider: str = Field("gemini", description="AI backend provider")

class ContactSchema(BaseModel):
    id: str
    name: str
    nickname: Optional[str] = None
    phone: str
    phone_work: Optional[str] = None
    email: Optional[str] = None
    category: Optional[str] = "Family"
    relationship: Optional[str] = None
    avatar: Optional[str] = None
    is_favorite: bool = False

class ContactResolveResponse(BaseModel):
    status: str  # "found", "multiple_contacts", "multiple_numbers", "not_found"
    contact: Optional[ContactSchema] = None
    matches: Optional[List[ContactSchema]] = None
    available_numbers: Optional[Dict[str, str]] = None
    message: str

class PairingInitResponse(BaseModel):
    session_id: str
    pairing_code: str
    expires_in_seconds: int
    expires_at_iso: str

class PairingApproveRequest(BaseModel):
    pairing_code_or_session: str
    device_name: str = "Android Phone"
    battery: int = 85
    os_info: str = "Android 14"

class DeviceStatusResponse(BaseModel):
    is_connected: bool
    status: str
    device_name: Optional[str] = None
    battery: Optional[int] = None
    os_info: Optional[str] = None
    last_sync: Optional[str] = None
    paired_at: Optional[str] = None

class DeviceCommandRequest(BaseModel):
    action: str = Field("CALL_CONTACT", description="Action code e.g. CALL_CONTACT, SEND_SMS")
    contactName: str = Field("", description="Name or nickname of contact")
    phoneNumber: str = Field(..., description="Target phone number")
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict)

class AccountLoginRequest(BaseModel):
    identifier: str = Field(..., description="Email or phone number")
    name: Optional[str] = Field(None, description="Optional user name")

class SystemStatusResponse(BaseModel):
    status: str
    app_name: str
    version: str
    active_ai_provider: str
    ai_available: bool
    languages: List[str]
    is_phone_connected: bool = False
    connected_device: Optional[str] = None
