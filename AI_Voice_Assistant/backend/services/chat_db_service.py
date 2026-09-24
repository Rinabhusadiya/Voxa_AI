"""
Voxa AI - Chat Database Service
Provides persistent SQLite storage for conversations and messages with user isolation.
"""
import os
import sqlite3
import uuid
import re
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional

logger = logging.getLogger("voxa_ai")

DB_DIR = Path(__file__).resolve().parent.parent / "data"
DB_PATH = DB_DIR / "voxa_chat.db"


class ChatDbService:
    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or DB_PATH
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        # Enable foreign keys and WAL mode for high concurrency
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.execute("PRAGMA journal_mode = WAL;")
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS conversations (
                    conversation_id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS messages (
                    message_id TEXT PRIMARY KEY,
                    conversation_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id, updated_at DESC);
                CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at ASC);
            """)

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def get_or_create_conversation(self, conversation_id: str, user_id: str, title: Optional[str] = None) -> Dict[str, Any]:
        """
        Retrieves existing conversation or creates a new one belonging to user_id.
        Enforces user ownership.
        """
        now = self._now_iso()
        clean_conv_id = conversation_id.strip() if conversation_id else str(uuid.uuid4())
        clean_user_id = user_id.strip() if user_id else "guest"
        default_title = (title or "New Conversation").strip()[:40]

        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute(
                "SELECT conversation_id, user_id, title, created_at, updatedAt FROM (SELECT conversation_id, user_id, title, created_at, updated_at AS updatedAt FROM conversations) WHERE conversation_id = ?",
                (clean_conv_id,)
            )
            row = cur.fetchone()
            if row:
                # Validate ownership
                if row["user_id"] != clean_user_id:
                    # User ID mismatch: security isolation
                    raise PermissionError(f"Access denied: Conversation does not belong to user '{clean_user_id}'")
                return dict(row)

            # Insert new conversation
            cur.execute(
                "INSERT INTO conversations (conversation_id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
                (clean_conv_id, clean_user_id, default_title, now, now)
            )
            conn.commit()

            return {
                "conversationId": clean_conv_id,
                "userId": clean_user_id,
                "title": default_title,
                "createdAt": now,
                "updatedAt": now
            }

    def list_conversations(self, user_id: str, query: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Returns all conversations for a specific user, sorted newest first.
        Supports optional search filtering.
        """
        clean_user_id = user_id.strip() if user_id else "guest"
        with self._get_connection() as conn:
            cur = conn.cursor()
            if query and query.strip():
                search_term = f"%{query.strip()}%"
                cur.execute(
                    """
                    SELECT conversation_id AS conversationId, user_id AS userId, title, created_at AS createdAt, updated_at AS updatedAt
                    FROM conversations
                    WHERE user_id = ? AND (title LIKE ? OR conversation_id IN (
                        SELECT conversation_id FROM messages WHERE content LIKE ?
                    ))
                    ORDER BY updated_at DESC
                    """,
                    (clean_user_id, search_term, search_term)
                )
            else:
                cur.execute(
                    """
                    SELECT conversation_id AS conversationId, user_id AS userId, title, created_at AS createdAt, updated_at AS updatedAt
                    FROM conversations
                    WHERE user_id = ?
                    ORDER BY updated_at DESC
                    """,
                    (clean_user_id,)
                )
            rows = cur.fetchall()
            return [dict(r) for r in rows]

    def get_conversation(self, conversation_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        clean_user_id = user_id.strip() if user_id else "guest"
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT conversation_id AS conversationId, user_id AS userId, title, created_at AS createdAt, updated_at AS updatedAt
                FROM conversations
                WHERE conversation_id = ? AND user_id = ?
                """,
                (conversation_id.strip(), clean_user_id)
            )
            row = cur.fetchone()
            if not row:
                return None
            conv = dict(row)
            conv["messages"] = self.get_messages(conversation_id.strip())
            return conv

    def get_messages(self, conversation_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT message_id AS messageId, conversation_id AS conversationId, role, content, created_at AS createdAt
                FROM messages
                WHERE conversation_id = ?
                ORDER BY created_at ASC
                LIMIT ?
                """,
                (conversation_id.strip(), limit)
            )
            return [dict(r) for r in cur.fetchall()]

    def add_message(self, conversation_id: str, role: str, content: str, message_id: Optional[str] = None) -> Dict[str, Any]:
        now = self._now_iso()
        msg_id = message_id or str(uuid.uuid4())
        clean_conv_id = conversation_id.strip()
        clean_role = role.strip().lower()
        clean_content = content.strip()

        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO messages (message_id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
                (msg_id, clean_conv_id, clean_role, clean_content, now)
            )
            cur.execute(
                "UPDATE conversations SET updated_at = ? WHERE conversation_id = ?",
                (now, clean_conv_id)
            )
            conn.commit()

        return {
            "messageId": msg_id,
            "conversationId": clean_conv_id,
            "role": clean_role,
            "content": clean_content,
            "createdAt": now
        }

    def update_title(self, conversation_id: str, user_id: str, new_title: str) -> bool:
        clean_user_id = user_id.strip() if user_id else "guest"
        clean_title = new_title.strip()[:40]
        if not clean_title:
            return False

        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute(
                "UPDATE conversations SET title = ?, updated_at = ? WHERE conversation_id = ? AND user_id = ?",
                (clean_title, self._now_iso(), conversation_id.strip(), clean_user_id)
            )
            conn.commit()
            return cur.rowcount > 0

    def delete_conversation(self, conversation_id: str, user_id: str) -> bool:
        clean_user_id = user_id.strip() if user_id else "guest"
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute(
                "DELETE FROM conversations WHERE conversation_id = ? AND user_id = ?",
                (conversation_id.strip(), clean_user_id)
            )
            conn.commit()
            return cur.rowcount > 0

    def delete_all_conversations(self, user_id: str) -> int:
        clean_user_id = user_id.strip() if user_id else "guest"
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute(
                "DELETE FROM conversations WHERE user_id = ?",
                (clean_user_id,)
            )
            conn.commit()
            return cur.rowcount

    @staticmethod
    def generate_title_from_message(message: str) -> str:
        """
        Generates a concise, readable title from the first question (max 40 chars).
        E.g. "What is Python?" -> "What is Python"
        "Explain Django authentication" -> "Django Authentication"
        """
        text = message.strip()
        # Remove common introductory filler
        cleaned = re.sub(r'^(please\s+|can\s+you\s+|tell\s+me\s+about\s+|explain\s+to\s+me\s+how\s+to\s+|explain\s+to\s+me\s+|explain\s+)', '', text, flags=re.IGNORECASE).strip()
        if not cleaned:
            cleaned = text

        # Remove trailing punctuation
        cleaned = re.sub(r'[\?\.\!\:\;]+$', '', cleaned).strip()

        # Capitalize nicely
        if len(cleaned) <= 40:
            return cleaned[:1].upper() + cleaned[1:]
        
        # Truncate at word boundary
        truncated = cleaned[:37]
        if " " in truncated:
            truncated = truncated.rsplit(" ", 1)[0]
        return truncated + "..."


chat_db_service = ChatDbService()
