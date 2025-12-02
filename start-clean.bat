@echo off
echo.
echo ========================================
echo   GIMU Platform - Clean Start
echo ========================================
echo.

echo [INFO] Stopping existing Node processes...
taskkill /F /IM node.exe /T >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Stopped existing processes
) else (
    echo [OK] No existing processes to stop
)

timeout /t 2 /nobreak >nul

echo.
echo [INFO] Starting Backend Server...
start "GIMU Backend" cmd /k "cd /d %~dp0 && npm run server"

timeout /t 3 /nobreak >nul

echo.
echo [INFO] Starting Frontend Server...
start "GIMU Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ========================================
echo   Servers Started!
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Check the new windows for output.
echo Close this window anytime.
echo.
pause

