#!/usr/bin/env node

/**
 * Toggle Live Update plugin in capacitor.config.ts and App.tsx
 * Usage: node scripts/toggle-live-update.cjs [enable|disable]
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'capacitor.config.ts');
const appTsxPath = path.join(__dirname, '..', 'src', 'App.tsx');

const action = process.argv[2] || 'disable';
const enable = action === 'enable' || action === 'on' || action === 'true';

function toggleLiveUpdate() {
  // Read capacitor.config.ts
  let configContent = fs.readFileSync(configPath, 'utf8');
  
  if (enable) {
    // Enable Live Update - uncomment the plugin
    configContent = configContent.replace(
      /\/\/\s*LiveUpdate:\s*\{[\s\S]*?\/\/\s*appId:\s*'58f13a06-ae85-4441-a884-6852ae61bec3',[\s\S]*?\/\/\s*\}/,
      `LiveUpdate: {
      appId: '58f13a06-ae85-4441-a884-6852ae61bec3',
    }`
    );
    console.log('✅ Live Update enabled in capacitor.config.ts');
  } else {
    // Disable Live Update - comment out the plugin
    configContent = configContent.replace(
      /LiveUpdate:\s*\{[\s\S]*?appId:\s*'58f13a06-ae85-4441-a884-6852ae61bec3',[\s\S]*?\}/,
      `// LiveUpdate: {
    //   appId: '58f13a06-ae85-4441-a884-6852ae61bec3',
    // }`
    );
    console.log('✅ Live Update disabled in capacitor.config.ts');
  }
  
  fs.writeFileSync(configPath, configContent, 'utf8');
  
  // Read App.tsx
  let appContent = fs.readFileSync(appTsxPath, 'utf8');
  
  if (enable) {
    // Enable imports
    appContent = appContent.replace(
      /\/\/\s*import\s+\{\s*App\s+as\s+CapacitorApp\s+\}\s+from\s+"@capacitor\/app";/,
      `import { App as CapacitorApp } from "@capacitor/app";`
    );
    appContent = appContent.replace(
      /\/\/\s*import\s+\{\s*LiveUpdate\s+\}\s+from\s+"@capawesome\/capacitor-live-update";/,
      `import { LiveUpdate } from "@capawesome/capacitor-live-update";`
    );
    
    // Uncomment the listener - match the commented block exactly
    const commentedListener = `// LiveUpdate listener - DISABLED for development
    // Uncomment when ready for production OTA updates
    // CapacitorApp.addListener("resume", async () => {
    //   try {
    //     const { nextBundleId } = await LiveUpdate.sync();
    //     if (nextBundleId) {
    //       // Ask the user if they want to apply the update immediately
    //       const shouldReload = confirm("A new update is available. Would you like to install it?");
    //       if (shouldReload) {
    //         await LiveUpdate.reload();
    //       }
    //     }
    //   } catch (error) {
    //     console.error('Live Update sync failed:', error);
    //   }
    // });`;
    
    const uncommentedListener = `// LiveUpdate listener - checks for updates when app resumes
    CapacitorApp.addListener("resume", async () => {
      try {
        const { nextBundleId } = await LiveUpdate.sync();
        if (nextBundleId) {
          // Ask the user if they want to apply the update immediately
          const shouldReload = confirm("A new update is available. Would you like to install it?");
          if (shouldReload) {
            await LiveUpdate.reload();
          }
        }
      } catch (error) {
        console.error('Live Update sync failed:', error);
      }
    });`;
    
    appContent = appContent.replace(commentedListener, uncommentedListener);
    console.log('✅ Live Update enabled in App.tsx');
  } else {
    // Disable imports
    appContent = appContent.replace(
      /^import\s+\{\s*App\s+as\s+CapacitorApp\s+\}\s+from\s+"@capacitor\/app";$/m,
      `// import { App as CapacitorApp } from "@capacitor/app";`
    );
    appContent = appContent.replace(
      /^import\s+\{\s*LiveUpdate\s+\}\s+from\s+"@capawesome\/capacitor-live-update";$/m,
      `// import { LiveUpdate } from "@capawesome/capacitor-live-update";`
    );
    
    // Comment out the listener - match the uncommented block exactly
    const uncommentedListener = `// LiveUpdate listener - checks for updates when app resumes
    CapacitorApp.addListener("resume", async () => {
      try {
        const { nextBundleId } = await LiveUpdate.sync();
        if (nextBundleId) {
          // Ask the user if they want to apply the update immediately
          const shouldReload = confirm("A new update is available. Would you like to install it?");
          if (shouldReload) {
            await LiveUpdate.reload();
          }
        }
      } catch (error) {
        console.error('Live Update sync failed:', error);
      }
    });`;
    
    const commentedListener = `// LiveUpdate listener - DISABLED for development
    // Uncomment when ready for production OTA updates
    // CapacitorApp.addListener("resume", async () => {
    //   try {
    //     const { nextBundleId } = await LiveUpdate.sync();
    //     if (nextBundleId) {
    //       // Ask the user if they want to apply the update immediately
    //       const shouldReload = confirm("A new update is available. Would you like to install it?");
    //       if (shouldReload) {
    //         await LiveUpdate.reload();
    //       }
    //     }
    //   } catch (error) {
    //     console.error('Live Update sync failed:', error);
    //   }
    // });`;
    
    appContent = appContent.replace(uncommentedListener, commentedListener);
    console.log('✅ Live Update disabled in App.tsx');
  }
  
  fs.writeFileSync(appTsxPath, appContent, 'utf8');
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
