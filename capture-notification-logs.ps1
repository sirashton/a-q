# capture-notification-logs.ps1
# Captures Android logs filtered for notification debugging
# Usage: .\capture-notification-logs.ps1 [test-name]

param(
    [string]$TestName = "test"
)

# Function to get test instructions
function Get-TestInstructions {
    param([string]$testName)
    
    $instructions = @{
        "test1_old_notifications" = @"
═══════════════════════════════════════════════════════════════
TEST 1: Verify Old Random Notifications Not Cancelled
═══════════════════════════════════════════════════════════════

INSTRUCTIONS FOR EMULATOR:
───────────────────────────────────────────────────────────────
1. Open the app on the emulator

2. Go to Settings (bottom navigation)

3. Set notifications to RANDOM mode:
   - Enable notifications (toggle ON)
   - Select "Random time within range"
   - Set Start time: 07:00
   - Set End time: 09:00
   - Click "Save Notification Settings"

4. Wait 2-3 seconds for notifications to schedule

5. Now switch to FIXED time:
   - Select "Fixed time"
   - Set time to: 17:00 (5pm)
   - Click "Save Notification Settings"

6. Wait 2-3 seconds

7. Close the app completely (swipe away from recent apps)

8. Reopen the app

9. Wait 5 seconds

WHEN TO STOP CAPTURING:
───────────────────────────────────────────────────────────────
After step 9, wait 5 seconds, then press Ctrl+C in this terminal
to stop capturing logs.

═══════════════════════════════════════════════════════════════
"@
        
        "test2_preferences_corruption" = @"
═══════════════════════════════════════════════════════════════
TEST 2: Verify Preferences Corruption/Type Mismatch
═══════════════════════════════════════════════════════════════

INSTRUCTIONS FOR EMULATOR:
───────────────────────────────────────────────────────────────
1. Open the app on the emulator

2. Go to Settings

3. Set notifications to FIXED time:
   - Enable notifications (toggle ON)
   - Select "Fixed time"
   - Set time to: 17:00 (5pm)
   - Click "Save Notification Settings"

4. Wait 2-3 seconds

5. Close the app completely

6. Reopen the app

7. Wait 3 seconds

8. Go to Settings again

9. Verify the settings show "Fixed time" and "17:00"

10. Don't change anything, just verify

WHEN TO STOP CAPTURING:
───────────────────────────────────────────────────────────────
After step 10, wait 3 seconds, then press Ctrl+C in this terminal
to stop capturing logs.

═══════════════════════════════════════════════════════════════
"@
        
        "test3_topup_fixed_time" = @"
═══════════════════════════════════════════════════════════════
TEST 3: Verify Top-Up Logic Running for Fixed Time
═══════════════════════════════════════════════════════════════

INSTRUCTIONS FOR EMULATOR:
───────────────────────────────────────────────────────────────
1. Open the app on the emulator

2. Go to Settings

3. Set notifications to FIXED time:
   - Enable notifications (toggle ON)
   - Select "Fixed time"
   - Set time to: 17:00 (5pm)
   - Click "Save Notification Settings"

4. Wait 2-3 seconds

5. Close the app completely

6. Reopen the app

7. Wait 3 seconds

8. Close and reopen the app again (2 more times)

9. Wait 3 seconds after final open

WHEN TO STOP CAPTURING:
───────────────────────────────────────────────────────────────
After step 9, wait 3 seconds, then press Ctrl+C in this terminal
to stop capturing logs.

═══════════════════════════════════════════════════════════════
"@
        
        "test4_double_initialization" = @"
═══════════════════════════════════════════════════════════════
TEST 4: Verify Double Initialization
═══════════════════════════════════════════════════════════════

INSTRUCTIONS FOR EMULATOR:
───────────────────────────────────────────────────────────────
1. Make sure the app is completely closed

2. Open the app on the emulator

3. Go to Settings

4. Set notifications to RANDOM mode:
   - Enable notifications (toggle ON)
   - Select "Random time within range"
   - Set Start time: 07:00
   - Set End time: 09:00
   - Click "Save Notification Settings"

5. Wait 5 seconds

6. Don't do anything else - just wait

WHEN TO STOP CAPTURING:
───────────────────────────────────────────────────────────────
After step 5, wait 5 seconds, then press Ctrl+C in this terminal
to stop capturing logs.

═══════════════════════════════════════════════════════════════
"@
        
        "test5_settings_change_flow" = @"
═══════════════════════════════════════════════════════════════
TEST 5: Verify Settings Change Flow
═══════════════════════════════════════════════════════════════

INSTRUCTIONS FOR EMULATOR:
───────────────────────────────────────────────────────────────
1. Open the app on the emulator

2. Go to Settings

3. Set notifications to RANDOM mode:
   - Enable notifications (toggle ON)
   - Select "Random time within range"
   - Set Start time: 07:00
   - Set End time: 09:00
   - Click "Save Notification Settings"

4. Wait 2-3 seconds

5. Switch to FIXED time:
   - Select "Fixed time"
   - Set time to: 17:00 (5pm)
   - Click "Save Notification Settings"

6. Wait 2-3 seconds

7. Switch back to RANDOM:
   - Select "Random time within range"
   - Click "Save Notification Settings"

8. Wait 2-3 seconds

WHEN TO STOP CAPTURING:
───────────────────────────────────────────────────────────────
After step 8, wait 3 seconds, then press Ctrl+C in this terminal
to stop capturing logs.

═══════════════════════════════════════════════════════════════
"@
        
        "test6_notification_id_collision" = @"
═══════════════════════════════════════════════════════════════
TEST 6: Verify Notification ID Collision
═══════════════════════════════════════════════════════════════

INSTRUCTIONS FOR EMULATOR:
───────────────────────────────────────────────────────────────
1. Open the app on the emulator

2. Go to Settings

3. Set notifications to RANDOM mode:
   - Enable notifications (toggle ON)
   - Select "Random time within range"
   - Set Start time: 07:00
   - Set End time: 09:00
   - Click "Save Notification Settings"

4. Wait 1 second

5. Click "Save Notification Settings" again (without changing anything)

6. Wait 1 second

7. Click "Save Notification Settings" one more time

8. Wait 2-3 seconds

WHEN TO STOP CAPTURING:
───────────────────────────────────────────────────────────────
After step 8, wait 3 seconds, then press Ctrl+C in this terminal
to stop capturing logs.

═══════════════════════════════════════════════════════════════
"@
        
        "test7_race_condition" = @"
═══════════════════════════════════════════════════════════════
TEST 7: Verify Race Condition in Concurrent Scheduling
═══════════════════════════════════════════════════════════════

INSTRUCTIONS FOR EMULATOR:
───────────────────────────────────────────────────────────────
1. Open the app on the emulator

2. Go to Settings

3. Set notifications to FIXED time:
   - Enable notifications (toggle ON)
   - Select "Fixed time"
   - Set time to: 17:00 (5pm)
   - Click "Save Notification Settings"

4. Wait 1 second

5. Rapidly close and reopen the app (do this 5 times quickly)

6. After the 5th reopen, wait 5 seconds

WHEN TO STOP CAPTURING:
───────────────────────────────────────────────────────────────
After step 6, wait 5 seconds, then press Ctrl+C in this terminal
to stop capturing logs.

═══════════════════════════════════════════════════════════════
"@
    }
    
    if ($instructions.ContainsKey($testName)) {
        return $instructions[$testName]
    } else {
        return @"
═══════════════════════════════════════════════════════════════
GENERIC TEST INSTRUCTIONS
═══════════════════════════════════════════════════════════════

INSTRUCTIONS FOR EMULATOR:
───────────────────────────────────────────────────────────────
1. Open the app on the emulator

2. Perform your test actions (change settings, restart app, etc.)

3. Wait a few seconds after completing actions

WHEN TO STOP CAPTURING:
───────────────────────────────────────────────────────────────
After completing your test actions, wait 3-5 seconds, then press
Ctrl+C in this terminal to stop capturing logs.

═══════════════════════════════════════════════════════════════
"@
    }
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile = "logs_${TestName}_${timestamp}.txt"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Android Log Capture for Notification Testing" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test Name: $TestName" -ForegroundColor Yellow
Write-Host "Log File: $logFile" -ForegroundColor Yellow
Write-Host ""

# Display test-specific instructions
$instructions = Get-TestInstructions -testName $TestName
Write-Host $instructions -ForegroundColor White

Write-Host ""
Write-Host "Filtering for:" -ForegroundColor Green
Write-Host "  - [DEBUG] logs" -ForegroundColor Green
Write-Host "  - notification/Notification keywords" -ForegroundColor Green
Write-Host "  - ERROR and WARN messages" -ForegroundColor Green
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "READY TO START - Logs will begin capturing in 5 seconds..." -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Start-Sleep -Seconds 5

# Check if adb is available and find it if not in PATH
$adbPath = $null

# First, try to find adb in common locations
$commonPaths = @(
    "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe",
    "$env:USERPROFILE\AppData\Local\Android\Sdk\platform-tools\adb.exe",
    "$env:ANDROID_HOME\platform-tools\adb.exe",
    "$env:ANDROID_SDK_ROOT\platform-tools\adb.exe"
)

# Check if adb is in PATH
try {
    $null = adb version 2>&1
    $adbPath = "adb"
    Write-Host "Found adb in PATH" -ForegroundColor Green
} catch {
    # Try to find adb in common locations
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            $adbPath = $path
            Write-Host "Found adb at: $path" -ForegroundColor Green
            break
        }
    }
    
    if (-not $adbPath) {
        Write-Host "ERROR: adb command not found!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please either:" -ForegroundColor Yellow
        Write-Host "  1. Add Android SDK platform-tools to your PATH" -ForegroundColor Yellow
        Write-Host "  2. Set ANDROID_HOME environment variable" -ForegroundColor Yellow
        Write-Host "  3. Or provide the full path to adb.exe" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Common locations:" -ForegroundColor Yellow
        foreach ($path in $commonPaths) {
            Write-Host "  - $path" -ForegroundColor Gray
        }
        Write-Host ""
        $customPath = Read-Host "Enter full path to adb.exe (or press Enter to exit)"
        if ($customPath -and (Test-Path $customPath)) {
            $adbPath = $customPath
        } else {
            exit 1
        }
    }
}

