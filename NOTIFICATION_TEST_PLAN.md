# Notification System Test Plan

## Purpose
This test plan is designed to identify the root cause of users receiving multiple notifications at unexpected times (e.g., 8:00am, 8:08am, 8:18am when set to 5pm fixed time).

## Test Environment Setup

### Prerequisites
- Device with app installed
- Console access (via Chrome DevTools, Android Studio, or Xcode)
- Ability to clear app data if needed
- Test user account (or ability to reset preferences)

### Logging
All test scenarios rely on console logs prefixed with `🔍 [DEBUG]`. These logs track:
- Function entry/exit points
- Preference values at key moments
- Notification IDs and schedules
- Cancellation verification
- State transitions

---

## Test Scenarios

### Test 1: Verify Old Random Notifications Not Cancelled

**Theory**: User previously had random notifications scheduled. When switching to fixed time, old random notifications weren't properly cancelled and remain in the system queue.

**Test Steps**:
1. **Setup**: 
   - Clear app data or use fresh install
   - Set notifications to **Random** mode (07:00 - 09:00)
   - Enable notifications
   - Save settings
   - Wait for notifications to be scheduled

2. **Verify Initial State**:
   - Check console logs for: `🔍 [DEBUG] Pending AFTER random scheduling`
   - Note all notification IDs and scheduled times
   - Expected: 3 random notifications + 1 warning notification

3. **Switch to Fixed Time**:
   - Change notification type to **Fixed** (17:00 / 5pm)
   - Save settings
   - **CRITICAL**: Watch console logs for:
     - `🔍 [DEBUG] Pending BEFORE cancel`
     - `🔍 [DEBUG] Pending AFTER cancel`
     - `🔍 [DEBUG] Cancellation verification`

4. **Verify Cancellation**:
   - Check if any notifications remain after cancellation
   - Look for log: `🔍 [DEBUG] ⚠️ WARNING: X notifications still pending after cancellation!`
   - Check final pending notifications: `🔍 [DEBUG] Pending AFTER scheduling`

5. **Wait and Observe**:
   - Wait until the scheduled times (8:00, 8:08, 8:18 if they exist)
   - Note if notifications fire at unexpected times

**Expected Results**:
- ✅ **PASS**: All old notifications cancelled, only fixed notification remains
- ❌ **FAIL**: Old random notifications still pending after cancellation
- 📝 **Document**: Notification IDs that weren't cancelled

**Key Logs to Check**:
```
🔍 [DEBUG] Pending BEFORE cancel: [array of notifications]
🔍 [DEBUG] Pending AFTER cancel: [should be empty or only new ones]
🔍 [DEBUG] Cancellation verification - Before: X After: Y
```

---

### Test 2: Verify Preferences Corruption/Type Mismatch

**Theory**: Stored preferences show `type: 'fixed'` in UI, but at scheduling time, system reads `type: 'random'` (corrupted or cached data).

**Test Steps**:
1. **Setup**:
   - Set notifications to **Fixed** time (17:00 / 5pm)
   - Enable notifications
   - Save settings

2. **Check Preferences at Multiple Points**:
   - **On App Startup**: Look for `🔍 [DEBUG] Top-up check - Preferences`
   - **On Settings Save**: Look for `🔍 [DEBUG] Preferences AFTER update`
   - **During Scheduling**: Look for `📋 User preferences:` in `scheduleDailyNotifications()`

