# Live Update Feature Flag Testing Guide

This guide provides comprehensive testing steps to verify the Live Update feature flag system is working correctly.

## Overview

The Live Update feature is controlled by a boolean flag in `config/live-update.ts`. When disabled, the LiveUpdate plugin is not included in the Capacitor config and the listener is not registered in the app.

## Automated Tests

Run the automated test suite:

```powershell
npm run test:run
```

This will run:
- `src/config/__tests__/live-update.test.ts` - Verifies the config file structure
- `src/__tests__/App.live-update.test.tsx` - Verifies conditional listener registration

## Manual Testing Steps

### 1. Verify Initial State (Disabled)

**Check the config file:**
```powershell
Get-Content config/live-update.ts
```

Expected output should show:
```typescript
export const LIVE_UPDATE_ENABLED = false;
```

**Verify TypeScript compilation:**
```powershell
npm run build
```

Should compile successfully with no errors.

**Verify Capacitor config:**
```powershell
Get-Content capacitor.config.ts | Select-String -Pattern "LiveUpdate"
```

Should return nothing (plugin not included when disabled).

**Check App.tsx imports:**
```powershell
Get-Content src/App.tsx | Select-String -Pattern "LIVE_UPDATE_ENABLED"
```

Should show the import and conditional check.

### 2. Test Toggle Script - Disable

```powershell
npm run disable:live-update
```

**Verify:**
- Script completes without errors
- `config/live-update.ts` shows `LIVE_UPDATE_ENABLED = false`
- Build still works: `npm run build`

### 3. Test Toggle Script - Enable

```powershell
npm run enable:live-update
```

**Verify:**
- Script completes without errors
- `config/live-update.ts` shows `LIVE_UPDATE_ENABLED = true`
- Build still works: `npm run build`
- Capacitor config includes LiveUpdate plugin:
  ```powershell
  Get-Content capacitor.config.ts | Select-String -Pattern "LiveUpdate" -Context 2
  ```

### 4. Verify Build Process Integration

**Test development build (should disable LiveUpdate):**
```powershell
npm run disable:live-update
npm run build
npx cap sync android
```

**Verify in `android/app/src/main/assets/capacitor.config.json`:**
- LiveUpdate plugin should NOT be present when disabled
- LiveUpdate plugin SHOULD be present when enabled

**Test production build (should enable LiveUpdate):**
```powershell
npm run enable:live-update
npm run build
npx cap sync android
```

### 5. Runtime Verification (When Enabled)

If you have a device/emulator:

1. Enable LiveUpdate:
   ```powershell
   npm run enable:live-update
   npm run build
   npx cap sync android
   ```

2. Build and run the app:
   ```powershell
   npm run dev:android
   ```

3. **Check console logs** - The listener should be registered (no errors)

4. **Test resume behavior:**
   - Put app in background
   - Bring app to foreground
   - Check console for any LiveUpdate sync attempts

### 6. Verify No Runtime Errors When Disabled

1. Ensure LiveUpdate is disabled:
   ```powershell
   npm run disable:live-update
   npm run build
   ```

2. Run the app and verify:
   - No console errors about missing CapacitorApp or LiveUpdate
   - App functions normally
   - No listener registration attempts

## Quick Verification Script

Create a PowerShell script to quickly verify the state:

```powershell
# check-live-update-state.ps1
$config = Get-Content config/live-update.ts -Raw
if ($config -match "LIVE_UPDATE_ENABLED = (true|false)") {
    $enabled = $matches[1] -eq "true"
    Write-Host "Live Update is: $($matches[1].ToUpper())" -ForegroundColor $(if ($enabled) { "Green" } else { "Yellow" })
    
    # Check capacitor config
    $capConfig = Get-Content capacitor.config.ts -Raw
    if ($enabled) {
        if ($capConfig -match "LiveUpdate") {
            Write-Host "✅ LiveUpdate plugin found in capacitor.config.ts" -ForegroundColor Green
        } else {
            Write-Host "❌ LiveUpdate plugin NOT found in capacitor.config.ts" -ForegroundColor Red
        }
    } else {
        if ($capConfig -notmatch "LiveUpdate") {
            Write-Host "✅ LiveUpdate plugin correctly excluded" -ForegroundColor Green
        } else {
            Write-Host "⚠️  LiveUpdate plugin found but should be disabled" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "❌ Could not parse config file" -ForegroundColor Red
}
```

Run it with:
```powershell
.\check-live-update-state.ps1
```

## Expected Behavior Summary

| State | Config Value | Capacitor Plugin | App Listener | Build |
|-------|--------------|------------------|--------------|-------|
| Disabled | `false` | Not included | Not registered | ✅ Works |
| Enabled | `true` | Included | Registered | ✅ Works |

## Troubleshooting

**Issue: TypeScript errors after toggle**
- Solution: Ensure imports are always present (not commented)
- Verify: `src/App.tsx` should always import CapacitorApp and LiveUpdate

**Issue: Plugin still in config when disabled**
- Solution: Check that `capacitor.config.ts` uses spread operator correctly
- Verify: The conditional spread `...(LIVE_UPDATE_ENABLED && {...})` syntax

**Issue: Listener registered when disabled**
- Solution: Check that `App.tsx` uses `if (LIVE_UPDATE_ENABLED)` guard
- Verify: The listener code is inside the conditional block

## Test Checklist

- [ ] Config file exists and exports boolean
- [ ] Toggle script can set flag to `true`
- [ ] Toggle script can set flag to `false`
- [ ] TypeScript compiles in both states
- [ ] Capacitor config includes plugin when enabled
- [ ] Capacitor config excludes plugin when disabled
- [ ] App builds successfully in both states
- [ ] No runtime errors when disabled
- [ ] Listener registered when enabled (runtime check)
- [ ] Listener NOT registered when disabled (runtime check)


