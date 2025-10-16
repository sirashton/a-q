import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { notificationService, NotificationSettings } from '../services/notificationService';
import { webNotificationService } from '../services/webNotificationService';
import { UserPreferences } from '../services/storageService';
import { textStyles } from '../styles/components';

interface NotificationSettingsProps {
  preferences: UserPreferences;
  onSettingsChange: (settings: Partial<NotificationSettings>) => void;
}

const NotificationSettingsComponent: React.FC<NotificationSettingsProps> = ({
  preferences,
  onSettingsChange
}) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: preferences.notificationsEnabled,
    timeType: preferences.notificationTime.type,
    fixedTime: preferences.notificationTime.fixedTime || '08:00',
    randomStart: preferences.notificationTime.randomStart || '07:00',
    randomEnd: preferences.notificationTime.randomEnd || '09:00',
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7] // All days by default
  });

  const [permissionStatus, setPermissionStatus] = useState<string>('checking');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      if (Capacitor.getPlatform() === 'web') {
        // Use web notification service
        const isEnabled = await webNotificationService.areEnabled();
        setPermissionStatus(isEnabled ? 'granted' : webNotificationService.getPermissionStatus());
      } else {
        // Use Capacitor notification service for native platforms
        const status = await notificationService.checkAndRequestPermissions();
        setPermissionStatus(status.display);
      }
    } catch (error) {
      console.error('Failed to check permissions:', error);
      setPermissionStatus('denied');
    }
  };

  const requestPermissions = async () => {
    try {
      if (Capacitor.getPlatform() === 'web') {
        // Use web notification service
        const status = await webNotificationService.requestPermission();
        setPermissionStatus(status);
      } else {
        // Use Capacitor notification service for native platforms
        const status = await notificationService.checkAndRequestPermissions();
        setPermissionStatus(status.display);
      }
    } catch (error) {
      console.error('Failed to request permissions:', error);
      setPermissionStatus('denied');
    }
  };

  const handleToggleEnabled = async (enabled: boolean) => {
    setSettings(prev => ({ ...prev, enabled }));
    
    if (enabled && permissionStatus !== 'granted') {
      await checkPermissions();
    }
    
    onSettingsChange({ enabled });
  };

  const handleTimeTypeChange = (type: 'fixed' | 'random') => {
    setSettings(prev => ({ ...prev, timeType: type }));
    onSettingsChange({ timeType: type });
  };

  const handleTimeChange = (field: 'fixedTime' | 'randomStart' | 'randomEnd', value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    onSettingsChange({ [field]: value });
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      if (Capacitor.getPlatform() === 'web') {
        // Use web notification service
        if (settings.enabled && webNotificationService.getPermissionStatus() === 'granted') {
          // Import adviceService to get daily advice
          const { adviceService } = await import('../services/adviceService');
          
          await webNotificationService.scheduleDailyNotifications(
            {
              enabled: settings.enabled,
              timeType: settings.timeType,
              fixedTime: settings.fixedTime,
              randomStart: settings.randomStart,
              randomEnd: settings.randomEnd
            },
            () => adviceService.getDailyAdvice()
          );
        }
        console.log('Web notification settings saved successfully');
      } else {
        // Use Capacitor notification service for native platforms
        await notificationService.updateNotificationSettings(settings);
        console.log('Notification settings saved successfully');
      }
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getPermissionMessage = () => {
    switch (permissionStatus) {
      case 'granted':
        return <span className="text-green-600 text-sm">✓ Notifications enabled</span>;
      case 'denied':
        return (
          <div className="space-y-2">
            <span className="text-red-600 text-sm block">✗ Notifications blocked</span>
            <button
              onClick={requestPermissions}
              className="text-xs bg-primary-600 text-white px-2 py-1 rounded hover:bg-primary-700"
            >
              Try Again
            </button>
          </div>
        );
      case 'prompt':
      case 'prompt-with-rationale':
        return (
          <div className="space-y-2">
            <span className="text-yellow-600 text-sm block">⚠ Permission needed</span>
            <button
              onClick={requestPermissions}
              className="text-xs bg-primary-600 text-white px-2 py-1 rounded hover:bg-primary-700"
            >
              Request Permission
            </button>
          </div>
        );
      default:
        return <span className="text-gray-600 text-sm">Checking permissions...</span>;
    }
  };

  // Show mobile app prompt for web users
  if (Capacitor.getPlatform() === 'web') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-secondary-900 mb-4">Daily Notifications</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <div className="text-blue-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-blue-900 mb-2">Get Daily Notifications</h4>
            <p className={`${textStyles.body} text-blue-700 mb-4`}>
              To receive daily notifications with, install our mobile app.
            </p>
            <p className={`${textStyles.body} text-blue-600 text-sm`}>
              Search for "a+q" in your app store to download the mobile version.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-secondary-900 mb-4">Daily Notifications</h3>
        
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between py-3">
          <div>
            <label className="text-sm font-medium text-secondary-700">Enable notifications</label>
            <p className="text-xs text-secondary-500">Receive daily advice and queries</p>
          </div>
          <button
            onClick={() => handleToggleEnabled(!settings.enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.enabled ? 'bg-primary-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Permission Status */}
        <div className="py-2">
          {getPermissionMessage()}
        </div>

        {/* Notification Settings */}
        {settings.enabled && (
          <div className="space-y-4 pt-4 border-t border-secondary-200">
            {/* Time Type Selection */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-3">
                Notification time
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="timeType"
                    value="fixed"
                    checked={settings.timeType === 'fixed'}
                    onChange={() => handleTimeTypeChange('fixed')}
                    className="h-4 w-4 text-primary-600 border-secondary-300 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-secondary-700">Fixed time</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="timeType"
                    value="random"
                    checked={settings.timeType === 'random'}
                    onChange={() => handleTimeTypeChange('random')}
                    className="h-4 w-4 text-primary-600 border-secondary-300 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-secondary-700">Random time within range</span>
                </label>
              </div>
            </div>

            {/* Time Inputs */}
            {settings.timeType === 'fixed' ? (
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={settings.fixedTime}
                  onChange={(e) => handleTimeChange('fixedTime', e.target.value)}
                  className="block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Start time
                  </label>
                  <input
                    type="time"
                    value={settings.randomStart}
                    onChange={(e) => handleTimeChange('randomStart', e.target.value)}
                    className="block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    End time
                  </label>
                  <input
                    type="time"
                    value={settings.randomEnd}
                    onChange={(e) => handleTimeChange('randomEnd', e.target.value)}
                    className="block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
              </div>
            )}

            {/* Test Notification Buttons (for web testing) */}
            {permissionStatus === 'granted' && (
              <div className="pt-2 space-y-2">
                <button
                  onClick={async () => {
                    try {
                      console.log('Sending immediate test notification...');
                      
                      if (Capacitor.getPlatform() === 'web') {
                        // Use web notification service
                        if (!webNotificationService.isSupported()) {
                          alert('Notifications are not supported in this browser');
                          return;
                        }
                        
                        if (webNotificationService.getPermissionStatus() !== 'granted') {
                          const status = await webNotificationService.requestPermission();
                          if (status !== 'granted') {
                            alert('Notification permission denied');
                            return;
                          }
                        }
                        
                        await webNotificationService.sendTestNotification();
                        console.log('Test notification sent successfully!');
                        alert('Test notification sent! Check for a browser notification.');
                      } else {
                        // Use Capacitor for native platforms
                        const { LocalNotifications } = await import('@capacitor/local-notifications');
                        
                        // Check permissions first
                        const permissionStatus = await LocalNotifications.checkPermissions();
                        console.log('Permission status:', permissionStatus);
                        
                        if (permissionStatus.display !== 'granted') {
                          console.log('Requesting permissions...');
                          await LocalNotifications.requestPermissions();
                        }
                        
                        const scheduleTime = new Date(Date.now() + 2000);
                        console.log('Scheduling notification for:', scheduleTime);
                        
                        await LocalNotifications.schedule({
                          notifications: [{
                            id: 999,
                            title: 'Test Notification',
                            body: 'This is a test notification from Advices & Queries!',
                            schedule: { at: scheduleTime }
                          }]
                        });
                        
                        console.log('Test notification scheduled successfully!');
                        alert('Test notification scheduled! Check for a notification in 2 seconds.');
                      }
                    } catch (error) {
                      console.error('Failed to send test notification:', error);
                      alert('Failed to send test notification. Check console for details.');
                    }
                  }}
                  className="w-full bg-secondary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2"
                >
                  Send Immediate Test
                </button>
                
                {Capacitor.getPlatform() === 'web' && (
                  <button
                    onClick={async () => {
                      try {
                        console.log('Scheduling test notification for 1 minute from now...');
                        
                        if (!webNotificationService.isSupported()) {
                          alert('Notifications are not supported in this browser');
                          return;
                        }
                        
                        if (webNotificationService.getPermissionStatus() !== 'granted') {
                          const status = await webNotificationService.requestPermission();
                          if (status !== 'granted') {
                            alert('Notification permission denied');
                            return;
                          }
                        }
                        
                        const scheduleTime = new Date(Date.now() + 60000); // 1 minute from now
                        await webNotificationService.scheduleNotification(
                          'Scheduled Test Notification',
                          'This is a scheduled test notification from Advices & Queries!',
                          scheduleTime
                        );
                        
                        console.log(`Test notification scheduled for: ${scheduleTime.toLocaleString()}`);
                        alert(`Test notification scheduled for 1 minute from now (${scheduleTime.toLocaleTimeString()}). Keep this page open!`);
                      } catch (error) {
                        console.error('Failed to schedule test notification:', error);
                        alert('Failed to schedule test notification. Check console for details.');
                      }
                    }}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Schedule Test (1 min)
                  </button>
                )}
              </div>
            )}

            {/* Save Button */}
            <div className="pt-4">
              <button
                onClick={handleSaveSettings}
                disabled={isSaving || permissionStatus === 'denied'}
                className="w-full bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Notification Settings'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSettingsComponent;
