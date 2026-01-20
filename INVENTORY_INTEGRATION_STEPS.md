# Inventory Tab Integration Instructions

## Step 1: Add Import (at the top of HospitalDashboard.tsx, around line 36)
```typescript
import { InventoryTab } from './InventoryTab';
```

## Step 2: Add Navigation Item (around line 633, after City Dashboard)
Add this in both mobile menu and desktop sidebar:

```typescript
<button
  onClick={() => setActiveTab("inventory")}
  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
    activeTab === "inventory"
      ? "bg-black text-white"
      : "text-gray-700 hover:bg-gray-100"
  }`}
>
  <Package size={20} />
  <span className="text-sm font-semibold uppercase tracking-wide">
    {t.inventory || "INVENTORY"}
  </span>
</button>
```

## Step 3: Add Tab Content (before Settings Tab, around line 2700)
```typescript
{/* Inventory Tab */}
{activeTab === "inventory" && (
  <InventoryTab hospitalId={hospitalId} />
)}
```

## Step 4: Add Translation (in translations object, around line 15)
```typescript
inventory: "Inventory",
```

## Step 5: Import Package icon from lucide-react (around line 40)
Add `Package` to the imports from lucide-react

## Quick PowerShell Commands:

### Add Import:
```powershell
$file = "c:\Users\Omkar Kudalkar\OneDrive\Desktop\rubix'2026\frontend\src\components\HospitalDashboard.tsx"
$content = Get-Content $file -Raw
$searchText = 'import { Chatbot } from "./Chatbot";'
$replacement = 'import { Chatbot } from "./Chatbot";
import { InventoryTab } from "./InventoryTab";'
$content = $content.Replace($searchText, $replacement)
Set-Content $file -Value $content -NoNewline
Write-Host "✅ Added InventoryTab import"
```

### Add Package icon:
```powershell
$file = "c:\Users\Omkar Kudalkar\OneDrive\Desktop\rubix'2026\frontend\src\components\HospitalDashboard.tsx"
$content = Get-Content $file -Raw
$content = $content.Replace('  Globe,', '  Globe,
  Package,')
Set-Content $file -Value $content -NoNewline
Write-Host "✅ Added Package icon"
```

### Add translation:
```powershell
$file = "c:\Users\Omkar Kudalkar\OneDrive\Desktop\rubix'2026\frontend\src\components\HospitalDashboard.tsx"
$content = Get-Content $file -Raw
$content = $content.Replace('    appointments: "Appointments",', '    appointments: "Appointments",
    inventory: "Inventory",')
Set-Content $file -Value $content -NoNewline
Write-Host "✅ Added inventory translation"
```

## Manual Steps Required:
1. Add navigation button in mobile menu (search for "CITY DASHBOARD" button)
2. Add navigation button in desktop sidebar  
3. Add tab content before Settings tab
4. Restart backend server to load inventory routes
