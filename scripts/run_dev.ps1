# ==============================================================================
# ASTRA AI - Windows Development Runner
# Starts MCP Server (Port 8000), Client Backend (Port 3001), and Frontend (Port 5173)
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "          Starting ASTRA AI - Alexa+ Edition              " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan

$RootPath = (Get-Item $PSScriptRoot).Parent.FullName

# 1. Check Python Venv
if (-not (Test-Path "$RootPath\.venv")) {
    Write-Host "[1/4] Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv "$RootPath\.venv"
    & "$RootPath\.venv\Scripts\pip.exe" install -r "$RootPath\mcp-server\requirements.txt"
}

# 2. Check Node Dependencies
if (-not (Test-Path "$RootPath\client-backend\node_modules")) {
    Write-Host "[2/4] Installing Client Backend dependencies..." -ForegroundColor Yellow
    npm.cmd --prefix "$RootPath\client-backend" install
}

if (-not (Test-Path "$RootPath\frontend\node_modules")) {
    Write-Host "[3/4] Installing Frontend dependencies..." -ForegroundColor Yellow
    npm.cmd --prefix "$RootPath\frontend" install
}

Write-Host "[4/4] Launching development processes..." -ForegroundColor Green

# Start Python MCP Server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RootPath'; `$env:PYTHONPATH='mcp-server'; & '.\.venv\Scripts\python.exe' -m app.server" -WindowStyle Normal

# Start Client Backend BFF
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RootPath\client-backend'; npm.cmd run dev" -WindowStyle Normal

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RootPath\frontend'; npm.cmd run dev" -WindowStyle Normal

Start-Sleep -Seconds 3
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " ASTRA AI Services are starting:" -ForegroundColor White
Write-Host " - Python MCP Server : http://127.0.0.1:8000/mcp" -ForegroundColor Magenta
Write-Host " - Client Backend    : http://127.0.0.1:3001" -ForegroundColor Yellow
Write-Host " - React Frontend    : http://127.0.0.1:5173" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# Open default browser
Start-Process "http://localhost:5173"
