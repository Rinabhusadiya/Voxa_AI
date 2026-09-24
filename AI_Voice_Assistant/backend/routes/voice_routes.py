from fastapi import APIRouter, HTTPException, Depends
from ..models.schemas import CommandRequest, CommandResponse, ChatRequest, ChatResponse, SystemStatusResponse
from ..services.ai_service import get_ai_service, BaseAIProvider
from ..config.settings import settings

router = APIRouter(prefix="/api/voice", tags=["Voice & AI"])

@router.post("/process-command", response_model=CommandResponse)
async def process_voice_command(
    request: CommandRequest,
    ai_service: BaseAIProvider = Depends(get_ai_service)
) -> CommandResponse:
    """
    Process transcribed voice command or text query.
    Extracts structured intent, parameters (contacts, app, query), and creates TTS speech response.
    """
    if not request.command or not request.command.strip():
        raise HTTPException(status_code=400, detail="Command string cannot be empty")

    response = ai_service.process_command(
        command=request.command.strip(),
        language=request.language,
        context=request.context
    )
    return response

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(
    request: ChatRequest,
    ai_service: BaseAIProvider = Depends(get_ai_service)
) -> ChatResponse:
    """
    ChatGPT-style conversational endpoint for deep dialog and knowledge questions.
    """
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    reply = ai_service.generate_chat(
        message=request.message.strip(),
        history=request.history,
        language=request.language
    )
    
    # Clean markdown formatting for clean TTS speak text
    import re
    clean_speak = re.sub(r'[\*\#\_\[\]\(\)\`]', '', reply)
    clean_speak = re.sub(r'\s+', ' ', clean_speak).strip()
    if len(clean_speak) > 280:
        clean_speak = clean_speak[:280] + "..."

    return ChatResponse(
        reply=reply,
        speak_text=clean_speak,
        provider=getattr(ai_service, "provider_name", "ai_cloud")
    )
