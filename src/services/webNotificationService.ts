/**
 * Web-specific notification service using the browser's native Notification API
 * This provides better web compatibility than Capacitor's local notifications
 */

export interface WebNotificationSettings {
  enabled: boolean;
  timeType: 'fixed' | 'random';
  fixedTime: string; // HH:MM format
  randomStart: string; // HH:MM format
  randomEnd: string; // HH:MM format
}

class WebNotificationService {
  private permissionStatus: NotificationPermission = 'default';

  /**
   * Check if notifications are supported in this browser
   */
  public isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Check current permission status
   */
  public getPermissionStatus(): NotificationPermission {
    return this.permissionStatus;
  }

  /**
   * Request notification permission
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Notifications are not supported in this browser');
    }

    try {
      this.permissionStatus = await Notification.requestPermission();
      return this.permissionStatus;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      this.permissionStatus = 'denied';
      return 'denied';
    }
  }

  /**
   * Check if notifications are enabled
   */
  public async areEnabled(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }
    
    this.permissionStatus = Notification.permission;
    return this.permissionStatus === 'granted';
  }

  /**
   * Show an immediate notification
   */
  public async showNotification(title: string, body: string, options?: NotificationOptions): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Notifications are not supported in this browser');
    }

    if (this.permissionStatus !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: '/icon-512.png',
        badge: '/icon-512.png',
        tag: 'a-q-notification',
        requireInteraction: false,
        ...options
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return Promise.resolve();
    } catch (error) {
      console.error('Failed to show notification:', error);
      throw error;
    }
  }

  /**
   * Schedule a notification for a specific time
   */
  public async scheduleNotification(
    title: string, 
    body: string, 
    scheduleTime: Date,
    options?: NotificationOptions
  ): Promise<void> {
    console.log('📅 scheduleNotification called with:', { title, body, scheduleTime });
    
    if (!this.isSupported()) {
      console.log('❌ Notifications not supported in this browser');
      throw new Error('Notifications are not supported in this browser');
    }

    if (this.permissionStatus !== 'granted') {
      console.log('❌ Notification permission not granted');
      throw new Error('Notification permission not granted');
    }

    const now = new Date();
    const delay = scheduleTime.getTime() - now.getTime();
    console.log(`⏱️ Delay calculated: ${delay}ms (${Math.round(delay / 1000)} seconds)`);

    if (delay <= 0) {
      console.log('⚠️ Schedule time is in the past, showing immediately');
      // Show immediately if time has passed
      return this.showNotification(title, body, options);
    }

    console.log(`✅ Scheduling notification for ${scheduleTime.toLocaleString()} (in ${Math.round(delay / 1000)} seconds)`);
    
    // Schedule for later
    setTimeout(() => {
      console.log('🔔 Timeout triggered, showing notification now');
      this.showNotification(title, body, options).catch(console.error);
    }, delay);
  }

  /**
   * Schedule daily notifications based on user preferences
   * Note: Web browsers have limitations - notifications only work when page is open
   */
  public async scheduleDailyNotifications(
    settings: WebNotificationSettings,
    getDailyAdvice: () => Promise<{ id: string; text?: string; query?: string } | null>
  ): Promise<void> {
    console.log('🔔 Web notification service: scheduleDailyNotifications called');
    console.log('Settings:', settings);
    console.log('Permission status:', this.permissionStatus);
    
    if (!settings.enabled || this.permissionStatus !== 'granted') {
      console.log('❌ Notifications disabled or permission not granted');
      return;
    }

    try {
      // Clear any existing scheduled notifications
      this.clearScheduledNotifications();
      console.log('🧹 Cleared existing scheduled notifications');

      // Get daily advice
      const dailyAdvice = await getDailyAdvice();
      if (!dailyAdvice) {
        console.log('❌ No daily advice available, cannot schedule notification');
        return;
      }
      
      const notificationText = dailyAdvice.text || dailyAdvice.query || 'Daily reflection';
      console.log('📝 Daily advice text:', notificationText);

      // For web, we can only schedule notifications for the current session
      // Schedule the next notification based on current time and settings
      const nextNotificationTime = this.getNextNotificationTime(settings);
      console.log('⏰ Next notification time calculated:', nextNotificationTime);
      
      if (nextNotificationTime) {
        await this.scheduleNotification(
          'Daily Advice & Query',
          notificationText,
          nextNotificationTime
        );
        
        console.log(`✅ Next notification scheduled for: ${nextNotificationTime.toLocaleString()}`);
        console.log('ℹ️ Note: Web notifications only work when the page is open');
      } else {
        console.log('❌ Could not calculate next notification time');
      }

    } catch (error) {
      console.error('❌ Failed to schedule daily notifications:', error);
    }
  }

  /**
   * Get the next notification time based on current time and settings
   */
  private getNextNotificationTime(settings: WebNotificationSettings): Date | null {
    const now = new Date();
    
    let targetTime: string;
    
    if (settings.timeType === 'fixed' && settings.fixedTime) {
      targetTime = settings.fixedTime;
    } else if (settings.timeType === 'random' && settings.randomStart && settings.randomEnd) {
      targetTime = this.generateRandomTime(settings.randomStart, settings.randomEnd);
    } else {
      return null;
    }
    
    // Parse target time
    const [targetHours, targetMinutes] = targetTime.split(':').map(Number);
    const targetDate = new Date();
    targetDate.setHours(targetHours, targetMinutes, 0, 0);
    
    // If target time has passed today, schedule for tomorrow
    if (targetDate <= now) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    
    return targetDate;
  }


  /**
   * Generate a random time between start and end times
   */
  private generateRandomTime(startTime: string, endTime: string): string {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (startMinutes >= endMinutes) {
      return startTime; // Fallback to start time if invalid range
    }

    const randomMinutes = Math.floor(Math.random() * (endMinutes - startMinutes + 1)) + startMinutes;
    const hours = Math.floor(randomMinutes / 60);
    const mins = randomMinutes % 60;
    
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }


  /**
   * Clear all scheduled notifications (web doesn't have persistent scheduling)
   */
  public clearScheduledNotifications(): void {
    // Web notifications don't persist across page reloads
    // This is a limitation of the web platform
    console.log('Scheduled notifications cleared (web limitation: they don\'t persist across page reloads)');
  }

  /**
   * Test notification
   */
  public async sendTestNotification(): Promise<void> {
    await this.showNotification(
      'Test Notification',
      'This is a test notification from Advices & Queries!'
    );
  }
}

export const webNotificationService = new WebNotificationService();
