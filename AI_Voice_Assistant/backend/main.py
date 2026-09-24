import os
import sys
import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .config.settings import settings
from .models.schemas import SystemStatusResponse
from .routes.voice_routes import router as voice_router
from .routes.contacts_routes import router as contacts_router
from .services.ai_service import get_ai_service

# Logging setup
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("voxa_ai")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Multilingual AI Voice Assistant REST API supporting Web Speech and Kotlin Android WebView Bridge"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(voice_router)
app.include_router(contacts_router)

@app.get("/api/system/status", response_model=SystemStatusResponse)
async def get_system_status():
    """Returns runtime health, active AI provider, and supported language list."""
    ai = get_ai_service()
    provider_name = getattr(ai, "provider_name", settings.AI_PROVIDER)
    has_cloud_key = bool(settings.GEMINI_API_KEY or settings.OPENAI_API_KEY)

    return SystemStatusResponse(
        status="online",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        active_ai_provider=provider_name,
        ai_available=True,
        languages=["en", "hi", "gu"]
    )

@app.post("/api/assistant")
async def assistant_endpoint(payload: dict):
    """
    General AI natural-language assistant command processing endpoint.
    Accepts: {"command": "...", "language": "en-IN"}
    """
    command = payload.get("command", "").strip()
    language = payload.get("language", "en-IN")
    if not command:
        return {"status": "error", "message": "Command is empty"}
    
    lang_code = language.split("-")[0].lower() if language else "en"
    ai = get_ai_service()
    resp = ai.process_command(command, language=lang_code)
    
    return {
        "status": "success",
        "command": command,
        "language": language,
        "action": resp.action_type,
        "recognized_intent": resp.recognized_intent,
        "speak_text": resp.speak_text,
        "display_text": resp.display_text,
        "parameters": resp.parameters,
        "requires_confirmation": resp.requires_confirmation
    }

# Static frontend mount if frontend directory exists
frontend_dir = Path(__file__).resolve().parent.parent / "frontend"
if frontend_dir.exists():
    css_dir = frontend_dir / "css"
    js_dir = frontend_dir / "js"
    if css_dir.exists():
        app.mount("/css", StaticFiles(directory=str(css_dir)), name="css")
    if js_dir.exists():
        app.mount("/js", StaticFiles(directory=str(js_dir)), name="js")
    
    app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")

    @app.get("/")
    async def serve_index():
        index_file = frontend_dir / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return {"message": "Voxa AI Backend Online. Place frontend files in frontend/ directory."}

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting Voxa AI server on {settings.APP_HOST}:{settings.APP_PORT}")
    uvicorn.run("backend.main:app", host=settings.APP_HOST, port=settings.APP_PORT, reload=settings.DEBUG)
