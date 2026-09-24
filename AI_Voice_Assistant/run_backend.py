"""
Voxa AI Assistant - Backend Startup Runner
Usage: python run_backend.py
"""
import sys
import io

# Ensure UTF-8 output on Windows terminal
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    except Exception:
        pass

import uvicorn
from backend.config.settings import settings

if __name__ == "__main__":
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"Server running at: http://localhost:{settings.APP_PORT}")
    print(f"Interactive Swagger API Docs: http://localhost:{settings.APP_PORT}/docs")
    print(f"Configured AI Provider: {settings.AI_PROVIDER}")
    uvicorn.run("backend.main:app", host=settings.APP_HOST, port=settings.APP_PORT, reload=settings.DEBUG)
