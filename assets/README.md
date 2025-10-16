# App Assets

This directory contains the source assets for generating app icons and splash screens.

## Required Files:

### For Android:
- `icon.png` - 1024x1024px app icon (PNG with transparency)
- `splash.png` - 2732x2732px splash screen (PNG)
- `icon-foreground.png` - 1024x1024px adaptive icon foreground (PNG with transparency)
- `icon-background.png` - 1024x1024px adaptive icon background (PNG, solid color)

### For iOS:
- Same files as Android (will be automatically resized)

## Design Guidelines:

### App Icon:
- Keep important elements within the center 66% of the canvas
- Use high contrast colors
- Avoid text or fine details
- Should work at 24dp size
- Follow Material Design 3 guidelines

### Splash Screen:
- Keep important content within 1200x1200px center area
- Use your app's primary colors
- Include your app name/logo
- Keep it simple and clean

## Generating Assets:

Once you have your source files, run:
```bash
npx @capacitor/assets generate
```

This will automatically generate all required sizes for Android and iOS.
