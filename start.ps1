Write-Host "Starting Thought Velocity Tracker (TVT)..." -ForegroundColor Cyan

if (-not (Test-Path "venv")) {
    Write-Host "Creating Python Virtual Environment..." -ForegroundColor Yellow
    python -m venv venv
}

Write-Host "Installing requirements..." -ForegroundColor Yellow
.\venv\Scripts\python -m pip install -r backend/requirements.txt
if (Test-Path "nlp_engine/requirements.txt") {
    .\venv\Scripts\python -m pip install -r nlp_engine/requirements.txt
}

Write-Host "Installing Frontend dependencies..." -ForegroundColor Yellow
Set-Location -Path "frontend"
cmd.exe /c "npm install"
Set-Location -Path ".."

Write-Host "Starting FastAPI Backend on port 8000..." -ForegroundColor Green
Start-Process -NoNewWindow -FilePath ".\venv\Scripts\python.exe" -ArgumentList "-m", "uvicorn", "backend.main:app", "--reload", "--port", "8000"

Write-Host "Starting Vite Frontend..." -ForegroundColor Green
Set-Location -Path "frontend"
cmd.exe /c "npm run dev"
