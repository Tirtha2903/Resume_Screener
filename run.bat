@echo off
title Screener.AI Orchestrator

echo ==========================================
echo        Screener.AI Launch Control
echo ==========================================

rem Check Python virtual environment
if not exist ".venv" (
    echo [ERROR] Virtual environment (.venv) not found.
    echo Please run backend setup first.
    pause
    exit /b 1
)

rem Retrain ML Model to ensure artifacts exist
echo [INFO] Step 1: Initializing and training ML categorization model...
cd backend
..\\.venv\\Scripts\\python model.py
if %errorlevel% neq 0 (
    echo [WARNING] Model training script failed. Proceeding anyway.
)
cd ..

rem Start Backend FastAPI Server
echo [INFO] Step 2: Launching FastAPI backend server (Port 8000)...
start "Screener.AI Backend" cmd /k "cd backend && ..\\.venv\\Scripts\\uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

rem Start Frontend Vite Server
echo [INFO] Step 3: Launching React Frontend (Vite)...
start "Screener.AI Frontend" cmd /k "cd frontend && npm run dev"

echo ==========================================
echo  Servers are starting in separate windows.
echo  - Backend: http://localhost:8000
echo  - Frontend: http://localhost:5173
echo ==========================================
echo Press any key to exit this orchestrator.
pause > nul
