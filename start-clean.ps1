# GIMU Platform - Clean Start (PowerShell)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GIMU Platform - Clean Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Остановка существующих Node процессов
Write-Host "[INFO] Stopping existing Node processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force
    Write-Host "[OK] Stopped $($nodeProcesses.Count) Node process(es)" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "[OK] No existing Node processes to stop" -ForegroundColor Green
}

# Проверка портов
Write-Host ""
Write-Host "[INFO] Checking ports..." -ForegroundColor Yellow

$port3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($port3001) {
    Write-Host "[WARNING] Port 3001 is still in use. Waiting..." -ForegroundColor Red
    Start-Sleep -Seconds 3
} else {
    Write-Host "[OK] Port 3001 is free" -ForegroundColor Green
}

if ($port3000) {
    Write-Host "[WARNING] Port 3000 is still in use. Waiting..." -ForegroundColor Red
    Start-Sleep -Seconds 3
} else {
    Write-Host "[OK] Port 3000 is free" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Servers..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Запуск Backend
Write-Host "[INFO] Starting Backend Server (port 3001)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run server" -WindowStyle Normal

Start-Sleep -Seconds 3

# Запуск Frontend
Write-Host "[INFO] Starting Frontend Server (port 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Servers Started Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  " -NoNewline -ForegroundColor White
Write-Host "http://localhost:3001" -ForegroundColor Cyan
Write-Host "Frontend: " -NoNewline -ForegroundColor White
Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Check the new windows for server output." -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to close this window"

