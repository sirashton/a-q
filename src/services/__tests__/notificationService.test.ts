import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationService } from '../notificationService';
import { storageService } from '../storageService';
import { adviceService } from '../adviceService';

// Mock the Capacitor Local Notifications plugin
vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    createChannel: vi.fn().mockResolvedValue(undefined),
    checkPermissions: vi.fn().mockResolvedValue({ display: 'granted' }),
    requestPermissions: vi.fn().mockResolvedValue({ display: 'granted' }),
    areEnabled: vi.fn().mockResolvedValue({ value: true }),
    schedule: vi.fn().mockResolvedValue(undefined),
    cancel: vi.fn().mockResolvedValue(undefined),
    getPending: vi.fn().mockResolvedValue({ notifications: [] })
  }
}));

// Mock the storage service
vi.mock('../storageService', () => ({
  storageService: {
    getPreferences: vi.fn(),
    updatePreferences: vi.fn()
  }
}));

// Mock the advice service
vi.mock('../adviceService', () => ({
  adviceService: {
    getDailyAdvice: vi.fn()
  }
}));

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize without errors', async () => {
      await expect(notificationService.initialize()).resolves.not.toThrow();
    });
  });

  describe('areEnabled', () => {
    it('should return true when notifications are enabled', async () => {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      vi.mocked(LocalNotifications.areEnabled).mockResolvedValue({ value: true });

      const result = await notificationService.areEnabled();
      expect(result).toBe(true);
    });

    it('should return false when notifications are disabled', async () => {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      vi.mocked(LocalNotifications.areEnabled).mockResolvedValue({ value: false });

      const result = await notificationService.areEnabled();
      expect(result).toBe(false);
    });
  });

  describe('checkAndRequestPermissions', () => {
    it('should return granted status when permissions are already granted', async () => {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      vi.mocked(LocalNotifications.checkPermissions).mockResolvedValue({ display: 'granted' });

      const result = await notificationService.checkAndRequestPermissions();
      expect(result.display).toBe('granted');
      expect(LocalNotifications.requestPermissions).not.toHaveBeenCalled();
    });

    it('should request permissions when status is prompt', async () => {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      vi.mocked(LocalNotifications.checkPermissions).mockResolvedValue({ display: 'prompt' });
      vi.mocked(LocalNotifications.requestPermissions).mockResolvedValue({ display: 'granted' });

      const result = await notificationService.checkAndRequestPermissions();
      expect(result.display).toBe('granted');
      expect(LocalNotifications.requestPermissions).toHaveBeenCalled();
    });
  });

  describe('scheduleDailyNotifications', () => {
    it('should cancel notifications when disabled', async () => {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      vi.mocked(storageService.getPreferences).mockResolvedValue({
        selectedCountry: 'nz',
        notificationsEnabled: false,
        notificationTime: { type: 'fixed', fixedTime: '08:00' },
        disabledAdvices: [],
        lastViewedDate: '',
        shownAdvices: [],
        timezone: 'Pacific/Auckland',
        dailyAdvice: null
      });

      await notificationService.scheduleDailyNotifications();
      expect(LocalNotifications.cancel).toHaveBeenCalled();
    });

    it('should schedule notifications when enabled with fixed time', async () => {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      vi.mocked(storageService.getPreferences).mockResolvedValue({
        selectedCountry: 'nz',
        notificationsEnabled: true,
        notificationTime: { type: 'fixed', fixedTime: '08:00' },
        disabledAdvices: [],
        lastViewedDate: '',
        shownAdvices: [],
        timezone: 'Pacific/Auckland',
        dailyAdvice: null
      });
      vi.mocked(adviceService.getDailyAdvice).mockResolvedValue({
        id: 'A1',
        text: 'Test advice',
      });

      await notificationService.scheduleDailyNotifications();
      expect(LocalNotifications.schedule).toHaveBeenCalled();
    });

    it('should schedule notifications when enabled with random time', async () => {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      vi.mocked(storageService.getPreferences).mockResolvedValue({
        selectedCountry: 'nz',
        notificationsEnabled: true,
        notificationTime: { 
          type: 'random', 
          randomStart: '07:00', 
          randomEnd: '09:00' 
        },
        disabledAdvices: [],
        lastViewedDate: '',
        shownAdvices: [],
        timezone: 'Pacific/Auckland',
        dailyAdvice: null
      });
      vi.mocked(adviceService.getDailyAdvice).mockResolvedValue({
        id: 'A1',
        text: 'Test advice',
      });

      await notificationService.scheduleDailyNotifications();
      expect(LocalNotifications.schedule).toHaveBeenCalled();
    });
  });

  describe('cancelAllNotifications', () => {
    it('should cancel all notifications', async () => {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      
      await notificationService.cancelAllNotifications();
      expect(LocalNotifications.cancel).toHaveBeenCalledWith({
        notifications: []
      });
    });
  });

  describe('getPendingNotifications', () => {
    it('should return pending notifications', async () => {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const mockNotifications = [{ id: 1, title: 'Test', body: 'Test body' }];
      vi.mocked(LocalNotifications.getPending).mockResolvedValue({
        notifications: mockNotifications
      });

      const result = await notificationService.getPendingNotifications();
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('updateNotificationSettings', () => {
    it('should update settings and reschedule notifications', async () => {
      const mockSettings = {
        enabled: true,
        timeType: 'fixed' as const,
        fixedTime: '09:00'
      };

      vi.mocked(storageService.updatePreferences).mockResolvedValue(undefined);
      vi.mocked(storageService.getPreferences).mockResolvedValue({
        selectedCountry: 'nz',
        notificationsEnabled: true,
        notificationTime: { type: 'fixed', fixedTime: '09:00' },
        disabledAdvices: [],
        lastViewedDate: '',
        shownAdvices: [],
        timezone: 'Pacific/Auckland',
        dailyAdvice: null
      });
      vi.mocked(adviceService.getDailyAdvice).mockResolvedValue({
        id: 'A1',
        text: 'Test advice',
      });

      await notificationService.updateNotificationSettings(mockSettings);
      expect(storageService.updatePreferences).toHaveBeenCalled();
    });
  });
});
