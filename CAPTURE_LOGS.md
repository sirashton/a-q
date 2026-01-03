# Capturing Android Emulator Logs

This guide explains how to capture console logs from the Android Studio emulator, specifically filtering for our `🔍 [DEBUG]` notification logs.

## Method 1: Using ADB Logcat (Recommended)

This method uses the command line and is best for filtering and saving logs.

### Prerequisites
- Android SDK platform-tools in your PATH
- Emulator running
- App installed on emulator

### Basic Command

```powershell
# Capture all logs to file
adb logcat > notification_logs.txt
```

### Filtered Commands (Recommended)

#### Filter by our DEBUG tag:
```powershell
# Capture only logs containing our DEBUG prefix
adb logcat | Select-String "DEBUG" > notification_logs.txt
```

#### Filter by app package (more precise):
```powershell
# First, find your app's package name (usually in capacitor.config.ts or AndroidManifest.xml)
# Then filter by package:
adb logcat | Select-String "com\.yourcompany\.appname" > notification_logs.txt
```

#### Filter by multiple criteria:
```powershell
# Capture logs with DEBUG, notification-related, or error messages
adb logcat | Select-String "DEBUG|notification|Notification|ERROR" > notification_logs.txt
```

### Advanced Filtering

#### Filter by log level and tag:
```powershell
# Capture only Debug and Info level logs from your app
adb logcat -s "ReactNativeJS:*" "Capacitor:*" "*:D" "*:I" > notification_logs.txt
```

#### Clear log buffer before capturing:
```powershell
# Clear old logs, then capture fresh ones
adb logcat -c
adb logcat > notification_logs.txt
```

#### Capture with timestamps:
```powershell
# Include timestamps in logs
adb logcat -v time > notification_logs.txt
```

#### Capture with process IDs and timestamps:
```powershell
# Most detailed format
adb logcat -v long > notification_logs.txt
```

### Stop Capturing
Press `Ctrl+C` in the terminal to stop capturing.

---

## Method 2: Using Android Studio Logcat

### Steps:
1. Open Android Studio
2. Run your app on the emulator
3. Open the **Logcat** window (View → Tool Windows → Logcat, or bottom panel)
4. In Logcat:
   - Use the search box to filter: `DEBUG` or `notification`
   - Right-click in the log area
   - Select **Export to File...**
   - Choose location and filename
   - Click **OK**

### Filtering in Logcat:
- **Package Name**: Enter your app's package name
- **Log Level**: Select "Debug" or "Info"
- **Search**: Type `DEBUG` or `notification` in search box
- **Regex**: Enable regex for more complex filters

---

## Method 3: PowerShell Script (Automated)

Create a script to capture logs with automatic filtering:

### Create `capture-notification-logs.ps1`:

```powershell
# capture-notification-logs.ps1
# Captures Android logs filtered for notification debugging

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile = "notification_logs_$timestamp.txt"

Write-Host "Starting log capture..."
Write-Host "Logs will be saved to: $logFile"
Write-Host "Press Ctrl+C to stop capturing"
Write-Host ""

# Clear log buffer
adb logcat -c

# Capture logs with filtering
adb logcat -v time | Select-String "DEBUG|notification|Notification|ERROR|WARN" | Tee-Object -FilePath $logFile

Write-Host ""
Write-Host "Log capture stopped. Logs saved to: $logFile"
```

### Usage:
```powershell
.\capture-notification-logs.ps1
```

---

## Method 4: Real-time Monitoring + File Capture

Monitor logs in real-time while also saving to file:

```powershell
# This will show logs in terminal AND save to file
adb logcat -v time | Tee-Object -FilePath "notification_logs.txt" | Select-String "DEBUG"
```

---

## Best Practice: Test-Specific Log Capture

### For Each Test Scenario:

1. **Clear logs before test**:
   ```powershell
   adb logcat -c
   ```

