#!/usr/bin/env node

/**
 * Install and launch the app on connected Android device/emulator
 * Usage: node scripts/run-android-app.cjs
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const appId = 'app.a_q';
const apkPath = path.join(__dirname, '..', 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');

function findAdb() {
  // Try direct adb command first (if in PATH)
  try {
    execSync('adb version', { stdio: 'ignore' });
    return 'adb';
  } catch (e) {
    // Not in PATH, try to find it
  }
  
  // Common Windows locations
  const possiblePaths = [
    path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk', 'platform-tools', 'adb.exe'),
    path.join(process.env.ANDROID_HOME || '', 'platform-tools', 'adb.exe'),
    path.join(process.env.ANDROID_SDK_ROOT || '', 'platform-tools', 'adb.exe'),
    path.join(process.env.USERPROFILE || '', 'AppData', 'Local', 'Android', 'Sdk', 'platform-tools', 'adb.exe'),
  ];
  
  for (const adbPath of possiblePaths) {
    if (adbPath && fs.existsSync(adbPath)) {
      return adbPath;
    }
  }
  
  return null;
}

function runApp() {
  try {
    // Find adb
    const adb = findAdb();
    if (!adb) {
      console.error('❌ Could not find adb (Android Debug Bridge).');
      console.error('💡 Falling back to: npx cap run android');
      console.log('\n🚀 Launching app via Capacitor...');
      try {
        // Use cap run android as fallback
        execSync('npx cap run android', { stdio: 'inherit' });
      } catch (error) {
        console.error('❌ Failed to launch app. Please run it manually from Android Studio.');
      }
      return;
    }
    
    // Check if APK exists
    if (!fs.existsSync(apkPath)) {
      console.error(`❌ APK not found at: ${apkPath}`);
      console.error('💡 Make sure you ran: npm run dev:android (or build the APK first)');
      return;
    }
    
    // Check for connected devices
    console.log('🔍 Checking for connected devices...');
    const devices = execSync(`"${adb}" devices`, { encoding: 'utf8' });
    const deviceLines = devices.split('\n').filter(line => line.trim() && !line.includes('List of devices'));
    
    if (deviceLines.length === 0) {
      console.error('⚠️  No Android devices/emulators connected.');
      console.error('💡 Make sure an emulator is running or a device is connected via USB.');
      return;
    }
    
    console.log(`✅ Found ${deviceLines.length} device(s)`);
    
    // Install APK
    console.log('📦 Installing APK...');
    try {
      execSync(`"${adb}" install -r "${apkPath}"`, { stdio: 'inherit' });
      console.log('✅ APK installed successfully!');
    } catch (error) {
      console.error('❌ Failed to install APK:', error.message);
      return;
    }
    
    // Launch app
    console.log('🚀 Launching app...');
    try {
      execSync(`"${adb}" shell am start -n ${appId}/.MainActivity`, { stdio: 'inherit' });
      console.log('✅ App launched successfully!');
    } catch (error) {
      console.error('❌ Failed to launch app:', error.message);
      console.log('💡 You can launch it manually from the emulator.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

runApp();

