@echo off
echo ==========================================
echo Starting OrbitGuard AI Development Servers
echo ==========================================

echo Starting FastAPI Backend...
start "OrbitGuard Backend" cmd /k "cd backend && call venv\Scripts\activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo Starting React Frontend (Vite)...
start "OrbitGuard Frontend" cmd /k "cd frontend && npm run dev"

echo ==========================================
echo Development servers are starting in new windows.
echo Close the new command windows to stop the servers.
echo ==========================================
