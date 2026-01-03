import { LocalNotifications, PermissionStatus, PendingLocalNotificationSchema } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { storageService } from './storageService';
import { notificationLogger } from './notificationLogger';

export interface NotificationSettings {
  enabled: boolean;
  timeType: 'fixed' | 'random';
  fixedTime: string; // HH:MM format
  randomStart: string; // HH:MM format
  randomEnd: string; // HH:MM format
}

export interface NotificationTime {
  type: 'fixed' | 'random';
  fixedTime?: string;
  randomStart?: string;
  randomEnd?: string;
}

// Use the proper Capacitor type
type PendingNotification = PendingLocalNotificationSchema;

class NotificationService {
  private readonly CHANNEL_ID = 'daily-advice-channel';
  private readonly NOTIFICATION_QUEUE_SIZE = 3; // Days of notifications to maintain
  private readonly DEBUG_MODE = false; // Set to true to show debug buttons

  /**
   * Check if debug mode is enabled
   */
  public isDebugMode(): boolean {
    return this.DEBUG_MODE;
  }

  /**
   * Initialize the notification service
   */
  public async initialize(): Promise<void> {
    try {
      notificationLogger.debug('initialize() called - entry point');
      // Create notification channel for Android
      await this.createNotificationChannel();
      
      // Check and request permissions
      await this.checkAndRequestPermissions();
      
      // Check if we need to top up the notification queue
      notificationLogger.debug('initialize() calling checkAndTopUpNotificationsInternal()');
      await this.checkAndTopUpNotificationsInternal();
      notificationLogger.debug('initialize() completed');
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  /**
   * Public method to check and top up notifications (called from App component)
   */
  public async checkAndTopUpNotifications(): Promise<void> {
    notificationLogger.debug('checkAndTopUpNotifications() called from App.tsx');
    await this.checkAndTopUpNotificationsInternal();
  }

  /**
   * Check if we need to top up the notification queue
   */
  private async checkAndTopUpNotificationsInternal(): Promise<void> {
    try {
      notificationLogger.debug('checkAndTopUpNotificationsInternal() - START');
      const preferences = await storageService.getPreferences();
      notificationLogger.debug('Top-up check - Preferences', {
        notificationsEnabled: preferences.notificationsEnabled,
        type: preferences.notificationTime.type,
        fixedTime: preferences.notificationTime.fixedTime,
        randomStart: preferences.notificationTime.randomStart,
        randomEnd: preferences.notificationTime.randomEnd
      });
      
      if (!preferences.notificationsEnabled || preferences.notificationTime.type !== 'random') {
        notificationLogger.debug('Top-up check - EARLY RETURN (not random or disabled)');
        return;
      }

      const pendingNotifications = await this.getPendingNotifications();
      console.log(`📊 Pending notifications: ${pendingNotifications.length}`);
      console.log('🔍 [DEBUG] Pending notification details:', pendingNotifications.map(n => ({
        id: n.id,
        scheduled: n.schedule?.at ? new Date(n.schedule.at).toLocaleString() : 'N/A',
        extra: n.extra
      })));

      // Check if we have any warning notifications that need to be cleaned up
      const hasWarningNotification = pendingNotifications.some(notif => 
        (notif.extra as { adviceId?: string })?.adviceId === 'warning'
      );

      // If we have a warning notification, it means the user hasn't opened the app
      // and we should reschedule the full queue
      if (hasWarningNotification) {
        console.log('🧹 Cleaning up old notifications and rescheduling...');
        await this.cancelAllNotifications();
        await this.scheduleRandomNotifications(
          preferences.notificationTime.randomStart!,
          preferences.notificationTime.randomEnd!,
          this.NOTIFICATION_QUEUE_SIZE
        );
        return;
      }

      // Always maintain exactly NOTIFICATION_QUEUE_SIZE days of notifications
      if (pendingNotifications.length < this.NOTIFICATION_QUEUE_SIZE) {
        const notificationsNeeded = this.NOTIFICATION_QUEUE_SIZE - pendingNotifications.length;
        console.log(`🔄 Topping up notification queue with ${notificationsNeeded} more notifications...`);
        
        await this.scheduleRandomNotifications(
          preferences.notificationTime.randomStart!,
          preferences.notificationTime.randomEnd!,
          notificationsNeeded
        );
      }
    } catch (error) {
      console.error('Failed to check and top up notifications:', error);
    }
  }

  /**
   * Check if notifications are enabled
   */
  public async areEnabled(): Promise<boolean> {
    try {
      const result = await LocalNotifications.areEnabled();
      return result.value;
    } catch (error) {
      console.error('Failed to check notification status:', error);
      return false;
    }
  }

  /**
   * Check and request notification permissions
   */
  public async checkAndRequestPermissions(): Promise<PermissionStatus> {
    try {
      const permissionStatus = await LocalNotifications.checkPermissions();
      
      if (permissionStatus.display === 'denied') {
        console.log('Notification permissions denied');
        return permissionStatus;
      }

      if (permissionStatus.display === 'prompt' || permissionStatus.display === 'prompt-with-rationale') {
        const requestResult = await LocalNotifications.requestPermissions();
        
        // Check exact alarm settings for Android 12+ after requesting permissions
        if (Capacitor.getPlatform() === 'android') {
          try {
            const exactAlarmStatus = await LocalNotifications.checkExactNotificationSetting();
            console.log('Exact alarm setting:', exactAlarmStatus);
            
            if (!exactAlarmStatus.exact_alarm) {
              console.warn('Exact alarms are disabled. Notifications may not be precise.');
              // Optionally, you could prompt the user to enable exact alarms
              // await LocalNotifications.changeExactNotificationSetting();
            }
          } catch (error) {
            console.log('Could not check exact alarm setting:', error);
          }
        }
        
        return requestResult;
      }

      return permissionStatus;
    } catch (error) {
      console.error('Failed to check/request permissions:', error);
      throw error;
    }
  }

  /**
   * Create notification channel for Android
   */
  private async createNotificationChannel(): Promise<void> {
    // Only create channel on Android platform
    if (!Capacitor.isNativePlatform()) {
      console.log('Skipping channel creation on web platform');
      return;
    }

    try {
      await LocalNotifications.createChannel({
        id: this.CHANNEL_ID,
        name: 'Daily Advice & Queries',
        description: 'Daily notifications with advice and queries',
        importance: 4, // High importance
        visibility: 1, // Public visibility
        lights: true,
        lightColor: '#B33062',
        vibration: true,
        sound: 'default'
      });
    } catch (error) {
      console.error('Failed to create notification channel:', error);
    }
  }

  /**
   * Schedule daily notifications based on user preferences
   */
  public async scheduleDailyNotifications(): Promise<void> {
    try {
      console.log('🔔 Starting to schedule daily notifications...');
      
      // Check permissions before scheduling
      const permissionStatus = await this.checkAndRequestPermissions();
      if (permissionStatus.display !== 'granted') {
        console.warn('❌ Notification permissions not granted, cannot schedule notifications');
        throw new Error('Notification permissions not granted');
      }
      
      const preferences = await storageService.getPreferences();
      console.log('📋 User preferences:', {
        notificationsEnabled: preferences.notificationsEnabled,
        notificationTime: preferences.notificationTime,
        timezone: preferences.timezone
      });
      
      if (!preferences.notificationsEnabled) {
        console.log('❌ Notifications disabled by user');
        await this.cancelAllNotifications();
        return;
      }

      // Cancel existing notifications
      console.log('🔍 [DEBUG] About to cancel all notifications...');
      const pendingBeforeCancel = await this.getPendingNotifications();
      console.log('🔍 [DEBUG] Pending BEFORE cancel:', pendingBeforeCancel.map(n => ({
        id: n.id,
        scheduled: n.schedule?.at ? new Date(n.schedule.at).toLocaleString() : 'N/A',
        extra: n.extra
      })));
      
      await this.cancelAllNotifications();
      console.log('🧹 Cleared existing notifications');
      
      // Verify cancellation worked
      const pendingAfterCancel = await this.getPendingNotifications();
      console.log('🔍 [DEBUG] Pending AFTER cancel:', pendingAfterCancel.map(n => ({
        id: n.id,
        scheduled: n.schedule?.at ? new Date(n.schedule.at).toLocaleString() : 'N/A',
        extra: n.extra
      })));
      console.log('🔍 [DEBUG] Cancellation verification - Before:', pendingBeforeCancel.length, 'After:', pendingAfterCancel.length);

      const notificationTime = preferences.notificationTime;
      
      if (notificationTime.type === 'fixed' && notificationTime.fixedTime) {
        // Fixed time - schedule one notification that repeats daily
        console.log(`⏰ Fixed notification time: ${notificationTime.fixedTime}`);
        console.log('🔍 [DEBUG] Scheduling FIXED time notification');
        await this.scheduleNotification(notificationTime.fixedTime);
      } else if (notificationTime.type === 'random' && notificationTime.randomStart && notificationTime.randomEnd) {
        // Random time - pre-schedule NOTIFICATION_QUEUE_SIZE days worth of notifications
        console.log(`🎲 Random notification times between ${notificationTime.randomStart} and ${notificationTime.randomEnd}`);
        console.log('🔍 [DEBUG] Scheduling RANDOM time notifications');
        await this.scheduleRandomNotifications(notificationTime.randomStart, notificationTime.randomEnd, this.NOTIFICATION_QUEUE_SIZE);
      } else {
        console.log('❌ No valid notification time configured');
        console.log('🔍 [DEBUG] Invalid notification config:', notificationTime);
        return;
      }

      // Final verification of what was scheduled
      const pendingAfterSchedule = await this.getPendingNotifications();
      console.log('🔍 [DEBUG] Pending AFTER scheduling:', pendingAfterSchedule.map(n => ({
        id: n.id,
        scheduled: n.schedule?.at ? new Date(n.schedule.at).toLocaleString() : 'N/A',
        repeats: n.schedule?.repeats || false,
        extra: n.extra
      })));
      console.log('✅ Daily notifications scheduled successfully');
    } catch (error) {
      console.error('❌ Failed to schedule notifications:', error);
      throw error;
    }
  }


  /**
   * Generate a random time between start and end times
   */
  private generateRandomTime(startTime: string, endTime: string): string {
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    
    if (startMinutes >= endMinutes) {
      return startTime; // Fallback to start time if invalid range
    }

    const randomMinutes = Math.floor(Math.random() * (endMinutes - startMinutes + 1)) + startMinutes;
    return this.minutesToTime(randomMinutes);
  }

  /**
   * Convert time string (HH:MM) to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes since midnight to time string (HH:MM)
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Schedule multiple random notifications for the next N days
   */
  private async scheduleRandomNotifications(startTime: string, endTime: string, days: number): Promise<void> {
    try {
      // Verify permissions are granted before scheduling
      const permissionStatus = await LocalNotifications.checkPermissions();
      if (permissionStatus.display !== 'granted') {
        console.warn('❌ Notification permissions not granted, cannot schedule random notifications');
        throw new Error('Notification permissions not granted');
      }
      
      console.log(`📅 Scheduling ${days} random notifications...`);
      console.log('🔍 [DEBUG] scheduleRandomNotifications() - START', { startTime, endTime, days });
      
      const notifications = [];
      
      for (let i = 0; i < days; i++) {
        const randomTime = this.generateRandomTime(startTime, endTime);
        const [hours, minutes] = randomTime.split(':').map(Number);
        
        // Calculate the date for this notification (starting from tomorrow)
        const notificationDate = new Date();
        notificationDate.setDate(notificationDate.getDate() + i + 1);
        notificationDate.setHours(hours, minutes, 0, 0);
        
        const notificationId = parseInt(`${i + 1}${hours}${minutes}`); // Unique ID for each day
        const scheduledTimeStr = notificationDate.toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        console.log(`🔍 [DEBUG] Random notification ${i + 1}/${days}: ID=${notificationId}, Time=${randomTime}, Date=${notificationDate.toLocaleString()}`);
        
        notifications.push({
          id: notificationId,
          title: 'Daily Advice & Query',
          body: `Scheduled for ${scheduledTimeStr}. Time for stillness? Open the app to see today's a+q`,
          schedule: {
            at: notificationDate,
            repeats: false
          },
          sound: 'default',
          attachments: undefined,
          actionTypeId: '',
          extra: {
            adviceId: 'daily'
          }
        });
      }
      
      // Add a warning notification at the end of the queue
      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() + days + 1);
      warningDate.setHours(9, 0, 0, 0); // 9 AM warning
      
      const warningId = parseInt(`999${warningDate.getHours()}${warningDate.getMinutes()}`);
      notifications.push({
        id: warningId,
        title: 'Advices & Queries',
        body: 'You haven\'t been opening these notifications. We\'re pausing them - open the app to re-enable daily reflections.',
        schedule: {
          at: warningDate,
          repeats: false
        },
        sound: 'default',
        attachments: undefined,
        actionTypeId: '',
        extra: {
          adviceId: 'warning'
        }
      });
      
      // Schedule all notifications at once
      console.log('🔍 [DEBUG] About to schedule', notifications.length, 'notifications with IDs:', notifications.map(n => n.id));
      await LocalNotifications.schedule({
        notifications: notifications
      });
      
      // Verify what was actually scheduled
      const pendingAfterRandom = await this.getPendingNotifications();
      console.log('🔍 [DEBUG] Pending AFTER random scheduling:', pendingAfterRandom.map(n => ({
        id: n.id,
        scheduled: n.schedule?.at ? new Date(n.schedule.at).toLocaleString() : 'N/A',
        extra: n.extra
      })));
      console.log(`✅ Successfully scheduled ${days} random notifications + 1 warning notification`);
    } catch (error) {
      console.error('Failed to schedule random notifications:', error);
    }
  }

  /**
   * Schedule a single notification
   */
  private async scheduleNotification(targetTime: string): Promise<void> {
    try {
      // Verify permissions are granted before scheduling
      const permissionStatus = await LocalNotifications.checkPermissions();
      if (permissionStatus.display !== 'granted') {
        console.warn(`❌ Notification permissions not granted, cannot schedule notification for ${targetTime}`);
        throw new Error('Notification permissions not granted');
      }
      
      console.log(`🔧 Processing target time: ${targetTime}`);
      
      const [hours, minutes] = targetTime.split(':').map(Number);
      console.log(`⏰ Parsed time: ${hours}:${minutes}`);
      
      // Get the next occurrence of this time
      const scheduleDate = this.getNextOccurrence(hours, minutes);
      console.log(`📅 Calculated schedule date:`, scheduleDate);
      
      if (!scheduleDate) {
        console.warn(`❌ Could not schedule notification for ${targetTime}`);
        return;
      }

      // Use a generic message since we can't dynamically update content when app is closed
      const notificationId = parseInt(`${hours}${minutes}`);
      const scheduledTimeStr = scheduleDate.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      const notificationBody = `Scheduled for ${scheduledTimeStr} daily. Time for stillness? Open the app to see today's a+q`;
      
      console.log(`📤 Scheduling notification with ID ${notificationId}:`, {
        title: 'Daily Advice & Query',
        body: notificationBody,
        scheduleDate: scheduleDate,
        repeats: true,
        every: 'day'
      });
      
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId,
            title: 'Daily Advice & Query',
            body: notificationBody,
            schedule: {
              at: scheduleDate,
              repeats: true,
              every: 'day'
            },
            sound: 'default',
            attachments: undefined,
            actionTypeId: '',
            extra: {
              adviceId: 'daily'
            }
          }
        ]
      });
      
      console.log(`✅ Successfully scheduled notification ID ${notificationId}`);
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }

  /**
   * Get the next occurrence of a specific time
   */
  private getNextOccurrence(hours: number, minutes: number): Date | null {
    const now = new Date();
    const targetDate = new Date();
    
    // Set the target time
    targetDate.setHours(hours, minutes, 0, 0);
    
    // If the time has already passed today, schedule for tomorrow
    if (targetDate <= now) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    
    return targetDate;
  }

  /**
   * Cancel all scheduled notifications
   */
  public async cancelAllNotifications(): Promise<void> {
    try {
      console.log('🔍 [DEBUG] cancelAllNotifications() - START');
      // Get all pending notifications first
      const pendingNotifications = await this.getPendingNotifications();
      const notificationIds = pendingNotifications.map(notif => notif.id);
      console.log('🔍 [DEBUG] Cancelling notifications with IDs:', notificationIds);
      
      if (notificationIds.length > 0) {
        // Cancel notifications one by one to avoid the type casting issue
        let successCount = 0;
        let failCount = 0;
        for (const id of notificationIds) {
          try {
            await LocalNotifications.cancel({
              notifications: [{ id }]
            });
            successCount++;
            console.log(`🔍 [DEBUG] Successfully cancelled notification ID ${id}`);
          } catch (error) {
            failCount++;
            console.warn(`🔍 [DEBUG] Failed to cancel notification ${id}:`, error);
          }
        }
        console.log(`🧹 Cancelled ${successCount} notifications, ${failCount} failed`);
        
        // Verify cancellation
        const pendingAfterCancel = await this.getPendingNotifications();
        const remainingIds = pendingAfterCancel.map(n => n.id);
        console.log('🔍 [DEBUG] Verification - Remaining notification IDs:', remainingIds);
        if (remainingIds.length > 0) {
          console.warn(`🔍 [DEBUG] ⚠️ WARNING: ${remainingIds.length} notifications still pending after cancellation!`);
        }
      } else {
        console.log('🧹 No notifications to cancel');
      }
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
    }
  }

  /**
   * Get pending notifications
   */
  public async getPendingNotifications(): Promise<PendingNotification[]> {
    try {
      const result = await LocalNotifications.getPending();
      return result.notifications;
    } catch (error) {
      console.error('Failed to get pending notifications:', error);
      return [];
    }
  }

  /**
   * Get formatted pending notifications for display
   */
  public async getFormattedPendingNotifications(): Promise<Array<{
    id: number;
    scheduledTime: string;
    scheduledDate: Date;
    isWarning: boolean;
    isRepeating: boolean;
    body: string;
    title: string;
  }>> {
    try {
      const pending = await this.getPendingNotifications();
      return pending.map(notif => {
        const scheduleDate = notif.schedule?.at ? new Date(notif.schedule.at) : new Date();
        const isWarning = (notif.extra as { adviceId?: string })?.adviceId === 'warning';
        const isRepeating = notif.schedule?.repeats === true;
        
        return {
          id: notif.id,
          scheduledTime: scheduleDate.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          scheduledDate: scheduleDate,
          isWarning,
          isRepeating,
          body: notif.body || '',
          title: notif.title || ''
        };
      }).sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
    } catch (error) {
      notificationLogger.error('Failed to get formatted pending notifications', error);
      return [];
    }
  }

  /**
   * Debug method to see all scheduled notifications
   */
  public async debugPendingNotifications(): Promise<void> {
    try {
      const pending = await this.getPendingNotifications();
      console.log(`📊 Total pending notifications: ${pending.length}`);
      
      pending.forEach((notif, index) => {
        const scheduleDate = new Date(notif.schedule?.at || '');
        const isWarning = (notif.extra as { adviceId?: string })?.adviceId === 'warning';
        console.log(`${index + 1}. ID: ${notif.id}, Date: ${scheduleDate.toLocaleString()}, Warning: ${isWarning}`);
      });
    } catch (error) {
      console.error('Failed to debug notifications:', error);
    }
  }

  /**
   * Debug method to force reschedule (for testing)
   */
  public async debugForceReschedule(): Promise<void> {
    try {
      notificationLogger.debug('Force rescheduling notifications...');
      await this.cancelAllNotifications();
      
      const preferences = await storageService.getPreferences();
      if (preferences.notificationTime.type === 'random') {
        await this.scheduleRandomNotifications(
          preferences.notificationTime.randomStart!,
          preferences.notificationTime.randomEnd!,
          this.NOTIFICATION_QUEUE_SIZE
        );
      }
      
      await this.debugPendingNotifications();
    } catch (error) {
      notificationLogger.error('Failed to force reschedule', error);
    }
  }

  /**
   * Export notification logs for debugging
   */
  public async exportLogs(): Promise<string> {
    return await notificationLogger.exportLogs();
  }

  /**
   * Get recent notification logs
   */
  public getRecentLogs(count: number = 50): string {
    const logs = notificationLogger.getRecentLogs(count);
    return logs.map(entry => {
      const dataStr = entry.data ? ' ' + JSON.stringify(entry.data, null, 2) : '';
      return `${entry.timestamp} [${entry.level}] ${entry.message}${dataStr}`;
    }).join('\n');
  }

  /**
   * Update notification settings and reschedule
   */
  public async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      console.log('🔍 [DEBUG] updateNotificationSettings() - START', settings);
      
      // Get current preferences before update
      const currentPrefs = await storageService.getPreferences();
      console.log('🔍 [DEBUG] Current preferences BEFORE update:', {
        notificationsEnabled: currentPrefs.notificationsEnabled,
        notificationTime: currentPrefs.notificationTime
      });
      
      // Update preferences
      await storageService.updatePreferences({
        notificationsEnabled: settings.enabled ?? false,
        notificationTime: {
          type: settings.timeType ?? 'fixed',
          fixedTime: settings.fixedTime,
          randomStart: settings.randomStart,
          randomEnd: settings.randomEnd
        }
      });

      // Verify preferences were updated
      const updatedPrefs = await storageService.getPreferences();
      console.log('🔍 [DEBUG] Preferences AFTER update:', {
        notificationsEnabled: updatedPrefs.notificationsEnabled,
        notificationTime: updatedPrefs.notificationTime
      });

      // Reschedule notifications
      console.log('🔍 [DEBUG] Calling scheduleDailyNotifications() from updateNotificationSettings()');
      await this.scheduleDailyNotifications();
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();

