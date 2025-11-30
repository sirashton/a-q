# A+Q App Build and Sign Script
# This script builds the web app, syncs with Android, and signs the APK

param(
    [string]$VersionCode = "21",
    [string]$VersionName = "0.0.3",
    [string]$KeystorePath = "android\Android.Keystore",
    [string]$KeyAlias = "key0",
    [string]$KeystorePassword = "signThisApp!",
    [string]$KeyPassword = "signThisApp0!"
)

Write-Host "🚀 A+Q App Build and Sign Script" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Set error handling
$ErrorActionPreference = "Stop"

try {
    # Step 1: Update version in build.gradle
    Write-Host "📝 Updating version information..." -ForegroundColor Yellow
    $buildGradlePath = "android\app\build.gradle"
    $buildGradleContent = Get-Content $buildGradlePath -Raw
    
    # Update version code and name
    $buildGradleContent = $buildGradleContent -replace 'versionCode \d+', "versionCode $VersionCode"
    $buildGradleContent = $buildGradleContent -replace 'versionName "[^"]*"', "versionName `"$VersionName`""
    
    Set-Content $buildGradlePath $buildGradleContent -NoNewline
    Write-Host "✅ Updated version to $VersionCode ($VersionName)" -ForegroundColor Green

    # Step 2: Build web app
    Write-Host "🌐 Building web application..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Web build failed"
    }
    Write-Host "✅ Web build completed" -ForegroundColor Green

    # Step 3: Sync with Capacitor
    Write-Host "📱 Syncing with Capacitor..." -ForegroundColor Yellow
    npx cap sync android
    if ($LASTEXITCODE -ne 0) {
        throw "Capacitor sync failed"
    }
    Write-Host "✅ Capacitor sync completed" -ForegroundColor Green

    # Step 4: Clean and build Android APK
    Write-Host "🔨 Building Android APK..." -ForegroundColor Yellow
    Set-Location android
    ./gradlew clean
    if ($LASTEXITCODE -ne 0) {
        throw "Gradle clean failed"
    }
    
    ./gradlew assembleRelease
    if ($LASTEXITCODE -ne 0) {
        throw "Gradle build failed"
    }
    Write-Host "✅ Android APK built successfully" -ForegroundColor Green

    # Step 5: Sign the APK
    Write-Host "🔐 Signing APK..." -ForegroundColor Yellow
    $unsignedApk = "app\build\outputs\apk\release\app-release-unsigned.apk"
    $signedApk = "app\build\outputs\apk\release\app-release-signed.apk"
    
    # Sign with jarsigner
    jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore $KeystorePath -storepass $KeystorePassword -keypass $KeyPassword $unsignedApk $KeyAlias
    if ($LASTEXITCODE -ne 0) {
        throw "APK signing failed"
    }
    Write-Host "✅ APK signed successfully" -ForegroundColor Green

    # Step 6: Align the APK
    Write-Host "⚡ Aligning APK for optimal performance..." -ForegroundColor Yellow
    $zipalignPath = "$env:ANDROID_HOME\build-tools\35.0.0\zipalign.exe"
    & $zipalignPath -v 4 $unsignedApk $signedApk
    if ($LASTEXITCODE -ne 0) {
        throw "APK alignment failed"
    }
    Write-Host "✅ APK aligned successfully" -ForegroundColor Green

    # Step 7: Verify and display results
    Write-Host "📋 Build Summary" -ForegroundColor Cyan
    Write-Host "===============" -ForegroundColor Cyan
    Write-Host "Version Code: $VersionCode" -ForegroundColor White
    Write-Host "Version Name: $VersionName" -ForegroundColor White
    
    $signedApkInfo = Get-ChildItem $signedApk
    Write-Host "Signed APK: $($signedApkInfo.FullName)" -ForegroundColor White
    Write-Host "File Size: $([math]::Round($signedApkInfo.Length / 1MB, 2)) MB" -ForegroundColor White
    Write-Host "Created: $($signedApkInfo.LastWriteTime)" -ForegroundColor White
    
    Write-Host ""
    Write-Host "🎉 Build and Sign Complete!" -ForegroundColor Green
    Write-Host "Your signed APK is ready for Play Store upload!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Go to Google Play Console" -ForegroundColor White
    Write-Host "2. Upload: $($signedApkInfo.FullName)" -ForegroundColor White
    Write-Host "3. Add release notes for version $VersionName" -ForegroundColor White
    Write-Host "4. Submit for review" -ForegroundColor White

} catch {
    Write-Host ""
    Write-Host "❌ Build failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please check the error above and try again." -ForegroundColor Red
    exit 1
} finally {
    # Return to project root
    Set-Location ..
}

Write-Host ""
Write-Host "Script completed at $(Get-Date)" -ForegroundColor Gray
