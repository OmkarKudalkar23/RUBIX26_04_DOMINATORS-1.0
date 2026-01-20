# Complete fix script for doctor routes
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FIXING DOCTOR ROUTES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill process on port 5000
Write-Host "Step 1: Stopping server on port 5000..." -ForegroundColor Yellow
$connection = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($connection) {
    $processId = $connection.OwningProcess
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "   Found: $($process.ProcessName) (PID: $processId)" -ForegroundColor Cyan
        Stop-Process -Id $processId -Force
        Write-Host "   ✅ Stopped" -ForegroundColor Green
        Start-Sleep -Seconds 2
    }
} else {
    Write-Host "   ℹ️  No server found on port 5000" -ForegroundColor Cyan
}

# Step 2: Verify routes file exists
Write-Host "`nStep 2: Checking routes file..." -ForegroundColor Yellow
$routesFile = "routes\doctor.js"
if (Test-Path $routesFile) {
    Write-Host "   ✅ routes/doctor.js exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ routes/doctor.js NOT FOUND!" -ForegroundColor Red
    exit 1
}

# Step 3: Test loading routes
Write-Host "`nStep 3: Testing route loading..." -ForegroundColor Yellow
try {
    $testResult = node -e "try { const r = require('./routes/doctor'); console.log('OK'); } catch(e) { console.log('ERROR:', e.message); }"
    if ($testResult -match "OK") {
        Write-Host "   ✅ Routes can be loaded" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Error loading routes: $testResult" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Test failed: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Start server
Write-Host "`nStep 4: Starting server..." -ForegroundColor Yellow
Set-Location "C:\mumbai hacks frontend\Mumbai_hacks\backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\mumbai hacks frontend\Mumbai_hacks\backend'; Write-Host '🚀 Starting Backend Server...' -ForegroundColor Green; Write-Host ''; node server.js" -WindowStyle Normal

Write-Host "   ✅ Server starting in new window" -ForegroundColor Green

# Step 5: Wait and verify
Write-Host "`nStep 5: Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "`nStep 6: Verifying routes..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
node check-server-status.js

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DONE!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`n📋 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Check the new server window" -ForegroundColor White
Write-Host "   2. Look for: '✅ Doctor routes registered'" -ForegroundColor White
Write-Host "   3. If you see it, routes are working!" -ForegroundColor White
Write-Host "   4. Try logging in again in your frontend" -ForegroundColor White
Write-Host ""


