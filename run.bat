@echo off
title ClipGenius AI - Production Studio
cd /d "%~dp0"

echo ===================================================
echo            CLIPGENIUS AI - LOCAL STUDIO
echo          100%% Free Video Clipper ^& Scheduler
echo ===================================================
echo.

:: 1. Verify Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: 2. Auto-kill any stuck orphan processes on ports 3001 or 5173
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING 2^>nul') do (
    echo [INFO] Freeing port 3001 (PID %%a)...
    taskkill /F /PID %%a >nul 2>nul
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING 2^>nul') do (
    echo [INFO] Freeing port 5173 (PID %%a)...
    taskkill /F /PID %%a >nul 2>nul
)

:: 3. Install dependencies if node_modules is missing
if not exist "node_modules\" (
    echo [INFO] First time launch detected. Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
)

:: 4. Automatically open default browser after 3 seconds
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:5173"

echo [INFO] Starting Fullstack System:
echo   - Backend Engine & FFmpeg on http://localhost:3001
echo   - Web Studio UI on http://localhost:5173
echo.
echo [INFO] Features Loaded:
echo   [OK] YouTube URL Ingestion (yt-dlp)
echo   [OK] Burned-In Dynamic Subtitles (FFmpeg ASS)
echo   [OK] Smart Framing (Center, Blur-Fit, Left, Right)
echo   [OK] 1-Click Batch ZIP Export
echo   [OK] Direct YouTube Shorts Publishing
echo.
echo [INFO] Opening http://localhost:5173 in your default web browser...
echo.
echo To stop ClipGenius AI, close this window or press Ctrl+C.
echo ===================================================
echo.

call npm run dev
pause
