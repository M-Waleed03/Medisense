# MEDISENSE Startup Script
# Prerequisites: Node.js, Python 3.11+, Tesseract OCR, Flutter SDK for mobile development.

Write-Host "Starting MEDISENSE Full-Stack Application..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$logDir = Join-Path $root ".logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

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
      Write-Host "Stopping existing process on port $Port (PID $listenerPid)..." -ForegroundColor Yellow
      Stop-Process -Id $listenerPid -Force -ErrorAction SilentlyContinue
    }
  }
}

function Test-WebCss {
  $url = "http://localhost:3000/chatbot"
  for ($attempt = 1; $attempt -le 12; $attempt++) {
    try {
      $html = (Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 20).Content
      $match = [regex]::Match($html, 'href="([^"]+\.css[^"]*)"')
      if (!$match.Success) {
        Start-Sleep -Seconds 2
        continue
      }

      $cssPath = $match.Groups[1].Value
      $css = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3000$cssPath" -TimeoutSec 20
      if ($css.StatusCode -eq 200 -and $css.Content -match "\.bg-primary") {
        Write-Host "Web CSS verified." -ForegroundColor Green
        return
      }

      Start-Sleep -Seconds 2
    } catch {
      Start-Sleep -Seconds 2
    }
  }

  Write-Host "Web CSS check failed. Restart the web service after clearing web\.next." -ForegroundColor Red
}

Stop-PortListener -Port 8000
Stop-PortListener -Port 5000
Stop-PortListener -Port 3000

Write-Host "Starting ML Service on port 8000..." -ForegroundColor Green
$mlDir = Join-Path $root "ml"
$pythonExe = Join-Path $mlDir "venv\Scripts\python.exe"
if (!(Test-Path -LiteralPath $pythonExe)) {
  Push-Location $mlDir
  python -m venv venv
  & $pythonExe -m pip install -r requirements.txt
  Pop-Location
}
Start-Process powershell -WindowStyle Hidden -ArgumentList "-NoProfile", "-NoExit", "-Command", "Set-Location -LiteralPath `"$mlDir`"; .\venv\Scripts\python.exe app.py *> `"..\.logs\fastapi.dev.log`""

Write-Host "Cleaning Next.js cache..." -ForegroundColor Green
$nextCache = Join-Path $root "web\.next"
if (Test-Path -LiteralPath $nextCache) {
  Remove-Item -LiteralPath $nextCache -Recurse -Force
}

Write-Host "Starting Express Backend on port 5000..." -ForegroundColor Green
Start-Process powershell -WindowStyle Hidden -ArgumentList "-NoProfile", "-NoExit", "-Command", "Set-Location -LiteralPath `"$root`"; npm.cmd run dev --workspace backend *> `".logs\backend.dev.log`""

Write-Host "Starting Next.js Frontend on port 3000..." -ForegroundColor Green
Start-Process powershell -WindowStyle Hidden -ArgumentList "-NoProfile", "-NoExit", "-Command", "Set-Location -LiteralPath `"$root`"; npm.cmd run dev --workspace web *> `".logs\web.dev.log`""

Test-WebCss

Write-Host "Services are starting in hidden PowerShell windows." -ForegroundColor Yellow
Write-Host "Web Frontend: http://localhost:3000"
Write-Host "Backend API: http://localhost:5000/api/health"
Write-Host "ML Service: http://localhost:8000/health"
