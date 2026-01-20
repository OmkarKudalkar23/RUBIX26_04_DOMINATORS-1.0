# Run this script to complete the Inventory System integration
# PowerShell script to add Inventory tab to Hospital Dashboard

$file = "c:\Users\Omkar Kudalkar\OneDrive\Desktop\rubix'2026\frontend\src\components\HospitalDashboard.tsx"

Write-Host "🔧 Adding Inventory Tab Integration..." -ForegroundColor Cyan

# Read the file
$lines = Get-Content $file

# Define the inventory tab code to insert
$inventoryTab = @(
"            {/* Inventory Tab */}",
"            {activeTab === `"inventory`" && (",
"              <InventoryTab hospitalId={hospitalId} />",
"            )}",
""
)

# Insert at line 2668 (before Settings Tab at line 2669)
$newLines = $lines[0..2667] + $inventoryTab + $lines[2668..($lines.Count-1)]

# Save the file
$newLines | Set-Content $file -Encoding UTF8

Write-Host "✅ Step 1: Added Inventory tab content" -ForegroundColor Green

# Now add navigation button in mobile menu (after line 633 - CITY DASHBOARD)
$lines = Get-Content $file

$navButton = @(
"",
"              <button",
"                onClick={() => {",
"                  setActiveTab(`"inventory`");",
"                  setShowMobileMenu(false);",
"                }}",
"                className={``flex items-center gap-3 px-4 py-3 rounded-xl transition-colors `${",
"                  activeTab === `"inventory`"",
"                    ? `"bg-black text-white`"",
"                    : `"text-gray-700 hover:bg-gray-100`"",
"                }``}",
"              >",
"                <Package size={20} />",
"                <span className=`"text-sm font-semibold uppercase tracking-wide`">",
"                  {t.inventory}",
"                </span>",
"              </button>"
)

# Find the line with CITY DASHBOARD button and add after it
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "CITY DASHBOARD" -and $i -gt 600 -and $i -lt 650) {
        # Find the closing </button> tag
        for ($j = $i; $j -lt $i + 20; $j++) {
            if ($lines[$j] -match "</button>") {
                $insertLine = $j
                break
            }
        }
        if ($insertLine) {
            $newLines = $lines[0..$insertLine] + $navButton + $lines[($insertLine+1)..($lines.Count-1)]
            $newLines | Set-Content $file -Encoding UTF8
            Write-Host "✅ Step 2: Added mobile navigation button" -ForegroundColor Green
            break
        }
    }
}

# Add desktop navigation button (around line 900-1000)
$lines = Get-Content $file

for ($i = 800; $i -lt 1100; $i++) {
    if ($lines[$i] -match "CITY DASHBOARD" -and $lines[$i] -notmatch "//") {
        # Find the closing </button> tag
        for ($j = $i; $j -lt $i + 20; $j++) {
            if ($lines[$j] -match "</button>") {
                $insertLine = $j
                break
            }
        }
        if ($insertLine) {
            # Create desktop nav button (without setShowMobileMenu)
            $desktopNavButton = @(
"",
"              <button",
"                onClick={() => setActiveTab(`"inventory`")}",
"                className={``flex items-center gap-3 px-4 py-3 rounded-xl transition-colors `${",
"                  activeTab === `"inventory`"",
"                    ? `"bg-black text-white`"",
"                    : `"text-gray-700 hover:bg-gray-100`"",
"                }``}",
"              >",
"                <Package size={20} />",
"                <span className=`"text-sm font-semibold uppercase tracking-wide`">",
"                  {t.inventory}",
"                </span>",
"              </button>"
            )
            $newLines = $lines[0..$insertLine] + $desktopNavButton + $lines[($insertLine+1)..($lines.Count-1)]
            $newLines | Set-Content $file -Encoding UTF8
            Write-Host "✅ Step 3: Added desktop navigation button" -ForegroundColor Green
            break
        }
    }
}

Write-Host ""
Write-Host "🎉 INVENTORY SYSTEM INTEGRATION COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Restart the backend server (Ctrl+C then npm start)" -ForegroundColor White
Write-Host "2. Refresh the frontend" -ForegroundColor White
Write-Host "3. Click 'INVENTORY' tab in the dashboard" -ForegroundColor White
Write-Host "4. Start adding medicines!" -ForegroundColor White
Write-Host ""