3. **Compare Values**:
   - Note the `type` value at each point
   - Check if `type` is consistent: should always be `'fixed'`
   - Check if `randomStart`/`randomEnd` are present (they shouldn't matter for fixed)

4. **Force App Restart**:
   - Close app completely
   - Reopen app
   - Check console logs on startup
   - Verify preferences are read correctly

5. **Check Top-Up Logic**:
   - Look for log: `🔍 [DEBUG] Top-up check - EARLY RETURN`
   - Should see this for fixed time (top-up should NOT run for fixed)
   - If top-up runs for fixed time, that's the bug

**Expected Results**:
- ✅ **PASS**: `type` is consistently `'fixed'` at all points
- ❌ **FAIL**: `type` is `'random'` when it should be `'fixed'`
- 📝 **Document**: At which point the type changes

**Key Logs to Check**:
```
🔍 [DEBUG] Top-up check - Preferences: { type: 'fixed', ... }
📋 User preferences: { notificationTime: { type: 'fixed', ... } }
🔍 [DEBUG] Preferences AFTER update: { notificationTime: { type: 'fixed', ... } }
```

---

### Test 3: Verify Top-Up Logic Running for Fixed Time

**Theory**: Top-up logic (`checkAndTopUpNotificationsInternal()`) is incorrectly running for fixed time notifications, scheduling random notifications.

**Test Steps**:
1. **Setup**:
   - Set notifications to **Fixed** time (17:00 / 5pm)
   - Enable notifications
   - Save settings

2. **Monitor Top-Up Calls**:
   - Look for log: `🔍 [DEBUG] checkAndTopUpNotifications() called from App.tsx`
   - Look for log: `🔍 [DEBUG] initialize() calling checkAndTopUpNotificationsInternal()`
   - Both should call the internal function

3. **Check Early Return**:
   - For fixed time, should see: `🔍 [DEBUG] Top-up check - EARLY RETURN (not random or disabled)`
   - Should NOT see any random notification scheduling logs

4. **Verify No Random Scheduling**:
   - Should NOT see: `🔍 [DEBUG] Scheduling RANDOM time notifications`
   - Should NOT see: `🔍 [DEBUG] scheduleRandomNotifications() - START`

5. **Check Pending Notifications**:
   - After app startup, check: `🔍 [DEBUG] Pending notification details`
   - Should only see fixed time notification (ID: 1700 for 5pm)
   - Should NOT see random notification IDs (like 1800, 1808, 1818)

**Expected Results**:
- ✅ **PASS**: Top-up returns early, no random notifications scheduled
- ❌ **FAIL**: Top-up logic runs and schedules random notifications for fixed time
- 📝 **Document**: Which condition is failing

**Key Logs to Check**:
```
🔍 [DEBUG] Top-up check - Preferences: { type: 'fixed', ... }
🔍 [DEBUG] Top-up check - EARLY RETURN (not random or disabled)
```

---

### Test 4: Verify Double Initialization

**Theory**: Both `initialize()` and `App.tsx` call top-up logic, causing duplicate scheduling.

**Test Steps**:
1. **Setup**:
   - Clear app data
   - Set notifications to **Random** mode (07:00 - 09:00)
   - Enable notifications

2. **Monitor App Startup**:
   - Open app
   - Watch console logs for:
     - `🔍 [DEBUG] initialize() called - entry point`
     - `🔍 [DEBUG] initialize() calling checkAndTopUpNotificationsInternal()`
     - `🔍 [DEBUG] checkAndTopUpNotifications() called from App.tsx`
     - `🔍 [DEBUG] checkAndTopUpNotificationsInternal() - START` (should appear twice)

3. **Count Function Calls**:
   - Count how many times `checkAndTopUpNotificationsInternal()` is called
   - Should be called twice (once from initialize, once from App.tsx)

4. **Check for Duplicate Scheduling**:
   - Look for multiple `🔍 [DEBUG] scheduleRandomNotifications() - START` logs
   - Check if same notification IDs are scheduled multiple times
   - Look for: `🔍 [DEBUG] About to schedule X notifications with IDs: [array]`

5. **Verify Final State**:
   - Check final pending notifications
   - Count total notifications (should be 4: 3 random + 1 warning)
   - Check for duplicate IDs

**Expected Results**:
- ✅ **PASS**: Top-up called twice but no duplicates (cancellation works)
- ❌ **FAIL**: Duplicate notifications with same IDs scheduled
- 📝 **Document**: Number of times top-up is called and if duplicates occur

**Key Logs to Check**:
```
🔍 [DEBUG] initialize() calling checkAndTopUpNotificationsInternal()
🔍 [DEBUG] checkAndTopUpNotifications() called from App.tsx
🔍 [DEBUG] checkAndTopUpNotificationsInternal() - START
🔍 [DEBUG] About to schedule X notifications with IDs: [...]
```

---

### Test 5: Verify Settings Change Flow

**Theory**: When switching notification types, the update flow doesn't properly cancel old notifications before scheduling new ones.

**Test Steps**:
1. **Setup**:
   - Set notifications to **Random** mode (07:00 - 09:00)
   - Enable notifications
   - Save settings
   - Note the scheduled notification IDs

2. **Switch to Fixed**:
   - Change to **Fixed** time (17:00 / 5pm)
   - Save settings
   - Watch for: `🔍 [DEBUG] updateNotificationSettings() - START`

3. **Monitor Update Flow**:
   - Check: `🔍 [DEBUG] Current preferences BEFORE update`
   - Check: `🔍 [DEBUG] Preferences AFTER update`
   - Check: `🔍 [DEBUG] Pending BEFORE cancel`
   - Check: `🔍 [DEBUG] Pending AFTER cancel`

4. **Verify Timing**:
   - Ensure cancellation happens BEFORE new scheduling
   - Check that old notification IDs are gone
   - Verify new notification ID (1700 for 5pm) is present

5. **Test Reverse**:
   - Switch back to **Random** mode
   - Verify fixed notification is cancelled
   - Verify random notifications are scheduled

**Expected Results**:
- ✅ **PASS**: Old notifications cancelled before new ones scheduled
- ❌ **FAIL**: Old notifications remain alongside new ones
- 📝 **Document**: Order of operations and any timing issues

**Key Logs to Check**:
```
🔍 [DEBUG] updateNotificationSettings() - START
🔍 [DEBUG] Pending BEFORE cancel: [...]
🔍 [DEBUG] Pending AFTER cancel: [...]
🔍 [DEBUG] Scheduling FIXED time notification
🔍 [DEBUG] Pending AFTER scheduling: [...]
```

---

### Test 6: Verify Notification ID Collision

**Theory**: Notification IDs collide when scheduling, causing system to treat them as the same notification or fail to cancel properly.

**Test Steps**:
1. **Setup**:
   - Set to **Random** mode
   - Enable notifications
   - Save settings

2. **Check ID Generation**:
   - Look for: `🔍 [DEBUG] Random notification X/Y: ID=XXXX, Time=HH:MM`
   - Note all generated IDs
   - Check for duplicate IDs in the same batch

3. **Test Multiple Schedules**:
   - Save settings multiple times quickly
   - Check if same IDs are generated
   - Verify if system handles duplicate IDs correctly

4. **Check Fixed Time ID**:
   - Switch to **Fixed** (17:00)
   - Note the ID: should be `1700` (17:00 = 17*100 + 0)
   - Switch to **Fixed** (08:00)
   - Note the ID: should be `800` (08:00 = 8*100 + 0)
   - Check if these IDs could collide with random IDs

5. **Verify Cancellation by ID**:
   - Check cancellation logs: `🔍 [DEBUG] Successfully cancelled notification ID XXXX`
   - Verify all IDs are cancelled
   - Check for: `🔍 [DEBUG] Failed to cancel notification XXXX`

**Expected Results**:
- ✅ **PASS**: All IDs unique, cancellation works for all
- ❌ **FAIL**: Duplicate IDs or cancellation failures
- 📝 **Document**: Which IDs collide and when

**Key Logs to Check**:
```
🔍 [DEBUG] Random notification X/Y: ID=XXXX, Time=HH:MM
🔍 [DEBUG] About to schedule X notifications with IDs: [...]
🔍 [DEBUG] Successfully cancelled notification ID XXXX
```

---

### Test 7: Verify Race Condition in Concurrent Scheduling

**Theory**: Multiple scheduling operations happen concurrently, causing race conditions where notifications aren't properly cancelled before new ones are scheduled.

**Test Steps**:
1. **Setup**:
   - Set to **Fixed** time (17:00)
   - Enable notifications

2. **Trigger Multiple Operations**:
   - Rapidly open/close app multiple times
   - Or rapidly change settings and save
   - Watch for concurrent log entries

3. **Check for Overlapping Operations**:
   - Look for multiple `scheduleDailyNotifications()` calls
   - Check if cancellation and scheduling overlap
   - Look for: `🔍 [DEBUG] Pending AFTER cancel` appearing multiple times

4. **Verify Final State**:
   - After all operations complete, check final pending notifications
   - Should only have correct notifications (1 fixed or 3 random + warning)
   - Check for unexpected duplicates

**Expected Results**:
- ✅ **PASS**: Operations complete sequentially, no duplicates
- ❌ **FAIL**: Concurrent operations cause duplicates or missed cancellations
- 📝 **Document**: Timing of operations and any overlaps

**Key Logs to Check**:
```
🔍 [DEBUG] scheduleDailyNotifications() called
🔍 [DEBUG] Pending BEFORE cancel: [...]
🔍 [DEBUG] Pending AFTER cancel: [...]
🔍 [DEBUG] Pending AFTER scheduling: [...]
```

---

## Test Execution Checklist

### Before Each Test
- [ ] Clear console logs
- [ ] Note current notification settings
- [ ] Have console/device ready for log capture

### During Each Test
- [ ] Capture all `🔍 [DEBUG]` logs
- [ ] Note timestamps of key events
- [ ] Screenshot or copy notification IDs
- [ ] Document any errors or warnings

### After Each Test
- [ ] Review all captured logs
- [ ] Compare expected vs actual results
- [ ] Document findings in test results section
- [ ] Note any patterns or anomalies

---

## Test Results Template

For each test, document:

```
### Test X: [Test Name]
**Date**: YYYY-MM-DD
**Tester**: [Name]
**Device/Platform**: [Android/iOS/Web]
**App Version**: [Version]

**Setup**:
- [What was configured]

**Logs Captured**:
- [Key log excerpts]

**Findings**:
- [What was observed]

**Result**: ✅ PASS / ❌ FAIL / ⚠️ INCONCLUSIVE

**Notes**:
- [Additional observations]
- [Suspected root cause if identified]
```

---

## Analysis Guide

After running all tests, analyze:

1. **Pattern Recognition**:
   - Do unexpected notifications always have IDs matching random pattern?
   - Do they appear at times matching old random settings?
   - Is there a consistent trigger (app startup, settings change, etc.)?

2. **Root Cause Identification**:
   - Which test(s) failed?
   - What do the logs reveal?
   - Is there a single root cause or multiple issues?

3. **Reproducibility**:
   - Can the issue be consistently reproduced?
   - What are the exact steps?
   - Is it device/platform specific?

4. **Impact Assessment**:
   - How many users are affected?
   - What are the conditions that trigger it?
   - What's the severity?

---

## Next Steps After Testing

1. **If Root Cause Identified**:
   - Document the issue with evidence from logs
   - Create a fix plan
   - Test the fix with same test scenarios

2. **If Inconclusive**:
   - Add more targeted logging
   - Test with affected user's exact scenario
   - Consider adding user telemetry

3. **If Multiple Issues Found**:
   - Prioritize by severity and frequency
   - Address root causes first
   - Test fixes individually

---

## Notes

- All debug logs are prefixed with `🔍 [DEBUG]` for easy filtering
- Logs include timestamps (browser/device console)
- Notification IDs follow patterns:
  - Fixed: `HHMM` (e.g., 1700 for 5pm)
  - Random: `{day}{hours}{minutes}` (e.g., 1800 for day 1 at 8:00)
  - Warning: `999{HH}{MM}` (e.g., 99990 for 9:00 warning)
- Keep this document updated with findings


