# PowerShell script to kill existing server and restart it

Write-Host "🛑 Stopping backend server..." -ForegroundColor Yellow

# Find process on port 5000
$connection = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($connection) {
    $processId = $connection.OwningProcess
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "   Found process: $($process.ProcessName) (PID: $processId)" -ForegroundColor Cyan
        Stop-Process -Id $processId -Force
        Write-Host "   ✅ Process stopped" -ForegroundColor Green
        Start-Sleep -Seconds 2
    }
} else {
    Write-Host "   ℹ️  No process found on port 5000" -ForegroundColor Cyan
}

Write-Host "`n🚀 Starting backend server..." -ForegroundColor Yellow

Set-Location "C:\mumbai hacks frontend\Mumbai_hacks\backend"

# Start server in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\mumbai hacks frontend\Mumbai_hacks\backend'; Write-Host 'Starting server...' -ForegroundColor Green; node server.js" -WindowStyle Normal

Write-Host "`n✅ Server should be starting in a new window!" -ForegroundColor Green
Write-Host "`n📋 Look for these messages:" -ForegroundColor Cyan
Write-Host "   ✅ MongoDB connected" -ForegroundColor White
Write-Host "   ✅ Doctor routes registered  <-- IMPORTANT!" -ForegroundColor White
Write-Host "   🚀 Server running on port 5000" -ForegroundColor White
Write-Host "`n⏳ Wait 3-5 seconds, then run: node check-server-status.js" -ForegroundColor Yellow