2. **Start capturing**:
   ```powershell
   $testName = "test1_old_notifications"
   $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
   adb logcat -v time | Select-String "DEBUG" | Tee-Object -FilePath "logs_${testName}_${timestamp}.txt"
   ```

3. **Perform test actions** (change settings, restart app, etc.)

4. **Stop capturing** (Ctrl+C)

5. **Review the log file**

---

## Filtering for Our Specific Logs

Our debug logs use the prefix `🔍 [DEBUG]`. To capture only these:

```powershell
# Filter for our specific debug prefix
adb logcat -v time | Select-String "\[DEBUG\]" > notification_debug_logs.txt
```

Or include context (a few lines before/after):

```powershell
# Capture DEBUG logs with 2 lines of context
adb logcat -v time | Select-String -Pattern "\[DEBUG\]" -Context 0,2 > notification_debug_logs.txt
```

---

## Finding Your App's Package Name

To filter by your specific app:

1. **Check `capacitor.config.ts`**:
   ```typescript
   appId: 'com.yourcompany.appname'
   ```

2. **Or check AndroidManifest.xml**:
   ```xml
   <manifest package="com.yourcompany.appname">
   ```

3. **Or list running apps**:
   ```powershell
   adb shell pm list packages | Select-String "yourcompany"
   ```

---

## Complete Test Workflow Example

```powershell
# 1. Clear old logs
adb logcat -c

# 2. Start capturing (in separate terminal or background)
$testNum = "test1"
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "adb logcat -v time | Select-String '\[DEBUG\]|notification|Notification' | Tee-Object -FilePath 'logs_${testNum}_${timestamp}.txt'"

# 3. Perform your test actions in the app

# 4. Stop the log capture (close the terminal or Ctrl+C)

# 5. Review the log file
Get-Content "logs_${testNum}_${timestamp}.txt"
```

---

## Troubleshooting

### "adb: command not found"
- Add Android SDK platform-tools to your PATH
- Or use full path: `C:\Users\YourName\AppData\Local\Android\Sdk\platform-tools\adb.exe`

### No logs appearing
- Make sure emulator is running
- Check device connection: `adb devices`
- Verify app is installed: `adb shell pm list packages`

### Logs are too verbose
- Use more specific filters
- Filter by log level: `adb logcat *:E *:W` (errors and warnings only)
- Filter by tag: `adb logcat -s ReactNativeJS:* Capacitor:*`

### Need to capture from specific app only
```powershell
# Get your app's PID
$pid = adb shell pidof -s com.yourcompany.appname

# Filter by PID
adb logcat --pid=$pid > notification_logs.txt
```

---

## Recommended Setup for Testing

1. **Open two terminal windows**:
   - Terminal 1: Run log capture command
   - Terminal 2: Run app commands or keep for reference

2. **Use this command in Terminal 1**:
   ```powershell
   adb logcat -c; adb logcat -v time | Select-String "\[DEBUG\]|notification|Notification|ERROR|WARN" | Tee-Object -FilePath "notification_test_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').txt"
   ```

3. **Perform test actions** in the app

4. **Stop capture** with Ctrl+C when test is complete

5. **Review the generated log file**

---

## Quick Reference Commands

```powershell
# Clear logs
adb logcat -c

# Capture all logs
adb logcat > all_logs.txt

# Capture with timestamps
adb logcat -v time > logs.txt

# Capture filtered (our DEBUG logs)
adb logcat -v time | Select-String "\[DEBUG\]" > debug_logs.txt

# Capture with app filter
adb logcat -v time | Select-String "com\.yourcompany\.appname|\[DEBUG\]" > app_logs.txt

# Real-time view + file
adb logcat -v time | Tee-Object -FilePath "logs.txt" | Select-String "DEBUG"
```

---

## Notes

- Log files can get large quickly - use filters to reduce size
- Timestamps are helpful for correlating with test actions
- Keep separate log files for each test scenario
- Review logs immediately after each test while context is fresh
- The `Tee-Object` cmdlet shows logs in terminal AND saves to file (useful for monitoring)


