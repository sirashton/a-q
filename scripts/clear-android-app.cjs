#!/usr/bin/env node

/**
 * Clear app data and optionally uninstall from connected Android device/emulator
 * Usage: node scripts/clear-android-app.cjs [uninstall]
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const appId = 'app.a_q';
const shouldUninstall = process.argv[2] === 'uninstall' || process.argv[2] === '--uninstall';

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

function clearAppData() {
  try {
    console.log('🔍 Checking for connected Android devices...');
    
    // Find adb
    const adb = findAdb();
    if (!adb) {
      console.error('❌ Could not find adb (Android Debug Bridge).');
      console.error('\n💡 Please do one of the following:');
      console.error('   1. Add Android SDK platform-tools to your PATH:');
      console.error('      Usually: %LOCALAPPDATA%\\Android\\Sdk\\platform-tools');
      console.error('   2. Set ANDROID_HOME environment variable:');
      console.error('      ANDROID_HOME=%LOCALAPPDATA%\\Android\\Sdk');
      console.error('   3. Or manually uninstall the app from the emulator:');
      console.error('      Settings → Apps → Advices and Queries → Uninstall');
      return;
    }
    
    // Check if adb is available and device is connected
    try {
      const devices = execSync(`"${adb}" devices`, { encoding: 'utf8' });
      const deviceLines = devices.split('\n').filter(line => line.trim() && !line.includes('List of devices'));
      
      if (deviceLines.length === 0) {
        console.log('⚠️  No Android devices/emulators connected.');
        console.log('💡 Make sure an emulator is running or a device is connected via USB.');
        return;
      }
      
      console.log(`✅ Found ${deviceLines.length} device(s)`);
    } catch (error) {
      console.error('❌ Error checking devices:', error.message);
      return;
    }
    
    if (shouldUninstall) {
      console.log(`🗑️  Uninstalling app ${appId}...`);
      try {
        execSync(`"${adb}" shell pm uninstall ${appId}`, { stdio: 'inherit' });
        console.log('✅ App uninstalled successfully!');
      } catch (error) {
        // App might not be installed, which is fine
        if (error.message.includes('not found') || error.message.includes('Failure')) {
          console.log('ℹ️  App not installed (this is okay)');
        } else {
          throw error;
        }
      }
    } else {
      console.log(`🧹 Clearing app data for ${appId}...`);
      try {
        execSync(`"${adb}" shell pm clear ${appId}`, { stdio: 'inherit' });
        console.log('✅ App data cleared successfully!');
      } catch (error) {
        if (error.message.includes('not found') || error.message.includes('Failure')) {
          console.log('ℹ️  App not installed. Run with "uninstall" flag or install the app first.');
        } else {
          throw error;
        }
      }
    }
    
    console.log('\n💡 Next steps:');
    console.log('   1. Run: npm run dev:android');
    console.log('   2. Install/run the app in Android Studio');
    console.log('   3. Your latest changes should now appear!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearAppData();

