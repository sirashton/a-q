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
    randomEnd: preferences.notificationTime.randomEnd || '09:00'
  });

  const [permissionStatus, setPermissionStatus] = useState<string>('checking');
  const [isSaving, setIsSaving] = useState(false);
  const [pendingNotifications, setPendingNotifications] = useState<Array<{
    id: number;
    scheduledTime: string;
    scheduledDate: Date;
    isWarning: boolean;
    isRepeating: boolean;
    body: string;
    title: string;
  }>>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [showScheduledNotifications, setShowScheduledNotifications] = useState(false);

  useEffect(() => {
    checkPermissions();
    if (Capacitor.getPlatform() !== 'web') {
      loadPendingNotifications();
    }
  }, []);

  // Refresh notifications when settings change
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'web' && settings.enabled && permissionStatus === 'granted') {
      // Small delay to allow notifications to be scheduled
      const timer = setTimeout(() => {
        loadPendingNotifications();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [settings.enabled, settings.timeType, settings.fixedTime, settings.randomStart, settings.randomEnd]);

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

  const loadPendingNotifications = async () => {
    if (Capacitor.getPlatform() === 'web') {
      return;
    }
    
    setIsLoadingNotifications(true);
    try {
      const notifications = await notificationService.getFormattedPendingNotifications();
      setPendingNotifications(notifications);
    } catch (error) {
      console.error('Failed to load pending notifications:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      if (Capacitor.getPlatform() === 'web') {
        // Use web notification service
        if (settings.enabled && webNotificationService.getPermissionStatus() === 'granted') {
          // Import adviceService to get daily advice
          const { adviceService } = await import('../services/adviceService');
          
          // Check if we can get daily advice before scheduling
          const dailyAdvice = await adviceService.getDailyAdvice();
          if (!dailyAdvice) {
            console.warn('No daily advice available, skipping notification scheduling');
            return;
          }
          
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
        
        // Reload pending notifications after saving
        setTimeout(() => {
          loadPendingNotifications();
        }, 1000);
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

            {/* Test Notification Buttons */}
            {permissionStatus === 'granted' && (
              <div className="pt-2 space-y-2">
                <button
                  onClick={async () => {
                    try {
                      console.log('🧪 Sending immediate test notification...');
                      
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
                        console.log('✅ Test notification sent successfully!');
                        alert('Test notification sent! Check for a browser notification.');
                      } else {
                        // Use Capacitor for native platforms
                        const { LocalNotifications } = await import('@capacitor/local-notifications');
                        
                        // Check permissions first
                        const permissionStatus = await LocalNotifications.checkPermissions();
                        console.log('🔐 Permission status:', permissionStatus);
                        
                        if (permissionStatus.display !== 'granted') {
                          console.log('🔐 Requesting permissions...');
                          await LocalNotifications.requestPermissions();
                        }
                        
                        const scheduleTime = new Date(Date.now() + 2000);
                        console.log('⏰ Scheduling notification for:', scheduleTime);
                        
                        await LocalNotifications.schedule({
                          notifications: [{
                            id: 999,
                            title: 'Test Notification',
                            body: 'This is a test notification from Advices & Queries!',
                            schedule: { at: scheduleTime }
                          }]
                        });
                        
                        console.log('✅ Test notification scheduled successfully!');
                        alert('Test notification scheduled! Check for a notification in 2 seconds.');
                      }
                    } catch (error) {
                      console.error('❌ Failed to send test notification:', error);
                      alert('Failed to send test notification. Check console for details.');
                    }
                  }}
                  className="w-full bg-secondary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2"
                >
                  Send Immediate Test
                </button>
                
              {notificationService.isDebugMode() && (
                <>
                  <button
                    onClick={async () => {
                      try {
                        console.log('🧪 Testing notification service...');
                        await notificationService.scheduleDailyNotifications();
                        console.log('✅ Daily notifications test completed!');
                        alert('Daily notifications test completed! Check console for details.');
                      } catch (error) {
                        console.error('❌ Failed to test daily notifications:', error);
                        alert('Failed to test daily notifications. Check console for details.');
                      }
                    }}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Test Daily Notifications
                  </button>
                  
                  <button
                    onClick={async () => {
                      try {
                        await notificationService.debugPendingNotifications();
                        alert('Check console for pending notifications details');
                      } catch (error) {
                        console.error('❌ Failed to debug notifications:', error);
                        alert('Failed to debug notifications. Check console for details.');
                      }
                    }}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    Debug: Show Pending
                  </button>
                  
                  <button
                    onClick={async () => {
                      try {
                        await notificationService.debugForceReschedule();
                        alert('Force rescheduled! Check console for details.');
                      } catch (error) {
                        console.error('❌ Failed to force reschedule:', error);
                        alert('Failed to force reschedule. Check console for details.');
                      }
                    }}
                    className="w-full bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                  >
                    Debug: Force Reschedule
                  </button>
                  
                  <button
                    onClick={async () => {
                      try {
                        const result = await notificationService.exportLogs();
                        alert(`Logs exported! ${result.includes('.txt') ? 'File: ' + result : 'Check console for logs.'}`);
                      } catch (error) {
                        console.error('❌ Failed to export logs:', error);
                        alert('Failed to export logs. Check console for details.');
                      }
                    }}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    Debug: Export Logs
                  </button>
                </>
              )}
                
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

        {/* Scheduled Notifications Debug Section */}
        {Capacitor.getPlatform() !== 'web' && settings.enabled && permissionStatus === 'granted' && (
          <div className="pt-6 border-t border-secondary-200 mt-6">
            <button
              onClick={() => {
                setShowScheduledNotifications(!showScheduledNotifications);
                if (!showScheduledNotifications && pendingNotifications.length === 0) {
                  loadPendingNotifications();
                }
              }}
              className="w-full flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-3 hover:bg-secondary-50"
            >
              <div>
                <h4 className="text-sm font-medium text-secondary-900">Scheduled Notifications</h4>
                <p className="text-xs text-secondary-500 mt-1">
                  {pendingNotifications.length > 0 
                    ? `${pendingNotifications.length} notification${pendingNotifications.length !== 1 ? 's' : ''} scheduled`
                    : 'View scheduled notifications'
                  }
                </p>
              </div>
              <svg
                className={`w-5 h-5 text-secondary-500 transition-transform ${showScheduledNotifications ? 'transform rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showScheduledNotifications && (
              <div className="mt-4">
                <div className="flex items-center justify-end mb-4">
                  <button
                    onClick={loadPendingNotifications}
                    disabled={isLoadingNotifications}
                    className="text-xs bg-secondary-200 text-secondary-700 px-3 py-1 rounded hover:bg-secondary-300 focus:outline-none focus:ring-2 focus:ring-secondary-500 disabled:opacity-50"
                  >
                    {isLoadingNotifications ? 'Loading...' : 'Refresh'}
                  </button>
                </div>

                {isLoadingNotifications ? (
                  <div className="text-center py-4 text-sm text-secondary-500">Loading...</div>
                ) : pendingNotifications.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-yellow-800">
                      No notifications scheduled. Save your settings to schedule notifications.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {pendingNotifications.map((notif) => {
                        const now = new Date();
                        const isPast = notif.scheduledDate < now;
                        const isToday = notif.scheduledDate.toDateString() === now.toDateString();
                        
                        return (
                          <div
                            key={notif.id}
                            className={`border rounded-lg p-3 text-sm ${
                              isPast
                                ? 'bg-gray-50 border-gray-300 opacity-60'
                                : isToday
                                ? 'bg-blue-50 border-blue-300'
                                : notif.isWarning
                                ? 'bg-orange-50 border-orange-300'
                                : 'bg-white border-secondary-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-secondary-900">
                                    {notif.isWarning ? '⚠️ Warning' : notif.isRepeating ? '🔄 Repeating' : '📅 Scheduled'}
                                  </span>
                                  {isPast && <span className="text-xs text-gray-500">(Past)</span>}
                                  {isToday && !isPast && <span className="text-xs text-blue-600 font-medium">(Today)</span>}
                                </div>
                                <div className="text-secondary-700 mb-1">
                                  <span className="font-medium">{notif.scheduledTime}</span>
                                  {notif.isRepeating && <span className="text-xs text-secondary-500 ml-2">(Daily)</span>}
                                </div>
                                <div className="text-xs text-secondary-600 mt-1 line-clamp-2">
                                  {notif.body}
                                </div>
                                <div className="text-xs text-secondary-400 mt-1">
                                  ID: {notif.id}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 p-3 bg-secondary-50 rounded-lg">
                      <p className="text-xs text-secondary-600">
                        <strong>Expected:</strong> {settings.timeType === 'fixed' 
                          ? `One notification at ${settings.fixedTime} (repeating daily)`
                          : `Random notifications between ${settings.randomStart} and ${settings.randomEnd}`
                        }
                      </p>
                      <p className="text-xs text-secondary-600 mt-1">
                        <strong>Actual:</strong> {pendingNotifications.length} notification{pendingNotifications.length !== 1 ? 's' : ''} scheduled
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSettingsComponent;
