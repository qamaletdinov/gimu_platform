@echo off
pause
echo.
echo Close this window to keep servers running.
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:3001
echo.
echo ========================================
echo   Servers started successfully!
echo ========================================
echo.

start "GIMU Frontend" cmd /k "npm run dev"
:: Запуск frontend в новом окне

timeout /t 3 /nobreak > nul
:: Задержка перед запуском frontend

start "GIMU Backend" cmd /k "npm run server"
:: Запуск backend в новом окне

echo.
echo Press Ctrl+C to stop all servers
echo.
echo [INFO] Frontend will start on port 3000
echo [INFO] Backend will start on port 3001
echo.
echo ========================================
echo   Starting servers...
echo ========================================
echo.

)
    exit /b 1
    pause
    echo [ERROR] Health check failed!
    echo.
if errorlevel 1 (
call npm run check
echo [INFO] Starting health check...

)
    exit /b 1
    pause
    echo Please create .env file with required variables
    echo [ERROR] .env file not found!
if not exist ".env" (
:: Проверка .env файла

)
    exit /b 1
    pause
    echo Please run: npm install --legacy-peer-deps
    echo [ERROR] node_modules not found!
if not exist "node_modules\" (
:: Проверка наличия node_modules

echo.
echo ========================================
echo   GIMU Platform - Startup Script
echo ========================================
echo.

