import React, { useState, useEffect } from 'react';
import { UserPreferences, storageService } from '../services/storageService';
import { adviceService } from '../services/adviceService';
import BottomNav from '../components/BottomNav';
import NotificationSettingsComponent from '../components/NotificationSettings';
import { textStyles, cardStyles } from '../styles/components';

interface SettingsProps {
  preferences: UserPreferences;
  onPreferencesUpdated?: (preferences: UserPreferences) => void;
}

const Settings: React.FC<SettingsProps> = ({ preferences, onPreferencesUpdated }) => {
  const [localPreferences, setLocalPreferences] = useState<UserPreferences>(preferences);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const handleCountryChange = async (country: 'nz' | 'uk') => {
    const updatedPrefs = { ...localPreferences, selectedCountry: country };
    setLocalPreferences(updatedPrefs);
    
    // Auto-save immediately
    try {
      await storageService.updatePreferences(updatedPrefs);
      if (onPreferencesUpdated) {
        onPreferencesUpdated(updatedPrefs);
      }
      setSaveMessage('Settings saved');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage('Failed to save settings');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };


  const handleNotificationSettingsChange = async (settings: any) => {
    const updatedPrefs = {
      ...localPreferences,
      notificationsEnabled: settings.enabled ?? localPreferences.notificationsEnabled,
      notificationTime: {
        ...localPreferences.notificationTime,
        type: settings.timeType ?? localPreferences.notificationTime.type,
        fixedTime: settings.fixedTime ?? localPreferences.notificationTime.fixedTime,
        randomStart: settings.randomStart ?? localPreferences.notificationTime.randomStart,
        randomEnd: settings.randomEnd ?? localPreferences.notificationTime.randomEnd,
      }
    };
    setLocalPreferences(updatedPrefs);
    
    // Auto-save immediately
    try {
      await storageService.updatePreferences(updatedPrefs);
      if (onPreferencesUpdated) {
        onPreferencesUpdated(updatedPrefs);
      }
      setSaveMessage('Settings saved');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage('Failed to save settings');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const countries = adviceService.getAvailableCountries();

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 pb-20">
        <div className="space-y-8">
          {/* Country Selection */}
          <div className={`${cardStyles.base}`}>
            <h2 className={`${textStyles.heading} mb-4`}>
              Country Version
            </h2>
            <p className={`${textStyles.body} text-secondary-600 mb-6`}>
              Choose which version of Advices and Queries to use.
            </p>
            <div className="space-y-3">
              {countries.map((country) => (
                <label key={country.id} className="flex items-center">
                  <input
                    type="radio"
                    name="country"
                    value={country.id}
                    checked={localPreferences.selectedCountry === country.id}
                    onChange={() => handleCountryChange(country.id)}
                    className="mr-3"
                  />
                  <span className={`${textStyles.body}`}>
                    {country.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className={`${cardStyles.base}`}>
            <NotificationSettingsComponent
              preferences={localPreferences}
              onSettingsChange={handleNotificationSettingsChange}
            />
          </div>

          {/* App Information */}
          <div className={`${cardStyles.base}`}>
            <h2 className={`${textStyles.heading} mb-4`}>
              About
            </h2>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-secondary-700">Version:</span>
                <span className={`${textStyles.body} ml-2`}>1.0.0</span>
              </div>
              <div>
                <span className="font-medium text-secondary-700">Country:</span>
                <span className={`${textStyles.body} ml-2`}>
                  {localPreferences?.selectedCountry ? adviceService.getCountryName(localPreferences.selectedCountry) : 'Loading...'}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <p className={`${textStyles.body} text-secondary-600 text-sm`}>
                  Given freely to the world by{' '}
                  <a 
                    href="https://www.linkedin.com/in/alex-e-ashton/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 underline font-medium"
                  >
                    Alex Ashton
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Save Message */}
          {saveMessage && (
            <div className={`p-3 rounded-lg text-sm ${
              saveMessage.includes('saved') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {saveMessage}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Settings;