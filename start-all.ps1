# QuickServe - Start All Services
Write-Host "Starting QuickServe services..." -ForegroundColor Green

# Start Backend (Port 3000)
Write-Host "`n[1/4] Starting Backend on port 3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm start"

Start-Sleep -Seconds 3

# Start Landing Page (Port 3001)
Write-Host "[2/4] Starting Landing Page on port 3001..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\landing'; npm run dev"

Start-Sleep -Seconds 3

# Start Admin Panel (Port 5174)
Write-Host "[3/4] Starting Admin Panel on port 5174..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\admin'; npm run dev"

Start-Sleep -Seconds 3

# Start Customer App (Port 8080)
Write-Host "[4/4] Starting Customer App on port 8080..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\customer'; npm run dev"

Write-Host "`n✓ All services started!" -ForegroundColor Green
Write-Host "`nAccess your application at:" -ForegroundColor Yellow
Write-Host "  Landing Page: http://localhost:3001" -ForegroundColor White
Write-Host "  Backend API:  http://localhost:3000" -ForegroundColor White
Write-Host "  Admin Panel:  http://localhost:5174" -ForegroundColor White
Write-Host "  Customer App: http://localhost:8080" -ForegroundColor White
Write-Host "`nPress any key to close this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Write-Host "📋 Getting Started:" -ForegroundColor Cyan
Write-Host "1. Visit http://localhost:3000 to register a restaurant" -ForegroundColor White
Write-Host "2. Login with your restaurant credentials" -ForegroundColor White
Write-Host "3. Use the dashboard to access Admin and Customer panels" -ForegroundColor White
Write-Host ""
Write-Host "🔧 To stop all services: Close all PowerShell windows or press Ctrl+C in each" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this script..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")