# Check if device is connected
Write-Host "Checking for connected devices..." -ForegroundColor Cyan
$devicesOutput = & $adbPath devices
$devicesList = & $adbPath devices | Select-String -Pattern "device$|emulator-\d+"

if ($devicesList) {
    Write-Host "Found device(s):" -ForegroundColor Green
    $devicesList | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
} else {
    Write-Host "WARNING: No Android device/emulator detected!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Current adb devices output:" -ForegroundColor Yellow
    Write-Host $devicesOutput -ForegroundColor Gray
    Write-Host ""
    Write-Host "Make sure your emulator is running and fully booted" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Continue anyway? (y/n): " -NoNewline -ForegroundColor Yellow
    $response = Read-Host
    if ($response -ne "y") {
        exit 1
    }
}

# Clear log buffer
Write-Host "Clearing log buffer..." -ForegroundColor Cyan
& $adbPath logcat -c

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "🔴 NOW CAPTURING LOGS - Follow the instructions above" -ForegroundColor Green
Write-Host "   Press Ctrl+C when you have completed the test steps" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# Capture logs with filtering
try {
    # Use double quotes and escape properly for PowerShell regex
    $pattern = "\[DEBUG\]|notification|Notification|ERROR|WARN"
    & $adbPath logcat -v time | Select-String -Pattern $pattern | Tee-Object -FilePath $logFile
} catch {
    Write-Host ""
    Write-Host "Capture stopped." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Log capture completed!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Logs saved to: $logFile" -ForegroundColor Green

# Show file size
if (Test-Path $logFile) {
    $fileSize = (Get-Item $logFile).Length
    $fileSizeKB = [math]::Round($fileSize / 1KB, 2)
    Write-Host "File size: $fileSizeKB KB" -ForegroundColor Green
    
    # Show line count
    $lineCount = (Get-Content $logFile | Measure-Object -Line).Lines
    Write-Host "Lines captured: $lineCount" -ForegroundColor Green
}

Write-Host ""
Write-Host "To view the logs, run:" -ForegroundColor Yellow
$viewCmd = "  Get-Content $logFile"
Write-Host $viewCmd -ForegroundColor White
Write-Host ""
Write-Host "Or open in your editor:" -ForegroundColor Yellow
$codeCmd = "  code $logFile"
Write-Host $codeCmd -ForegroundColor White
Write-Host ""

