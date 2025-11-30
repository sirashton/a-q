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

## How OTA Updates Are Triggered

### Automatic Check
When Live Update is enabled, the app automatically checks for updates when:
1. **App Resumes** - When the user returns to the app (from background)
2. **App Launches** - On initial app startup (optional, can be configured)

### The Update Flow
1. **App calls `LiveUpdate.sync()`** - Checks Capawesome servers for new bundles
2. **Server responds** - Returns `nextBundleId` if a new version is available
3. **User is prompted** - A confirmation dialog asks if they want to update
4. **App reloads** - If user accepts, `LiveUpdate.reload()` applies the update
5. **New version loads** - App restarts with the new bundle from Capawesome

### What Gets Updated
✅ **Can be updated via OTA:**
- React components and logic
- CSS/styling changes
- JavaScript code
- HTML structure
- Assets (images, fonts, etc.)

❌ **Cannot be updated via OTA:**
- Native Android/iOS code changes
- Capacitor plugin updates
- App permissions
- Native dependencies
- App icon or splash screen (in some cases)

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

#### Step-by-Step OTA Update Process

**1. Build your production bundle:**
```bash
npm run build:android:prod
# This automatically enables Live Update, builds, and syncs
```

**2. Upload to Capawesome:**
You have two options:

**Option A: Using Capawesome Dashboard (Recommended)**
1. Go to [Capawesome Dashboard](https://capawesome.io) (or your Capawesome instance)
2. Log in with your account
3. Navigate to your app: `Advices and Queries` (App ID: `58f13a06-ae85-4441-a884-6852ae61bec3`)
4. Click "Upload Bundle" or "New Version"
5. Upload the entire contents of your `dist/` folder
   - You can zip it first: `cd dist && zip -r ../bundle.zip .`
   - Or upload the folder contents directly
6. Set the uploaded bundle as **Active** (this makes it available to users)

**Option B: Using Capawesome CLI**
```bash
# Install Capawesome CLI (if not already installed)
npm install -g @capawesome/cli

# Login to Capawesome
capawesome login

# Upload your dist folder
capawesome bundle upload --app-id 58f13a06-ae85-4441-a884-6852ae61bec3 --path dist

# Activate the bundle
capawesome bundle activate --app-id 58f13a06-ae85-4441-a884-6852ae61bec3 --bundle-id <bundle-id>
```

**3. Users receive the update:**
- Next time users open or resume the app, they'll see the update prompt
- They can choose to update immediately or later
- The update downloads and applies automatically

#### Complete OTA Release Workflow

```bash
# 1. Make your code changes
# ... edit files ...

# 2. Test locally (with Live Update disabled)
npm run dev:android

# 3. When ready for production release:
npm run build:android:prod

# 4. Upload to Capawesome (via dashboard or CLI)
# ... upload dist/ folder ...

# 5. Activate the bundle in Capawesome dashboard
# Users will get the update on next app resume/launch
```

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
# 1. Enable Live Update and build
npm run build:android:prod

# 2. Build release APK (for app store)
cd android
./gradlew assembleRelease

# 3. Upload bundle to Capawesome for OTA
# (Use dashboard or CLI - see "Deploy Updates" section above)

# 4. Release APK to app store (Google Play Store)
# The APK includes the initial bundle, but users will get OTA updates
```

## Understanding the Update Cycle

### Initial App Release
1. Build APK with Live Update enabled
2. Upload APK to app store
3. Users download from app store
4. App includes initial bundle (from `dist/` at build time)

### Subsequent Updates (OTA)
1. Make code changes
2. Build new bundle: `npm run build:android:prod`
3. Upload to Capawesome
4. Activate bundle in Capawesome
5. Users get update prompt on next app resume
6. **No app store update needed!**

### Version Management
- Each bundle uploaded to Capawesome gets a unique `bundleId`
- You can have multiple bundles (for testing, staging, production)
- Only the **active** bundle is served to users
- You can rollback by activating a previous bundle

