"""
Voxa AI - Chat API Routes
Handles /api/chat endpoint with real OpenAI integration, conversation history,
session management, rate limiting, and input validation.
"""
import time
import logging
from typing import Optional, List, Dict, Any
from collections import defaultdict
from fastapi import APIRouter, Request, HTTPException, status, Header
from pydantic import BaseModel, Field

from ..services.chat_db_service import chat_db_service
from ..services.openai_service import openai_service, OpenAIException
from ..config.settings import settings

logger = logging.getLogger("voxa_ai")

router = APIRouter(tags=["AI Chat"])

# In-memory sliding window rate limiter
# Key -> List of timestamps
RATE_LIMIT_STORE = defaultdict(list)
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 30


def check_rate_limit(client_id: str):
    now = time.time()
    timestamps = RATE_LIMIT_STORE[client_id]
    # Prune old timestamps
    RATE_LIMIT_STORE[client_id] = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW_SECONDS]
    if len(RATE_LIMIT_STORE[client_id]) >= RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "success": False,
                "error": "Rate limit exceeded. Please wait a moment before sending more messages.",
                "canRetry": True
            }
        )
    RATE_LIMIT_STORE[client_id].append(now)


# Request and Response schemas
class RealChatRequest(BaseModel):
    message: str = Field(..., description="User message text")
    conversationId: Optional[str] = Field(None, description="Unique conversation UUID")
    language: Optional[str] = Field("en", description="User preferred language code (en, hi, gu)")
    userId: Optional[str] = Field(None, description="Optional user ID for isolation")


class RealChatResponse(BaseModel):
    success: bool = True
    conversationId: str
    answer: str
    createdAt: str
    model: Optional[str] = None
    title: Optional[str] = None


class RenameConversationRequest(BaseModel):
    title: str = Field(..., max_length=60, description="New conversation title")


def get_user_id(request: Request, x_user_id: Optional[str] = None, payload_user_id: Optional[str] = None) -> str:
    """Extracts and sanitizes user ID from headers, request payload, or defaults to guest."""
    if payload_user_id and payload_user_id.strip():
        return payload_user_id.strip()[:64]
    if x_user_id and x_user_id.strip():
        return x_user_id.strip()[:64]
    return "default_user"


@router.post("/api/chat", response_model=RealChatResponse)
async def chat_endpoint(payload: RealChatRequest, request: Request, x_user_id: Optional[str] = Header(None)):
    """
    Primary AI Chat endpoint.
    1. Validates request and checks non-empty message.
    2. Enforces rate limits and max message length.
    3. Loads previous conversation history from SQLite.
    4. Calls real OpenAI API.
    5. Saves user message and assistant reply.
    6. Returns answer to frontend.
    """
    # 1. Validate message
    raw_message = payload.message.strip() if payload.message else ""
    if not raw_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": "Message cannot be empty.", "canRetry": False}
        )

    if len(raw_message) > 4000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": "Message exceeds the maximum length of 4000 characters.", "canRetry": False}
        )

    # 2. Rate limiting check
    client_ip = request.client.host if request.client else "127.0.0.1"
    user_id = get_user_id(request, x_user_id, payload.userId)
    check_rate_limit(f"{client_ip}:{user_id}")

    # 3. Get or create conversation in DB
    try:
        conv = chat_db_service.get_or_create_conversation(
            conversation_id=payload.conversationId,
            user_id=user_id,
            title="New Conversation"
        )
    except PermissionError as pe:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": str(pe), "canRetry": False}
        )

    conversation_id = conv["conversationId"]

    # 4. Load previous conversation messages
    history_messages = chat_db_service.get_messages(conversation_id, limit=20)

    # 5. Call OpenAI API securely on backend
    try:
        language = payload.language or "en"
        answer = openai_service.generate_chat_response(
            message=raw_message,
            conversation_history=history_messages,
            language=language
        )
    except OpenAIException as oae:
        raise HTTPException(
            status_code=oae.status_code,
            detail={"success": False, "error": oae.message, "canRetry": oae.can_retry}
        )
    except Exception as exc:
        logger.error(f"Unexpected chat error: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "error": "Sorry, Voxa AI could not generate a response. Please try again.", "canRetry": True}
        )

    # 6. Save user message and AI response in SQLite
    chat_db_service.add_message(conversation_id, role="user", content=raw_message)
    saved_assistant_msg = chat_db_service.add_message(conversation_id, role="assistant", content=answer)

    # 7. Auto-update title if it's currently the default and this was the first question
    current_title = conv.get("title", "")
    if current_title in ("New Conversation", "") and len(history_messages) == 0:
        new_title = chat_db_service.generate_title_from_message(raw_message)
        chat_db_service.update_title(conversation_id, user_id, new_title)
        current_title = new_title

    # 8. Return response
    return RealChatResponse(
        success=True,
        conversationId=conversation_id,
        answer=answer,
        createdAt=saved_assistant_msg["createdAt"],
        model=openai_service.get_model(),
        title=current_title
    )


