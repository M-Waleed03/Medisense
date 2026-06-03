# MEDISENSE Startup Script - Single Command
# Prerequisites: Node.js, Python 3.11+, npm
# Starts: ML Service (port 8000), Backend (port 5000), Frontend (port 3000)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MEDISENSE Full-Stack Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$mlDir = Join-Path $root "ml"

function Stop-PortListener {
  param([int]$Port)
  $listeners = netstat -ano | Select-String "LISTENING" | Select-String "[:.]$Port\s+"
  $processIds = @()
  foreach ($listener in $listeners) {
    $parts = $listener.Line.Trim() -split "\s+"
    if ($parts.Count -ge 5) {
      $processIds += [int]$parts[-1]
    }
  }
  foreach ($listenerPid in ($processIds | Sort-Object -Unique)) {
    if ($listenerPid -and $listenerPid -ne $PID) {
      Write-Host "  Stopping process on port $Port (PID $listenerPid)..." -ForegroundColor Yellow
      Stop-Process -Id $listenerPid -Force -ErrorAction SilentlyContinue
      Start-Sleep -Milliseconds 500
    }
  }
}

function Setup-MLEnvironment {
  Write-Host "[1/4] Setting up ML environment..." -ForegroundColor Cyan
  $pythonExe = Join-Path $mlDir "venv\Scripts\python.exe"
  if (!(Test-Path -LiteralPath $pythonExe)) {
    Write-Host "      Creating venv..." -ForegroundColor Yellow
    Push-Location $mlDir
    python -m venv venv 2>&1 | Out-Null
    Write-Host "      Installing dependencies..." -ForegroundColor Yellow
    & $pythonExe -m pip install -q -r requirements.txt 2>&1 | Out-Null
    Pop-Location
    Write-Host "      [OK] ML ready" -ForegroundColor Green
  } else {
    Write-Host "      [OK] ML venv exists" -ForegroundColor Green
  }
}

function Clean-Ports {
  Write-Host "[2/4] Checking ports 8000, 5000, 3000..." -ForegroundColor Cyan
  foreach ($port in @(8000, 5000, 3000)) {
    $listeners = netstat -ano | Select-String "LISTENING" | Select-String "[:.]$port\s+"
    if ($listeners) {
      Write-Host "      Clearing port $port..." -ForegroundColor Yellow
      Stop-PortListener -Port $port
    }
  }
  Write-Host "      [OK] Ports cleared" -ForegroundColor Green
}

function Clean-NextCache {
  Write-Host "[3/4] Cleaning build cache..." -ForegroundColor Cyan
  $nextCache = Join-Path $root "web\.next"
  if (Test-Path -LiteralPath $nextCache) {
    Remove-Item -LiteralPath $nextCache -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "      [OK] Cache cleaned" -ForegroundColor Green
  } else {
    Write-Host "      [OK] No cache" -ForegroundColor Green
  }
}

function Start-Services {
  Write-Host "[4/4] Starting all services..." -ForegroundColor Cyan
  Write-Host "      Running: npm run dev (concurrent)" -ForegroundColor Yellow
  Write-Host ""
  
  Push-Location $root
  npm.cmd run dev 2>&1 | ForEach-Object {
    if ($_ -match "Ready in|listening on|Application startup|Started server|Uvicorn running") {
      Write-Host $_ -ForegroundColor Green
    } elseif ($_ -match "error|Error|ERROR|failed|Failed") {
      Write-Host $_ -ForegroundColor Red
    } else {
      Write-Host $_
    }
  }
  Pop-Location
}

$ErrorActionPreference = "Continue"
Setup-MLEnvironment
Write-Host ""
Clean-Ports
Write-Host ""
Clean-NextCache
Write-Host ""
Start-Services

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Services Running" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Frontend:   http://localhost:3000" -ForegroundColor Green
Write-Host "Backend:    http://localhost:5000/api/health" -ForegroundColor Green
Write-Host "ML Service: http://localhost:8000/health" -ForegroundColor Green
Write-Host ""
Write-Host "Press CTRL+C to stop all services" -ForegroundColor Yellow
Write-Host ""
