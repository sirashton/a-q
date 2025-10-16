# Advices and Queries (A+Q)

A cross-platform mobile and web application for daily spiritual reflection, featuring the Advices and Queries from the Religious Society of Friends (Quakers).

## 🌟 Features

- **Daily Reflection**: Get a randomly selected advice or query each day
- **Multiple Versions**: Choose between New Zealand and United Kingdom versions
- **Smart Cycling**: Ensures all advices are shown before repeating (no immediate repeats)
- **Cross-Platform**: Works on web, iOS, and Android
- **Daily Notifications**: Receive notifications on mobile devices (full support)
- **Clean UI**: Simple, focused interface with beautiful typography
- **Persistent Storage**: Your preferences and daily progress are saved

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- For mobile development: Xcode (iOS) or Android Studio (Android)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd a-q
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:3000` (or the port shown in terminal)

## 📱 Platform Support

### Web
- ✅ Full functionality
- ✅ Country selection (NZ/UK)
- ✅ Daily advice display
- ✅ Settings persistence
- ℹ️ Notifications: Prompts to install mobile app

### Mobile (iOS/Android)
- ✅ All web features
- ✅ Native notifications
- ✅ Background scheduling
- ✅ App store distribution ready

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run unit tests
npm run test:ui      # Run tests with UI
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage
npm run test:e2e     # Run end-to-end tests
npm run test:e2e:ui  # Run E2E tests with UI
npm run test:all     # Run all tests

# Mobile Development
npx cap sync         # Sync web assets to mobile platforms
npx cap run ios      # Run on iOS simulator
npx cap run android  # Run on Android emulator
```

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AdviceCard.tsx   # Individual advice display
│   ├── BottomNav.tsx    # Bottom navigation
│   └── NotificationSettings.tsx # Notification configuration
├── data/
│   └── advices.json     # NZ and UK Advices & Queries content
├── pages/               # Main application pages
│   ├── Home.tsx         # Daily advice display
│   ├── List.tsx         # All advices list
│   └── Settings.tsx     # User preferences
├── services/            # Business logic
│   ├── adviceService.ts # Advice selection and management
│   ├── storageService.ts # User preferences storage
│   ├── notificationService.ts # Mobile notifications
│   └── webNotificationService.ts # Web notifications
├── styles/
│   └── components.ts    # Reusable style patterns
└── test/                # End-to-end tests
    ├── core-functionality.test.ts
    └── country-persistence.test.ts
```

## 🎨 Design System

### Colors
- **Primary**: `#B33062` (Rose/Magenta)
- **Secondary**: Neutral grays and whites
- **Accent**: Blue for notifications and CTAs

### Typography
- **Primary Font**: Zilla Slab (Google Fonts)
- **Clean, readable hierarchy**

### Components
- Consistent card-based layout
- Bottom navigation for mobile-first design
- Responsive design principles

## 📊 Content

### New Zealand Version
- **Section A**: God and ourselves (A1-A8)
- **Section B**: Reaching towards God (B1-B14) 
- **Section C**: Seeking God's will in decision-making (C1-C4)
- **Section D**: Ourselves and one another (D1-D19)
- **Section E**: Reaching beyond ourselves (E1-E14)

### United Kingdom Version
- **Section A**: God and ourselves (1-7)
- **Section B**: Worship (8-16)
- **Section C**: Seeking God's will in decision-making (17-30)
- **Section D**: Ourselves and one another (31-42)

## 🔔 Notifications

### Mobile (iOS/Android)
- Full notification support with Capacitor Local Notifications
- Configurable timing (fixed or random within range)
- Background scheduling
- Permission handling

### Web
- Limited to immediate notifications
- Prompts users to install mobile app for full functionality
- Uses browser's native Notification API

## 🧪 Testing

### Unit Tests
- Service layer testing with Vitest
- Mocked dependencies for isolated testing
- Coverage reporting available

### End-to-End Tests
- Playwright for cross-browser testing
- Tests core functionality and user flows
- Country persistence and navigation

### Running Tests
```bash
# Run all tests
npm run test:all

# Run specific test suites
npm run test:run        # Unit tests only
npm run test:e2e        # E2E tests only
```

## 🚀 Deployment

### Web Deployment
1. Build the project: `npm run build`
2. Deploy the `dist/` folder to your hosting provider
3. Configure routing for SPA (all routes should serve `index.html`)

### Mobile Deployment
1. **iOS**: Use Xcode to build and submit to App Store
2. **Android**: Use Android Studio to build and submit to Play Store
3. **Capawesome Cloud**: Configure for automated builds and OTA updates

## 🔧 Configuration

### Capacitor Configuration
```typescript
// capacitor.config.ts
{
  appId: 'app.a-q',
  appName: 'Advices and Queries',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#B33062",
      sound: "beep.wav"
    }
  }
}
```

### Environment Variables
- No environment variables required for basic functionality
- Configure as needed for deployment and analytics

## 📚 Technology Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Mobile**: Capacitor
- **Testing**: Vitest + Playwright
- **Icons**: Lucide React
- **Fonts**: Google Fonts (Zilla Slab)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Content from the Religious Society of Friends (Quakers)
- New Zealand Yearly Meeting
- Britain Yearly Meeting

---

**Made with ❤️ for the Quaker community**