@router.post("/api/chat/regenerate", response_model=RealChatResponse)
async def regenerate_endpoint(payload: RealChatRequest, request: Request, x_user_id: Optional[str] = Header(None)):
    """
    Regenerates response for the last user message in the conversation.
    """
    user_id = get_user_id(request, x_user_id, payload.userId)
    if not payload.conversationId:
        raise HTTPException(status_code=400, detail={"success": False, "error": "conversationId is required to regenerate."})

    conv = chat_db_service.get_conversation(payload.conversationId, user_id)
    if not conv:
        raise HTTPException(status_code=404, detail={"success": False, "error": "Conversation not found."})

    messages = conv.get("messages", [])
    if not messages:
        raise HTTPException(status_code=400, detail={"success": False, "error": "No messages in conversation to regenerate."})

    # Find last user message
    last_user_msg = None
    for msg in reversed(messages):
        if msg["role"] == "user":
            last_user_msg = msg
            break

    if not last_user_msg:
        raise HTTPException(status_code=400, detail={"success": False, "error": "No user message found to regenerate."})

    # Exclude trailing assistant messages for context
    history_up_to_user = []
    for msg in messages:
        if msg["messageId"] == last_user_msg["messageId"]:
            break
        history_up_to_user.append(msg)

    try:
        answer = openai_service.generate_chat_response(
            message=last_user_msg["content"],
            conversation_history=history_up_to_user,
            language=payload.language or "en"
        )
    except OpenAIException as oae:
        raise HTTPException(
            status_code=oae.status_code,
            detail={"success": False, "error": oae.message, "canRetry": oae.can_retry}
        )

    saved_assistant_msg = chat_db_service.add_message(payload.conversationId, role="assistant", content=answer)

    return RealChatResponse(
        success=True,
        conversationId=payload.conversationId,
        answer=answer,
        createdAt=saved_assistant_msg["createdAt"],
        model=openai_service.get_model(),
        title=conv.get("title")
    )


@router.get("/api/conversations")
async def list_conversations_endpoint(q: Optional[str] = None, request: Request = None, x_user_id: Optional[str] = Header(None)):
    """Lists all saved conversations for the authenticated user."""
    user_id = get_user_id(request, x_user_id)
    conversations = chat_db_service.list_conversations(user_id=user_id, query=q)
    return {"success": True, "conversations": conversations}


@router.get("/api/conversations/{conversation_id}")
async def get_conversation_endpoint(conversation_id: str, request: Request = None, x_user_id: Optional[str] = Header(None)):
    """Retrieves a single conversation with all its messages."""
    user_id = get_user_id(request, x_user_id)
    conv = chat_db_service.get_conversation(conversation_id, user_id)
    if not conv:
        raise HTTPException(status_code=404, detail={"success": False, "error": "Conversation not found."})
    return {"success": True, "conversation": conv}


@router.patch("/api/conversations/{conversation_id}")
async def rename_conversation_endpoint(
    conversation_id: str,
    payload: RenameConversationRequest,
    request: Request = None,
    x_user_id: Optional[str] = Header(None)
):
    """Renames a conversation title."""
    user_id = get_user_id(request, x_user_id)
    success = chat_db_service.update_title(conversation_id, user_id, payload.title)
    if not success:
        raise HTTPException(status_code=404, detail={"success": False, "error": "Conversation not found or could not be updated."})
    return {"success": True, "title": payload.title.strip()[:40]}


@router.delete("/api/conversations/{conversation_id}")
async def delete_conversation_endpoint(conversation_id: str, request: Request = None, x_user_id: Optional[str] = Header(None)):
    """Deletes a single conversation and its associated messages."""
    user_id = get_user_id(request, x_user_id)
    success = chat_db_service.delete_conversation(conversation_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail={"success": False, "error": "Conversation not found."})
    return {"success": True, "message": "Conversation deleted successfully."}


@router.delete("/api/conversations")
async def delete_all_conversations_endpoint(request: Request = None, x_user_id: Optional[str] = Header(None)):
    """Deletes all conversations belonging to the current user."""
    user_id = get_user_id(request, x_user_id)
    count = chat_db_service.delete_all_conversations(user_id)
    return {"success": True, "deletedCount": count, "message": f"Deleted {count} conversations."}
