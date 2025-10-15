import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Preferences } from '@capacitor/preferences';
import { storageService } from '../storageService';

// Mock Capacitor Preferences
vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

describe('StorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize with default preferences when no stored data', async () => {
      vi.mocked(Preferences.get).mockResolvedValue({ value: null });
      vi.mocked(Preferences.set).mockResolvedValue();

      await storageService.initialize();
      const prefs = await storageService.getPreferences();

      expect(prefs.selectedCountry).toBe('nz');
      expect(prefs.notificationsEnabled).toBe(false);
      expect(prefs.disabledAdvices).toEqual([]);
      expect(prefs.timezone).toBeDefined();
      expect(prefs.dailyAdvice).toBeNull();
      expect(Preferences.set).toHaveBeenCalled();
    });

    it('should load existing preferences when available', async () => {
      const existingPrefs = {
        selectedCountry: 'uk',
        notificationsEnabled: true,
        disabledAdvices: ['A1'],
        lastViewedDate: '2024-01-01',
        shownAdvices: ['A1', 'A2'],
        notificationTime: {
          type: 'fixed' as const,
          fixedTime: '09:00',
        },
      };

      vi.mocked(Preferences.get).mockResolvedValue({ 
        value: JSON.stringify(existingPrefs) 
      });

      await storageService.initialize();
      const prefs = await storageService.getPreferences();

      expect(prefs.selectedCountry).toBe('uk');
      expect(prefs.notificationsEnabled).toBe(true);
      expect(prefs.disabledAdvices).toEqual(['A1']);
    });
  });

  describe('updatePreferences', () => {
    it('should update preferences and save them', async () => {
      vi.mocked(Preferences.get).mockResolvedValue({ value: null });
      vi.mocked(Preferences.set).mockResolvedValue();

      await storageService.initialize();
      await storageService.updatePreferences({ 
        selectedCountry: 'uk',
        notificationsEnabled: true 
      });

      const prefs = await storageService.getPreferences();
      expect(prefs.selectedCountry).toBe('uk');
      expect(prefs.notificationsEnabled).toBe(true);
      expect(Preferences.set).toHaveBeenCalledTimes(2); // Once for init, once for update
    });
  });

  describe('setCountry', () => {
    it('should update selected country', async () => {
      vi.mocked(Preferences.get).mockResolvedValue({ value: null });
      vi.mocked(Preferences.set).mockResolvedValue();

      await storageService.initialize();
      await storageService.setCountry('uk');

      const prefs = await storageService.getPreferences();
      expect(prefs.selectedCountry).toBe('uk');
    });
  });

  describe('setNotificationsEnabled', () => {
    it('should update notification setting', async () => {
      vi.mocked(Preferences.get).mockResolvedValue({ value: null });
      vi.mocked(Preferences.set).mockResolvedValue();

      await storageService.initialize();
      await storageService.setNotificationsEnabled(true);

      const prefs = await storageService.getPreferences();
      expect(prefs.notificationsEnabled).toBe(true);
    });
  });

  describe('disableAdvice', () => {
    it('should add advice to disabled list', async () => {
      vi.mocked(Preferences.get).mockResolvedValue({ value: null });
      vi.mocked(Preferences.set).mockResolvedValue();

      await storageService.initialize();
      await storageService.disableAdvice('A1');

      const prefs = await storageService.getPreferences();
      expect(prefs.disabledAdvices).toContain('A1');
    });

    it('should not add duplicate advice to disabled list', async () => {
      vi.mocked(Preferences.get).mockResolvedValue({ 
        value: JSON.stringify({
          selectedCountry: 'nz',
          notificationsEnabled: false,
          notificationTime: { type: 'fixed', fixedTime: '08:00' },
          disabledAdvices: ['A1'],
          lastViewedDate: '',
          shownAdvices: [],
        })
      });
      vi.mocked(Preferences.set).mockResolvedValue();

      await storageService.initialize();
      await storageService.disableAdvice('A1');

      const prefs = await storageService.getPreferences();
      expect(prefs.disabledAdvices).toEqual(['A1']); // Should not duplicate
    });
  });

  describe('enableAdvice', () => {
    it('should remove advice from disabled list', async () => {
      vi.mocked(Preferences.get).mockResolvedValue({ 
        value: JSON.stringify({
          selectedCountry: 'nz',
          notificationsEnabled: false,
          notificationTime: { type: 'fixed', fixedTime: '08:00' },
          disabledAdvices: ['A1', 'A2'],
          lastViewedDate: '',
          shownAdvices: [],
        })
      });
      vi.mocked(Preferences.set).mockResolvedValue();

      await storageService.initialize();
      await storageService.enableAdvice('A1');

      const prefs = await storageService.getPreferences();
      expect(prefs.disabledAdvices).toEqual(['A2']);
    });
  });

  describe('addShownAdvice', () => {
    it('should add advice to shown list', async () => {
      vi.mocked(Preferences.get).mockResolvedValue({ value: null });
      vi.mocked(Preferences.set).mockResolvedValue();

      await storageService.initialize();
      await storageService.addShownAdvice('A1');

      const prefs = await storageService.getPreferences();
      expect(prefs.shownAdvices).toContain('A1');
    });
  });

  describe('resetShownAdvices', () => {
    it('should clear shown advices list', async () => {
      vi.mocked(Preferences.get).mockResolvedValue({ 
        value: JSON.stringify({
          selectedCountry: 'nz',
          notificationsEnabled: false,
          notificationTime: { type: 'fixed', fixedTime: '08:00' },
          disabledAdvices: [],
          lastViewedDate: '',
          shownAdvices: ['A1', 'A2'],
        })
      });
      vi.mocked(Preferences.set).mockResolvedValue();

      await storageService.initialize();
      await storageService.resetShownAdvices();

      const prefs = await storageService.getPreferences();
      expect(prefs.shownAdvices).toEqual([]);
    });
  });

  describe('isFirstLaunch', () => {
    it('should return true for first launch', async () => {
      vi.mocked(Preferences.get).mockResolvedValue({ value: null });
      vi.mocked(Preferences.set).mockResolvedValue();

      await storageService.initialize();
      const isFirst = await storageService.isFirstLaunch();
      expect(isFirst).toBe(true);
    });

    it('should return false for subsequent launches', async () => {
      vi.mocked(Preferences.get).mockResolvedValue({ 
        value: JSON.stringify({
          selectedCountry: 'nz',
          notificationsEnabled: false,
          notificationTime: { type: 'fixed', fixedTime: '08:00' },
          disabledAdvices: [],
          lastViewedDate: '2024-01-01',
          shownAdvices: [],
        })
      });

      await storageService.initialize();
      const isFirst = await storageService.isFirstLaunch();
      expect(isFirst).toBe(false);
    });
  });
});
