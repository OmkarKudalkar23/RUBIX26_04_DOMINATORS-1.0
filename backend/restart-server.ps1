# PowerShell script to restart the backend server
Write-Host "🛑 Stopping any running Node.js processes on port 5000..." -ForegroundColor Yellow

# Find and kill process on port 5000
$process = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($process) {
    Stop-Process -Id $process -Force
    Write-Host "✅ Stopped process on port 5000" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "ℹ️  No process found on port 5000" -ForegroundColor Cyan
}

Write-Host "`n🚀 Starting backend server..." -ForegroundColor Yellow
Set-Location "C:\mumbai hacks frontend\Mumbai_hacks\backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node server.js" -WindowStyle Normal

Write-Host "✅ Server should be starting. Check the new window for output." -ForegroundColor Green
Write-Host "`n📝 If you see errors, make sure:" -ForegroundColor Cyan
Write-Host "   1. MongoDB connection is working" -ForegroundColor Cyan
Write-Host "   2. All dependencies are installed (npm install)" -ForegroundColor Cyan
Write-Host "   3. Port 5000 is available" -ForegroundColor Cyan


