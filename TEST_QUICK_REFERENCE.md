# Notification Test Quick Reference

## All Test Commands

Run these commands in PowerShell from your project directory. Each test will display specific instructions for what to do in the emulator.

### Test 1: Old Random Notifications Not Cancelled
**Theory**: Old random notifications weren't properly cancelled when switching to fixed time.

```powershell
.\capture-notification-logs.ps1 test1_old_notifications
```

**What it tests**: Switching from random to fixed time - verifies old notifications are cancelled.

---

### Test 2: Preferences Corruption/Type Mismatch
**Theory**: Stored preferences show fixed time, but system reads random type.

```powershell
.\capture-notification-logs.ps1 test2_preferences_corruption
```

**What it tests**: Verifies preferences are read correctly at all points (startup, settings save, scheduling).

---

### Test 3: Top-Up Logic Running for Fixed Time
**Theory**: Top-up logic incorrectly runs for fixed time notifications, scheduling random ones.

```powershell
.\capture-notification-logs.ps1 test3_topup_fixed_time
```

**What it tests**: Ensures top-up logic only runs for random mode, not fixed mode.

---

### Test 4: Double Initialization
**Theory**: Both `initialize()` and `App.tsx` call top-up logic, causing duplicate scheduling.

```powershell
.\capture-notification-logs.ps1 test4_double_initialization
```

**What it tests**: Checks if double calls on app startup cause duplicate notifications.

---

### Test 5: Settings Change Flow
**Theory**: When switching notification types, old notifications aren't cancelled before new ones are scheduled.

```powershell
.\capture-notification-logs.ps1 test5_settings_change_flow
```

**What it tests**: Verifies proper order of operations when changing settings (cancel → schedule).

---

### Test 6: Notification ID Collision
**Theory**: Notification IDs collide when scheduling, causing system issues.

```powershell
.\capture-notification-logs.ps1 test6_notification_id_collision
```

**What it tests**: Checks for duplicate IDs when saving settings multiple times.

---

### Test 7: Race Condition in Concurrent Scheduling
**Theory**: Multiple scheduling operations happen concurrently, causing race conditions.

```powershell
.\capture-notification-logs.ps1 test7_race_condition
```

**What it tests**: Tests rapid app open/close cycles to check for concurrent operation issues.

---

## Quick Test Workflow

1. **Start the test**:
   ```powershell
   .\capture-notification-logs.ps1 test1_old_notifications
   ```

2. **Follow the on-screen instructions** in the emulator

3. **When done**, press `Ctrl+C` in the terminal

4. **Review the log file**:
   ```powershell
   Get-Content logs_test1_old_notifications_*.txt
   ```

5. **Move to next test** and repeat

---

## Test Execution Order (Recommended)

Run tests in this order for best results:

1. `test4_double_initialization` - Quick, checks basic startup
2. `test2_preferences_corruption` - Verifies preferences are correct
3. `test3_topup_fixed_time` - Checks top-up logic
4. `test1_old_notifications` - Most likely culprit for the user's issue
5. `test5_settings_change_flow` - Verifies settings changes work
6. `test6_notification_id_collision` - Checks ID generation
7. `test7_race_condition` - Tests edge cases

---

## Viewing Logs

After each test, view the captured logs:

```powershell
# View entire log file
Get-Content logs_test1_old_notifications_*.txt

# View last 50 lines
Get-Content logs_test1_old_notifications_*.txt -Tail 50

# Search for specific patterns
Select-String -Path logs_test1_old_notifications_*.txt -Pattern "\[DEBUG\]"

# Open in VS Code
code logs_test1_old_notifications_*.txt
```

---

## Notes

- Each test creates a timestamped log file
- Log files are saved in the project root directory
- The script shows instructions for each test automatically
- Press `Ctrl+C` to stop capturing after completing test steps
- Wait 3-5 seconds after final step before stopping capture


