# OTA Updates Guide - Capacitor Live Update

## Overview
This app uses **Capawesome Capacitor Live Update** for Over-The-Air (OTA) updates. This allows you to push web app updates to users without requiring an app store release.

## How It Works

### Development Mode (Current Setup)
- **Live Update is DISABLED** in `capacitor.config.ts`
- App always loads from local assets (`android/app/src/main/assets/public`)
- Changes appear immediately after rebuild/sync
- No caching issues during development

### Production Mode
- **Live Update is ENABLED** in `capacitor.config.ts`
- App checks for updates on launch/resume
- Updates are downloaded from Capawesome servers
- Users get updates automatically

## Setup Instructions

### 1. Enable Live Update for Production

Uncomment in `capacitor.config.ts`:
```typescript
plugins: {
  LocalNotifications: { ... },
  LiveUpdate: {
    appId: '58f13a06-ae85-4441-a884-6852ae61bec3',
  }
}
```

### 2. Enable Live Update Listener in App.tsx

Uncomment in `src/App.tsx`:
```typescript
import { App as CapacitorApp } from "@capacitor/app";
import { LiveUpdate } from "@capawesome/capacitor-live-update";

// In useEffect:
CapacitorApp.addListener("resume", async () => {
  const { nextBundleId } = await LiveUpdate.sync();
  if (nextBundleId) {
    const shouldReload = confirm("A new update is available. Would you like to install it?");
    if (shouldReload) {
      await LiveUpdate.reload();
    }
  }
});
```

### 3. Deploy Updates

After building your app:
```bash
npm run build
npx cap sync android
```

Then upload the bundle to Capawesome:
- Use the Capawesome CLI or web dashboard
- Upload the `dist` folder contents
- Set it as the active bundle for your app

## Best Practices

### Development
✅ Keep Live Update **DISABLED** in `capacitor.config.ts`
✅ Test changes locally first
✅ Use `npm run build && npx cap sync android`

### Production
✅ Enable Live Update **ONLY** when ready to deploy
✅ Test the production build locally first (with Live Update enabled)
✅ Upload bundles through Capawesome dashboard
✅ Monitor update adoption

### Important Notes
- ⚠️ **Native changes** (Android/iOS code) still require app store updates
- ⚠️ **Plugin changes** may require app store updates
- ✅ **Web changes** (React, CSS, JS) can be updated via OTA
- ✅ Always test OTA updates in a staging environment first

## Troubleshooting

### Updates Not Showing
1. Check Live Update is enabled in `capacitor.config.ts`
2. Verify bundle was uploaded to Capawesome
3. Check app logs for Live Update errors
4. Clear app data: `adb shell pm clear app.a_q`

### Development Issues
1. If changes aren't showing, disable Live Update
2. Clear app data and reinstall
3. Check that `npx cap sync` completed successfully

## Workflow

### For Development:
```bash
# 1. Make changes
# 2. Build and sync
npm run build
npx cap sync android

# 3. Test in emulator/device
# (Live Update should be disabled)
```

### For Production Release:
```bash
# 1. Enable Live Update in capacitor.config.ts
# 2. Build and sync
npm run build
npx cap sync android

# 3. Build release APK
cd android
./gradlew assembleRelease

# 4. Upload bundle to Capawesome for OTA
# 5. Release APK to app store
```

