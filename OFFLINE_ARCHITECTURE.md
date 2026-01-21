# Offline-First Architecture for Hospital Operations Dashboard

## Overview

This document describes the offline-first architecture implemented for the hospital operations dashboard. The system ensures **continuity of critical hospital workflows during network outages** while preserving backend authority.

> **"Offline mode ensures continuity of care during network outages while preserving backend authority."**

## Design Philosophy

This is a **healthcare system**, so we prioritize:

1. **Patient safety over automation** - Never silently override backend decisions
2. **Human review over auto-fix** - Conflicts require staff attention
3. **Backend as single source of truth** - All offline actions are provisional
4. **Design for failure scenarios** - Graceful degradation, clear indicators

## What Works Offline

✅ **Enabled for offline use (hospital-local only):**
- Rule-Based Admission Workflow
- OPD Queue (local hospital queue only)
- Live Bed Availability (last known + local updates)
- Inventory usage logging (temporary)

❌ **Online-only (unchanged):**
- Inter-Hospital Capacity Sharing
- City Dashboard
- Cross-hospital analytics

## Architecture

### Tech Stack

- **IndexedDB** via [Dexie.js](https://dexie.org/) - Local data persistence
- **navigator.onLine** - Connectivity detection
- **React hooks** - UI state management

### File Structure

```
frontend/src/
├── services/
│   ├── offlineDb.ts          # Dexie database schema & utilities
│   ├── syncEngine.ts         # Sync logic & cache management
│   └── offlineHospitalApi.ts # Offline-aware API wrapper
├── hooks/
│   └── useOfflineStatus.ts   # React hook for offline state
└── components/
    └── OfflineIndicators.tsx # UI components for offline status
```

### Database Schema

The `HospitalOfflineDB` contains:

| Table | Purpose |
|-------|---------|
| `beds` | Cached bed availability (read-only cache) |
| `admissionRules` | Static admission rules |
| `opdQueue` | Local OPD queue state |
| `admissions` | Admission records |
| `inventoryItems` | Inventory stock levels |
| `inventoryLogs` | Inventory usage logs |
| `pendingActions` | **SYNC QUEUE** - Offline actions awaiting sync |
| `syncMetadata` | Sync state tracking |

### Sync Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ONLINE MODE                               │
├─────────────────────────────────────────────────────────────┤
│  1. Fetch data from backend APIs                            │
│  2. Store cached copy in Dexie (IndexedDB)                  │
│  3. Normal operation                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                    Network Failure
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   OFFLINE MODE                               │
├─────────────────────────────────────────────────────────────┤
│  1. Show visible "Offline Mode" badge in UI                 │
│  2. Use Dexie data instead of APIs                          │
│  3. Allow: Admission workflow, OPD queue, Bed assignment    │
│  4. All offline actions marked as: status = PROVISIONAL     │
└─────────────────────────────────────────────────────────────┘
                              │
                    Network Restored
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   SYNC PROCESS                               │
├─────────────────────────────────────────────────────────────┤
│  1. Detect online state                                     │
│  2. Process pending actions in FIFO order                   │
│  3. Send to backend APIs                                     │
│  4. Backend revalidates (bed availability, conflicts)        │
│  5. Outcomes:                                                │
│     ✅ Accepted → mark synced                               │
│     ⚠️ Conflict → notify staff for manual resolution        │
│     ❌ Failed → retry with backoff                          │
└─────────────────────────────────────────────────────────────┘
```

## UI Indicators

### Offline Badge
Appears in the header when offline, showing:
- 🟡 **Offline Mode** - Currently disconnected
- 🔵 **Syncing...** - Uploading pending actions
- 🟣 **X Pending** - Actions waiting to sync
- 🔴 **X Conflicts** - Issues requiring review

### Sync Status Banner
Full-width banner below header showing detailed status and action buttons.

### Provisional Badge
Appears on individual items created/modified while offline.

### Conflict Modal
Modal for reviewing and resolving sync conflicts.

## Conflict Handling

### Example Conflicts
- Same bed assigned twice offline (by different staff)
- OPD queue position mismatch
- Inventory consumed more than available

### Resolution Strategy
1. **Backend decides** using:
   - Timestamp priority
   - Business rules
   - Hospital policy
2. **UI shows conflict alert** - No auto-fix
3. **Staff reviews and acknowledges** the resolution

## Security & Safety

- ❌ No sensitive medical records stored offline
- ❌ No cross-hospital data offline
- ✅ Offline data is hospital-specific only
- ✅ Clear audit trail on sync
- ✅ All offline actions are traceable

## Usage

### For Developers

```typescript
// Check offline status in any component
import { useOfflineStatus } from '../hooks/useOfflineStatus';

function MyComponent() {
  const { isOffline, isSyncing, pendingCount, conflicts, syncNow } = useOfflineStatus();
  
  if (isOffline) {
    // Handle offline state
  }
}
```

### Using Offline-Aware API

```typescript
import { fetchBeds, occupyBed, createAdmission } from '../services/offlineHospitalApi';

// These functions automatically:
// - Use backend when online
// - Use cache when offline
// - Queue actions for later sync
const { data, fromCache, provisional } = await fetchBeds();

if (provisional) {
  // Show warning that data is provisional
}
```

## Pending Actions Queue

Actions queued while offline:
- `ADMISSION_CREATE` - New admission request
- `ADMISSION_ADMIT` - Confirm bed allocation
- `ADMISSION_DISCHARGE` - Discharge patient
- `OPD_CHECKIN` - Check in patient to OPD
- `OPD_UPDATE_STATUS` - Update queue status
- `OPD_UPDATE_PRIORITY` - Update priority
- `BED_OCCUPY` - Occupy a bed
- `BED_RELEASE` - Release a bed
- `INVENTORY_CONSUME` - Log inventory usage

## Testing Offline Mode

1. Open Chrome DevTools → Network tab
2. Select "Offline" from the network throttling dropdown
3. Perform actions (check-in, bed allocation, etc.)
4. Switch back to "Online"
5. Observe sync process and conflict resolution

## Best Practices

1. **Always check `provisional` flag** before making critical decisions
2. **Show clear indicators** for offline-created data
3. **Never auto-fix conflicts** - always require human review
4. **Log all offline actions** for audit trail
5. **Test failure scenarios** regularly

---

*Implemented as part of the hospital operations dashboard enhancement for network resilience.*
