import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { storageService } from './services/storageService';
import { notificationService } from './services/notificationService';
import { safeAreaService } from './services/safeAreaService';
import Home from './pages/Home';
import List from './pages/List';
import Settings from './pages/Settings';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AccountDeletion from './pages/AccountDeletion';
import NotFound from './pages/NotFound';
import CountrySelector from './components/CountrySelector';
import { UserPreferences } from './services/storageService';
import { App as CapacitorApp } from "@capacitor/app";
import { LiveUpdate } from "@capawesome/capacitor-live-update";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await storageService.initialize();
        await notificationService.initialize();
        await safeAreaService.initialize();
        const prefs = await storageService.getPreferences();
        const firstLaunch = await storageService.isFirstLaunch();
        
        setPreferences(prefs);
        setIsFirstLaunch(firstLaunch);
        
        // Check and top up notifications every time the app loads
        await notificationService.checkAndTopUpNotifications();
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();

    CapacitorApp.addListener("resume", async () => {
      const { nextBundleId } = await LiveUpdate.sync();
      if (nextBundleId) {
        // Ask the user if they want to apply the update immediately
        const shouldReload = confirm("A new update is available. Would you like to install it?");
        if (shouldReload) {
          await LiveUpdate.reload();
        }
      }
    });
  }, []);

  const handleCountrySelected = async (country: 'nz' | 'uk') => {
    await storageService.setCountry(country);
    const updatedPrefs = await storageService.getPreferences();
    setPreferences(updatedPrefs);
    setIsFirstLaunch(false);
  };

  const handlePreferencesUpdated = (updatedPreferences: UserPreferences) => {
    setPreferences(updatedPreferences);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center safe-area-all">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isFirstLaunch) {
    return <CountrySelector onCountrySelected={handleCountrySelected} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-secondary-50 safe-area-all">
        <Routes>
          <Route path="/" element={<Home preferences={preferences!} />} />
          <Route path="/list" element={<List preferences={preferences!} />} />
          <Route path="/settings" element={<Settings preferences={preferences!} onPreferencesUpdated={handlePreferencesUpdated} />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/account-deletion" element={<AccountDeletion />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;