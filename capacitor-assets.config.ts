const config = {
  // Source assets directory
  assetsPath: './assets',
  
  // Output directory (will be created automatically)
  outputPath: './resources',
  
  // Global settings
  iconBackgroundColor: '#B33062',
  splashBackgroundColor: '#B33062',
  
  // Platforms to generate assets for
  platforms: {
    android: {
      // App icon settings
      icon: {
        source: './assets/logo.svg', // Use our SVG logo
        // Android will generate: mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi
      },
      
      // Splash screen settings
      splash: {
        source: './assets/logo.svg', // Use our SVG logo
        // Keep important content within 1200x1200px center
      },
      
      // Adaptive icon (Android 8.0+)
      adaptiveIcon: {
        foreground: './assets/logo.svg', // Use our SVG logo
        background: '#B33062', // Solid color background
      }
    },
    
    ios: {
      icon: {
        source: './assets/logo.svg',
      },
      splash: {
        source: './assets/logo.svg',
      }
    }
  }
};

export default config;
