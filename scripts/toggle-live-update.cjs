#!/usr/bin/env node

/**
 * Toggle Live Update feature flag
 * Usage: node scripts/toggle-live-update.cjs [enable|disable]
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'config', 'live-update.ts');

const action = process.argv[2] || 'disable';
const enable = action === 'enable' || action === 'on' || action === 'true';

function toggleLiveUpdate() {
  // Read the config file
  let configContent = fs.readFileSync(configPath, 'utf8');
  
  // Replace the flag value
  configContent = configContent.replace(
    /export const LIVE_UPDATE_ENABLED = (true|false);/,
    `export const LIVE_UPDATE_ENABLED = ${enable};`
  );
  
  fs.writeFileSync(configPath, configContent, 'utf8');
  
  console.log(`✅ Live Update ${enable ? 'ENABLED' : 'DISABLED'} in config/live-update.ts`);
}

try {
  toggleLiveUpdate();
  console.log(`\n🎉 Live Update ${enable ? 'ENABLED' : 'DISABLED'} successfully!`);
  if (!enable) {
    console.log('💡 For production builds, run: npm run enable:live-update');
  }
} catch (error) {
  console.error('❌ Error toggling Live Update:', error.message);
  process.exit(1);
}
