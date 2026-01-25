# start-all.ps1 - Démarre tous les services PS8

Write-Host " Starting PS8 Services..." -ForegroundColor Green
Write-Host ""

# Kill existing node processes
Write-Host " Cleaning up existing processes..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 1

# Start File Service
Write-Host " Starting File Service (8001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd services/files; node index.js"
Start-Sleep -Seconds 2

# Start Game Service
Write-Host " Starting Game Service (8002)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd services/game; node index.js"
Start-Sleep -Seconds 2

# Start Gateway
Write-Host "🚪 Starting Gateway (8000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd services/gateway; node index.js"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host " All services started!" -ForegroundColor Green
Write-Host ""
Write-Host " URLs:" -ForegroundColor Yellow
Write-Host "   Gateway: http://localhost:8000"
Write-Host "   Test Client: http://localhost:8000/test-client.html"
Write-Host ""
Write-Host "Press any key to stop all services..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Cleanup on exit
taskkill /F /IM node.exe
Write-Host " All services stopped." -ForegroundColor Red