import { LocalNotifications, PermissionStatus } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { storageService } from './storageService';
import { adviceService } from './adviceService';

export interface NotificationSettings {
  enabled: boolean;
  timeType: 'fixed' | 'random';
  fixedTime: string; // HH:MM format
  randomStart: string; // HH:MM format
  randomEnd: string; // HH:MM format
  daysOfWeek: number[]; // 1-7 (Sunday = 1)
}

export interface NotificationTime {
  type: 'fixed' | 'random';
  fixedTime?: string;
  randomStart?: string;
  randomEnd?: string;
}

class NotificationService {
  private readonly CHANNEL_ID = 'daily-advice-channel';

  /**
   * Initialize the notification service
   */
  public async initialize(): Promise<void> {
    try {
      // Create notification channel for Android
      await this.createNotificationChannel();
      
      // Check and request permissions
      await this.checkAndRequestPermissions();
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
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
      const preferences = await storageService.getPreferences();
      
      if (!preferences.notificationsEnabled) {
        await this.cancelAllNotifications();
        return;
      }

      // Cancel existing notifications
      await this.cancelAllNotifications();

      const notificationTime = preferences.notificationTime;
      const timeSlots = this.calculateTimeSlots(notificationTime);

      // Schedule notifications for each day of the week
      for (const timeSlot of timeSlots) {
        await this.scheduleNotification(timeSlot);
      }

      console.log('Daily notifications scheduled successfully');
    } catch (error) {
      console.error('Failed to schedule notifications:', error);
      throw error;
    }
  }

  /**
   * Calculate time slots for notifications based on user preferences
   */
  private calculateTimeSlots(notificationTime: NotificationTime): Array<{ time: string; dayOfWeek: number }> {
    const timeSlots: Array<{ time: string; dayOfWeek: number }> = [];
    
    // For now, schedule for all days of the week (1-7, Sunday = 1)
    const daysOfWeek = [1, 2, 3, 4, 5, 6, 7];

    if (notificationTime.type === 'fixed' && notificationTime.fixedTime) {
      // Fixed time for all days
      for (const day of daysOfWeek) {
        timeSlots.push({ time: notificationTime.fixedTime, dayOfWeek: day });
      }
    } else if (notificationTime.type === 'random' && notificationTime.randomStart && notificationTime.randomEnd) {
      // Random time for each day
      for (const day of daysOfWeek) {
        const randomTime = this.generateRandomTime(notificationTime.randomStart, notificationTime.randomEnd);
        timeSlots.push({ time: randomTime, dayOfWeek: day });
      }
    }

    return timeSlots;
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
   * Schedule a single notification
   */
  private async scheduleNotification(timeSlot: { time: string; dayOfWeek: number }): Promise<void> {
    try {
      const [hours, minutes] = timeSlot.time.split(':').map(Number);
      
      // Get the next occurrence of this day and time
      const scheduleDate = this.getNextOccurrence(timeSlot.dayOfWeek, hours, minutes);
      
      if (!scheduleDate) {
        console.warn(`Could not schedule notification for day ${timeSlot.dayOfWeek} at ${timeSlot.time}`);
        return;
      }

      // Get the daily advice for the notification
      const dailyAdvice = await adviceService.getDailyAdvice();
      
      if (!dailyAdvice) {
        console.warn('No daily advice available for notification');
        return;
      }
      
      await LocalNotifications.schedule({
        notifications: [
          {
            id: parseInt(`${timeSlot.dayOfWeek}${hours}${minutes}`), // Unique ID based on day and time
            title: 'Daily Advice & Query',
            body: dailyAdvice.text || dailyAdvice.query || 'Daily reflection',
            schedule: {
              at: scheduleDate,
              repeats: true,
              every: 'week'
            },
            sound: 'default',
            attachments: undefined,
            actionTypeId: '',
            extra: {
              adviceId: dailyAdvice.id
            }
          }
        ]
      });
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }

  /**
   * Get the next occurrence of a specific day and time
   */
  private getNextOccurrence(dayOfWeek: number, hours: number, minutes: number): Date | null {
    const now = new Date();
    const targetDate = new Date();
    
    // Set the target time
    targetDate.setHours(hours, minutes, 0, 0);
    
    // Calculate days until the target day of week
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const targetDay = dayOfWeek === 7 ? 0 : dayOfWeek; // Convert Sunday from 7 to 0
    
    let daysUntilTarget = targetDay - currentDay;
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7; // Next week
    }
    
    // If it's the same day but time has passed, schedule for next week
    if (daysUntilTarget === 7 && targetDate <= now) {
      daysUntilTarget = 7;
    }
    
    targetDate.setDate(now.getDate() + daysUntilTarget);
    
    return targetDate;
  }

  /**
   * Cancel all scheduled notifications
   */
  public async cancelAllNotifications(): Promise<void> {
    try {
      await LocalNotifications.cancel({
        notifications: []
      });
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
    }
  }

  /**
   * Get pending notifications
   */
  public async getPendingNotifications(): Promise<any[]> {
    try {
      const result = await LocalNotifications.getPending();
      return result.notifications;
    } catch (error) {
      console.error('Failed to get pending notifications:', error);
      return [];
    }
  }

  /**
   * Update notification settings and reschedule
   */
  public async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
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

      // Reschedule notifications
      await this.scheduleDailyNotifications();
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
