# QuickServe - Stop All Services
Write-Host "Stopping all Node.js processes..." -ForegroundColor Yellow

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "✓ All services stopped!" -ForegroundColor Green
Write-Host "`nPress any key to close this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
