from .voice_routes import router as voice_router
from .contacts_routes import router as contacts_router
from .chat_routes import router as chat_router

__all__ = ["voice_router", "contacts_router", "chat_router"]

