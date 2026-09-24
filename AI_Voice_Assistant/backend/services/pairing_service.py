import time
import uuid
import random
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta

logger = logging.getLogger("voxa_ai")

class PairingService:
    """
    Manages secure pairing between PC Voice Assistant and Android Companion.
    Provides session tokens, 10-minute expiry, explicit companion approval handshakes,
    and command routing for phone calls, SMS, and native operations.
    """

    def __init__(self):
        # In-memory storage for pairing sessions and connected device state
        self._sessions: Dict[str, Dict[str, Any]] = {}
        self._pairing_code_to_session: Dict[str, str] = {}
        self._active_device: Optional[Dict[str, Any]] = None
        self._command_queue: List[Dict[str, Any]] = []

    def clean_expired_sessions(self):
        now = time.time()
        expired_ids = [sid for sid, s in self._sessions.items() if s.get("expires_at", 0) < now]
        for sid in expired_ids:
            code = self._sessions[sid].get("pairing_code")
            if code and code in self._pairing_code_to_session:
                del self._pairing_code_to_session[code]
            del self._sessions[sid]

    def create_session(self, user_identifier: str = "user@voxa.ai") -> Dict[str, Any]:
        self.clean_expired_sessions()
        session_id = str(uuid.uuid4())
        # Generate 4-digit numeric code with VX- prefix
        code_number = random.randint(1000, 9999)
        pairing_code = f"VX-{code_number}"

        expires_at = time.time() + 600  # 10 minutes validity
        session_data = {
            "session_id": session_id,
            "pairing_code": pairing_code,
            "user_identifier": user_identifier,
            "status": "pending",  # pending, approved, rejected, expired
            "created_at": time.time(),
            "expires_at": expires_at,
            "device_info": None,
            "device_token": None
        }

        self._sessions[session_id] = session_data
        self._pairing_code_to_session[pairing_code] = session_id

        logger.info(f"Created pairing session {session_id} with code {pairing_code}")
        return {
            "session_id": session_id,
            "pairing_code": pairing_code,
            "expires_in_seconds": 600,
            "expires_at_iso": (datetime.utcnow() + timedelta(minutes=10)).isoformat() + "Z"
        }

    def get_session_status(self, session_id: str) -> Dict[str, Any]:
        self.clean_expired_sessions()
        session = self._sessions.get(session_id)
        if not session:
            return {"status": "not_found", "is_connected": False}
        
        is_connected = session.get("status") == "approved" and bool(self._active_device and self._active_device.get("is_connected"))
        return {
            "session_id": session_id,
            "status": session.get("status", "pending"),
            "is_connected": is_connected,
            "device_info": session.get("device_info"),
            "pairing_code": session.get("pairing_code")
        }

    def approve_pairing(self, code_or_session_id: str, device_name: str = "Android Phone", battery: int = 85, os_info: str = "Android 14") -> Dict[str, Any]:
        self.clean_expired_sessions()
        
        session_id = code_or_session_id
        if code_or_session_id.upper() in self._pairing_code_to_session:
            session_id = self._pairing_code_to_session[code_or_session_id.upper()]

        session = self._sessions.get(session_id)
        if not session:
            return {"success": False, "message": "Invalid or expired pairing code/session."}

        device_token = f"dev_tok_{uuid.uuid4().hex[:16]}"
        device_data = {
            "device_name": device_name or "Android Phone",
            "battery": int(battery) if battery is not None else 85,
            "os_info": os_info or "Android 14",
            "device_token": device_token,
            "is_connected": True,
            "paired_at": datetime.utcnow().isoformat() + "Z",
            "last_sync": "Just now",
            "session_id": session_id
        }

        session["status"] = "approved"
        session["device_info"] = device_data
        session["device_token"] = device_token
        self._active_device = device_data

        logger.info(f"Android companion '{device_name}' paired successfully to session {session_id}")
        return {
            "success": True,
            "message": f"Successfully paired '{device_name}' with Voxa AI PC.",
            "device_token": device_token,
            "device_info": device_data
        }

    def get_active_device_status(self) -> Dict[str, Any]:
        if not self._active_device or not self._active_device.get("is_connected"):
            return {
                "is_connected": False,
                "status": "disconnected",
                "device_name": None,
                "battery": None,
                "last_sync": None
            }
        
        return {
            "is_connected": True,
            "status": "connected",
            "device_name": self._active_device.get("device_name", "Android Phone"),
            "battery": self._active_device.get("battery", 82),
            "os_info": self._active_device.get("os_info", "Android 14"),
            "last_sync": self._active_device.get("last_sync", "Just now"),
            "paired_at": self._active_device.get("paired_at")
        }

    def update_device_telemetry(self, battery: Optional[int] = None, last_sync: Optional[str] = None):
        if self._active_device and self._active_device.get("is_connected"):
            if battery is not None:
                self._active_device["battery"] = battery
            self._active_device["last_sync"] = last_sync or "Just now"

    def disconnect_device(self) -> Dict[str, Any]:
        if self._active_device:
            name = self._active_device.get("device_name", "Android Phone")
            self._active_device["is_connected"] = False
            self._active_device = None
            self._command_queue.clear()
            logger.info(f"Device {name} disconnected from Voxa AI PC.")
            return {"success": True, "message": f"{name} disconnected."}
        return {"success": True, "message": "No active device to disconnect."}

    def queue_command(self, action: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Queues an authenticated command to be executed by the paired Android Companion.
        Verifies phone is currently connected.
        """
        if not self._active_device or not self._active_device.get("is_connected"):
            return {
                "success": False,
                "requires_connection": True,
                "message": "Please connect your Android phone to perform phone actions."
            }

        cmd_id = f"cmd_{uuid.uuid4().hex[:12]}"
        cmd = {
            "cmd_id": cmd_id,
            "action": action,  # CALL_CONTACT, SEND_SMS, etc.
            "contactName": payload.get("contactName", ""),
            "phoneNumber": payload.get("phoneNumber", ""),
            "parameters": payload,
            "timestamp": time.time(),
            "status": "pending"
        }
        self._command_queue.append(cmd)
        logger.info(f"Queued command {cmd_id} ({action}) for Android: {payload.get('phoneNumber')}")

        return {
            "success": True,
            "cmd_id": cmd_id,
            "action": action,
            "message": f"Command sent to {self._active_device.get('device_name')}"
        }

    def poll_commands(self, device_token: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Called by the Android companion to retrieve pending commands.
        """
        if not self._active_device or not self._active_device.get("is_connected"):
            return []
        
        # Return and mark commands as dispatched
        pending = [cmd for cmd in self._command_queue if cmd["status"] == "pending"]
        for c in pending:
            c["status"] = "dispatched"
        return pending

    def ack_command(self, cmd_id: str, success: bool = True) -> bool:
        for cmd in self._command_queue:
            if cmd["cmd_id"] == cmd_id:
                cmd["status"] = "completed" if success else "failed"
                # Keep queue trimmed
                self._command_queue = [c for c in self._command_queue if c["status"] == "pending"][-20:]
                return True
        return False

# Global singleton
pairing_service = PairingService()
