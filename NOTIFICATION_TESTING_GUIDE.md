# Notification Testing Guide

## What We've Added

### 1. Scheduled Time in Notification Text
Notifications now show when they were scheduled to be received:
- **Random notifications**: "Scheduled for Dec 1, 8:00 AM. Time for stillness? Open the app to see today's a+q"
- **Fixed notifications**: "Scheduled for Dec 1, 5:00 PM daily. Time for stillness? Open the app to see today's a+q"

This helps identify which notification is which during testing.

### 2. File-Based Logging
A new logging system (`notificationLogger`) that:
- Logs all notification operations with timestamps
- Stores logs in memory (last 1000 entries)
- Optionally writes to file if `@capacitor/filesystem` is available
- Can export logs for analysis

## How to Use

### Viewing Logs During Testing

#### Option 1: Console Logs (Always Available)
All logs are written to console with `🔍 [DEBUG]`, `ℹ️ [INFO]`, `⚠️ [WARN]`, `❌ [ERROR]` prefixes.

**On Android Emulator/Device:**
```powershell
# Capture logs using adb
adb logcat | Select-String "\[DEBUG\]|\[INFO\]|\[WARN\]|\[ERROR\]"
```

#### Option 2: Export Logs (If Debug Mode Enabled)
1. Enable debug mode in `notificationService.ts` (set `DEBUG_MODE = true`)
2. Go to Settings → Notification Settings
3. Click "Debug: Export Logs" button
4. Logs will be:
   - Saved to Documents directory (if Filesystem available)
   - Or displayed in console (if Filesystem not available)

#### Option 3: Programmatic Access
```typescript
import { notificationService } from './services/notificationService';

// Export logs
const logFile = await notificationService.exportLogs();

// Get recent logs as text
const recentLogs = notificationService.getRecentLogs(50);
console.log(recentLogs);
```

### Reading Notification Text
When a notification appears, check the text:
- If it says "Scheduled for Dec 1, 8:00 AM" but you set it to 5pm, that's an old random notification
- If it says "Scheduled for Dec 1, 5:00 PM daily", that's the correct fixed notification

## Testing Workflow

### 1. Start Log Capture
```powershell
.\capture-notification-logs.ps1 test1_old_notifications
```

### 2. Follow Test Instructions
The script will display step-by-step instructions for what to do in the emulator.

### 3. Observe Notifications
When notifications appear, check:
- **The scheduled time in the notification text** - does it match what you set?
- **The time it actually appears** - does it match the scheduled time?

### 4. Stop Log Capture
Press `Ctrl+C` after completing test steps.

### 5. Analyze Logs
```powershell
# View captured logs
Get-Content logs_test1_old_notifications_*.txt

# Or export from app (if debug mode enabled)
# Use "Debug: Export Logs" button in Settings
```

## What to Look For

### In Notification Text:
- ✅ **Correct**: "Scheduled for Dec 1, 5:00 PM daily" when set to 5pm fixed
- ❌ **Wrong**: "Scheduled for Dec 1, 8:00 AM" when set to 5pm fixed (old random notification)

### In Logs:
Look for these patterns:

1. **Old notifications not cancelled:**
   ```
   [DEBUG] Pending BEFORE cancel: [{id: 1800, scheduled: "Dec 1, 8:00 AM"}]
   [DEBUG] Pending AFTER cancel: [{id: 1800, scheduled: "Dec 1, 8:00 AM"}]  ← Still there!
   ```

2. **Preferences mismatch:**
   ```
   [DEBUG] Top-up check - Preferences: {type: "random", ...}  ← Should be "fixed"!
   ```

3. **Top-up running for fixed time:**
   ```
   [DEBUG] Top-up check - Preferences: {type: "fixed", ...}
   [DEBUG] scheduleRandomNotifications() - START  ← Shouldn't happen!
   ```

## Log File Locations

### If Filesystem Available:
- **Continuous log**: `Documents/notification-debug.log` (appends)
- **Exported logs**: `Documents/notification-logs-YYYY-MM-DD-HH-MM-SS.txt`

### If Filesystem Not Available:
- Logs are in memory only
- Use "Export Logs" button to view in console
- Or capture via `adb logcat`

## Adding Filesystem Support (Optional)

If you want file logging to work, add to `package.json`:
```json
"@capacitor/filesystem": "^7.0.0"
```

Then:
```bash
npm install
npx cap sync
```

## Quick Test Checklist

- [ ] Notification text shows scheduled time
- [ ] Logs are being captured (check console or file)
- [ ] Can identify which notification is which from text
- [ ] Can export logs for analysis
- [ ] Logs show all key operations (scheduling, cancellation, preferences)

## Next Steps

1. Run the test scenarios from `NOTIFICATION_TEST_PLAN.md`
2. Check notification text to identify which notifications are appearing
3. Review logs to find the root cause
4. Share logs for analysis if needed

