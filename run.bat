@echo off
title ClipGenius AI - Production Studio
cd /d "%~dp0"

echo ===================================================
echo            CLIPGENIUS AI - LOCAL STUDIO
echo          100%% Free Video Clipper ^& Scheduler
echo ===================================================
echo.

:: Verify Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Install dependencies if node_modules is missing
if not exist "node_modules\" (
    echo [INFO] First time launch detected. Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
)

:: Automatically open default browser after 3 seconds
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:5173"

echo [INFO] Starting Fullstack System:
echo   - Backend & FFmpeg Engine on http://localhost:3001
echo   - Web Studio UI on http://localhost:5173
echo.
echo [INFO] Opening http://localhost:5173 in your default web browser...
echo.
echo To stop ClipGenius AI, close this window or press Ctrl+C.
echo ===================================================
echo.

call npm run dev
pause
