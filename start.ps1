# GIMU Platform - PowerShell Startup Script

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GIMU Platform - Startup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Проверка наличия node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "[ERROR] node_modules not found!" -ForegroundColor Red
    Write-Host "Please run: npm install --legacy-peer-deps" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Проверка .env файла
if (-not (Test-Path ".env")) {
    Write-Host "[ERROR] .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file with required variables" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[INFO] Starting health check..." -ForegroundColor Green
npm run check

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Health check failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting servers..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[INFO] Backend will start on port 3001" -ForegroundColor Green
Write-Host "[INFO] Frontend will start on port 3000" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C in each window to stop servers" -ForegroundColor Yellow
Write-Host ""

# Запуск backend в новом окне PowerShell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run server" -WindowStyle Normal

# Задержка перед запуском frontend
Start-Sleep -Seconds 3

# Запуск frontend в новом окне PowerShell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Servers started successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Check the new windows for server output." -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to close this window"

