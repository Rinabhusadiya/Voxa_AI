import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger("voxa_ai")

class AccountService:
    """
    Manages Voxa User Account authentication, profile data, and associated devices.
    Supports login via Email or Phone number.
    """

    def __init__(self):
        # Default user profile
        self._user_profile: Dict[str, Any] = {
            "name": "Rina",
            "email": "rina@example.com",
            "phone": "+91 98765 43210",
            "identifier_type": "email",
            "avatar_initials": "R",
            "created_at": "2026-01-15T09:00:00Z",
            "last_login": datetime.utcnow().isoformat() + "Z"
        }

    def get_profile(self) -> Dict[str, Any]:
        return dict(self._user_profile)

    def login(self, identifier: str, name: Optional[str] = None) -> Dict[str, Any]:
        """
        Sign in with Email or Phone Number.
        Does NOT assume entering a phone number connects that phone!
        """
        clean_id = identifier.strip()
        is_phone = clean_id.replace(" ", "").replace("-", "").replace("+", "").isdigit()
        
        display_name = name.strip() if name and name.strip() else ("Rina" if "rina" in clean_id.lower() else clean_id.split("@")[0].capitalize())
        initials = display_name[:2].upper() if display_name else "VX"

        self._user_profile = {
            "name": display_name,
            "email": clean_id if "@" in clean_id else f"{display_name.lower()}@voxa.ai",
            "phone": clean_id if is_phone else self._user_profile.get("phone", "+91 98765 43210"),
            "identifier_type": "phone" if is_phone else "email",
            "avatar_initials": initials,
            "created_at": self._user_profile.get("created_at", datetime.utcnow().isoformat() + "Z"),
            "last_login": datetime.utcnow().isoformat() + "Z"
        }

        logger.info(f"User signed in: {display_name} ({clean_id})")
        return {
            "success": True,
            "message": f"Welcome back, {display_name}!",
            "profile": self._user_profile
        }

    def update_profile(self, name: Optional[str] = None, email: Optional[str] = None, phone: Optional[str] = None) -> Dict[str, Any]:
        if name:
            self._user_profile["name"] = name.strip()
            self._user_profile["avatar_initials"] = name.strip()[:2].upper()
        if email:
            self._user_profile["email"] = email.strip()
        if phone:
            self._user_profile["phone"] = phone.strip()
        return self._user_profile

account_service = AccountService()
