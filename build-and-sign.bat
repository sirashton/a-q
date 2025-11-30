@echo off
REM A+Q App Build and Sign Script (Batch Version)
REM This script builds the web app, syncs with Android, and signs the AAB

echo 🚀 A+Q App Build and Sign Script
echo =================================

REM Set default values
set VERSION_CODE=21
set VERSION_NAME=0.0.3
set KEYSTORE_PATH=android\Android.Keystore
set KEY_ALIAS=key0
set KEYSTORE_PASSWORD=signThisApp!
set KEY_PASSWORD=signThisApp0!

REM Allow override via command line arguments
if not "%1"=="" set VERSION_CODE=%1
if not "%2"=="" set VERSION_NAME=%2

echo 📝 Building version %VERSION_CODE% (%VERSION_NAME%)...

REM Step 1: Build web app
echo 🌐 Building web application...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ❌ Web build failed
    exit /b 1
)
echo ✅ Web build completed

REM Step 2: Sync with Capacitor
echo 📱 Syncing with Capacitor...
call npx cap sync android
if %ERRORLEVEL% neq 0 (
    echo ❌ Capacitor sync failed
    exit /b 1
)
echo ✅ Capacitor sync completed

REM Step 3: Build Android App Bundle (AAB)
echo 🔨 Building Android App Bundle (AAB)...
cd android
call gradlew clean
if %ERRORLEVEL% neq 0 (
    echo ❌ Gradle clean failed
    exit /b 1
)

call gradlew bundleRelease
if %ERRORLEVEL% neq 0 (
    echo ❌ Gradle build failed
    exit /b 1
)
echo ✅ Android App Bundle built successfully

REM Step 4: Sign the AAB
echo 🔐 Signing AAB...
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore ..\%KEYSTORE_PATH% -storepass %KEYSTORE_PASSWORD% -keypass %KEY_PASSWORD% app\build\outputs\bundle\release\app-release.aab %KEY_ALIAS%
if %ERRORLEVEL% neq 0 (
    echo ❌ AAB signing failed
    exit /b 1
)
echo ✅ AAB signed successfully

REM Step 5: Display results
echo.
echo 📋 Build Summary
echo ===============
echo Version Code: %VERSION_CODE%
echo Version Name: %VERSION_NAME%
echo Signed AAB: app\build\outputs\bundle\release\app-release.aab
echo.
echo 🎉 Build and Sign Complete!
echo Your signed AAB is ready for Play Store upload!
echo.
echo Next steps:
echo 1. Go to Google Play Console
echo 2. Upload the signed AAB (app-release.aab)
echo 3. Add release notes for version %VERSION_NAME%
echo 4. Submit for review

cd ..
echo.
echo Script completed at %DATE% %TIME%
pause


