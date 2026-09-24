"""
Voxa AI - Secure OpenAI Service
Handles communication with OpenAI Responses / Chat Completions API.
Key features:
- Secure backend execution (API key never exposed to client)
- Configurable model via OPENAI_MODEL in .env
- Multilingual system prompt (English, Hindi, Gujarati)
- Context memory management (token safety)
- Robust error classification (no fake answers)
"""
import logging
from typing import List, Dict, Any, Optional
from openai import OpenAI, AuthenticationError, RateLimitError, NotFoundError, APIConnectionError, APITimeoutError, OpenAIError
from ..config.settings import settings

logger = logging.getLogger("voxa_ai")


class OpenAIException(Exception):
    """Base exception for OpenAI service with client-friendly message."""
    def __init__(self, message: str, status_code: int = 500, can_retry: bool = True):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.can_retry = can_retry


class OpenAIService:
    def __init__(self):
        self._client: Optional[OpenAI] = None

    def get_model(self) -> str:
        """Returns the configured model from settings/.env."""
        model = settings.OPENAI_MODEL.strip() if settings.OPENAI_MODEL else "gpt-4o-mini"
        return model

    def _get_client(self) -> OpenAI:
        api_key = settings.OPENAI_API_KEY.strip() if settings.OPENAI_API_KEY else ""
        if not api_key or api_key == "YOUR_API_KEY_HERE" or api_key.startswith("sk-placeholder"):
            raise OpenAIException(
                "OpenAI API key is missing or not configured. Please set a valid OPENAI_API_KEY in backend/.env.",
                status_code=401,
                can_retry=False
            )
        if self._client is None or self._client.api_key != api_key:
            self._client = OpenAI(api_key=api_key, timeout=45.0)
        return self._client

    def build_system_prompt(self, language: str = "en") -> str:
        lang_instruction = {
            "en": "Respond naturally in English.",
            "hi": "Respond naturally in Hindi (हिन्दी) or Hinglish depending on how the user addresses you.",
            "gu": "Respond naturally in Gujarati (ગુજરાતી) or Gujarati script."
        }.get(language.lower(), "Detect the language of the user question (English, Hindi, or Gujarati) and respond in the same language.")

        return (
            "You are Voxa AI, a premier multimodal AI voice assistant and intelligent conversational partner.\n"
            f"{lang_instruction}\n"
            "Guidelines:\n"
            "1. Format responses cleanly with rich Markdown (headings, bold, lists, quotes, tables where appropriate).\n"
            "2. When providing code snippets, always use standard fenced code blocks with the exact language identifier "
            "(e.g., ```python, ```javascript, ```html, ```css, ```java, ```kotlin, ```php, ```sql, ```c, ```cpp).\n"
            "3. Maintain context and memory across the ongoing conversation turns.\n"
            "4. Be concise, highly accurate, and helpful. Avoid unnecessary fluff.\n"
            "5. If asked who you are, answer that you are Voxa AI, an enterprise-grade AI Voice Assistant."
        )

    def generate_chat_response(
        self,
        message: str,
        conversation_history: List[Dict[str, Any]],
        language: str = "en"
    ) -> str:
        """
        Sends conversation context to OpenAI and retrieves the AI answer.
        Does NOT generate fake responses on failure.
        """
        client = self._get_client()
        model_name = self.get_model()

        # Build messages payload with system prompt and trimmed context memory
        messages: List[Dict[str, str]] = [
            {"role": "system", "content": self.build_system_prompt(language)}
        ]

        # Context memory: retain the most recent 12 messages for conversation continuity
        trimmed_history = conversation_history[-12:] if conversation_history else []
        for msg in trimmed_history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})

        # Append current user message
        messages.append({"role": "user", "content": message})

        logger.info(f"Calling OpenAI model '{model_name}' with {len(messages)} context messages.")

        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=0.7,
                max_tokens=2048,
            )

            choice = response.choices[0]
            answer = choice.message.content
            if not answer or not answer.strip():
                raise OpenAIException("OpenAI returned an empty response. Please retry.", status_code=502, can_retry=True)

            return answer.strip()

        except AuthenticationError as e:
            logger.error(f"OpenAI Authentication Error: {e}")
            raise OpenAIException(
                "Invalid OpenAI API key. Please verify the OPENAI_API_KEY in backend/.env.",
                status_code=401,
                can_retry=False
            )
        except NotFoundError as e:
            logger.error(f"OpenAI Model Not Found Error ({model_name}): {e}")
            raise OpenAIException(
                f"Configured OpenAI model '{model_name}' is unavailable or does not exist. Please check OPENAI_MODEL in backend/.env.",
                status_code=404,
                can_retry=False
            )
        except RateLimitError as e:
            logger.error(f"OpenAI Rate Limit / Quota Exceeded: {e}")
            raise OpenAIException(
                "OpenAI rate limit or usage quota exceeded. Please check your OpenAI account billing or try again later.",
                status_code=429,
                can_retry=True
            )
        except APITimeoutError as e:
            logger.error(f"OpenAI API Request Timeout: {e}")
            raise OpenAIException(
                "The request to OpenAI timed out. Please check your network and retry.",
                status_code=504,
                can_retry=True
            )
        except APIConnectionError as e:
            logger.error(f"OpenAI API Connection Error: {e}")
            raise OpenAIException(
                "Could not connect to OpenAI API servers. Please check your internet connection.",
                status_code=503,
                can_retry=True
            )
        except OpenAIError as e:
            logger.error(f"OpenAI API General Error: {e}")
            raise OpenAIException(
                f"OpenAI API service error: {str(e)}",
                status_code=500,
                can_retry=True
            )
        except OpenAIException:
            raise
        except Exception as e:
            logger.error(f"Unexpected error communicating with OpenAI: {e}")
            raise OpenAIException(
                "An unexpected internal error occurred while communicating with OpenAI.",
                status_code=500,
                can_retry=True
            )


openai_service = OpenAIService()
