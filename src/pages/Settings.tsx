import React, { useState, useEffect } from 'react';
import { UserPreferences, storageService } from '../services/storageService';
import { adviceService } from '../services/adviceService';
import BottomNav from '../components/BottomNav';
import { textStyles, cardStyles, inputStyles } from '../styles/components';

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

  const handleNotificationsToggle = async (enabled: boolean) => {
    const updatedPrefs = { ...localPreferences, notificationsEnabled: enabled };
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

  const handleNotificationTimeChange = async (field: string, value: any) => {
    const updatedPrefs = {
      ...localPreferences,
      notificationTime: {
        ...localPreferences.notificationTime,
        [field]: value
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
            <h2 className={`${textStyles.heading} mb-4`}>
              Daily Notifications
            </h2>
            <p className={`${textStyles.body} text-secondary-600 mb-6`}>
              Receive daily notifications with a randomly selected advice or query.
            </p>
            
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localPreferences.notificationsEnabled}
                  onChange={(e) => handleNotificationsToggle(e.target.checked)}
                  className="mr-3"
                />
                <span className={`${textStyles.body}`}>
                  Enable daily notifications
                </span>
              </label>

              {localPreferences.notificationsEnabled && (
                <div className="ml-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Notification Time
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="notificationType"
                          value="fixed"
                          checked={localPreferences.notificationTime.type === 'fixed'}
                          onChange={() => handleNotificationTimeChange('type', 'fixed')}
                          className="mr-3"
                        />
                        <span className={`${textStyles.body}`}>Fixed time</span>
                      </label>
                      {localPreferences.notificationTime.type === 'fixed' && (
                        <div className="ml-6">
                          <input
                            type="time"
                            value={localPreferences.notificationTime.fixedTime || '08:00'}
                            onChange={(e) => handleNotificationTimeChange('fixedTime', e.target.value)}
                            className={`${inputStyles.base} w-32`}
                          />
                        </div>
                      )}
                      
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="notificationType"
                          value="random"
                          checked={localPreferences.notificationTime.type === 'random'}
                          onChange={() => handleNotificationTimeChange('type', 'random')}
                          className="mr-3"
                        />
                        <span className={`${textStyles.body}`}>Random time within range</span>
                      </label>
                      {localPreferences.notificationTime.type === 'random' && (
                        <div className="ml-6 space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="time"
                              value={localPreferences.notificationTime.randomRange?.start || '08:00'}
                              onChange={(e) => handleNotificationTimeChange('randomRange', {
                                ...localPreferences.notificationTime.randomRange,
                                start: e.target.value
                              })}
                              className={`${inputStyles.base} w-32`}
                            />
                            <span className={`${textStyles.body}`}>to</span>
                            <input
                              type="time"
                              value={localPreferences.notificationTime.randomRange?.end || '10:00'}
                              onChange={(e) => handleNotificationTimeChange('randomRange', {
                                ...localPreferences.notificationTime.randomRange,
                                end: e.target.value
                              })}
                              className={`${inputStyles.base} w-32`}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
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