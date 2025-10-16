import { describe, it, expect, beforeEach, vi } from 'vitest';
import { adviceService } from '../adviceService';
import { storageService } from '../storageService';

// Mock the storage service
vi.mock('../storageService', () => ({
  storageService: {
    getPreferences: vi.fn(),
    addShownAdvice: vi.fn(),
    updateLastViewedDate: vi.fn(),
    resetShownAdvices: vi.fn(),
    getCurrentDailyAdvice: vi.fn(),
    isDailyAdviceForToday: vi.fn(),
    setDailyAdvice: vi.fn(),
    updatePreferences: vi.fn(),
    getCurrentDateInTimezone: vi.fn(),
  },
}));

describe('AdviceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllAdvices', () => {
    it('should return all advices for NZ', async () => {
      const advices = await adviceService.getAllAdvices('nz');
      expect(advices).toBeDefined();
      expect(advices.length).toBeGreaterThan(0);
      expect(advices[0]).toHaveProperty('id');
    });

    it('should return all advices for UK', async () => {
      const advices = await adviceService.getAllAdvices('uk');
      expect(advices).toBeDefined();
      expect(advices.length).toBe(42); // UK data now has 42 advices
    });
  });

  describe('getSections', () => {
    it('should return sections for NZ', async () => {
      const sections = await adviceService.getSections('nz');
      expect(sections).toBeDefined();
      expect(sections.length).toBe(5); // A, B, C, D, E
      expect(sections[0]).toHaveProperty('id', 'A');
      expect(sections[0]).toHaveProperty('title', 'God and ourselves');
    });
  });

  describe('getDailyAdvice', () => {
    it('should return a random advice when no daily advice cached', async () => {
      vi.mocked(storageService.getPreferences).mockResolvedValue({
        selectedCountry: 'nz',
        notificationsEnabled: false,
        notificationTime: { type: 'fixed', fixedTime: '08:00' },
        disabledAdvices: [],
        lastViewedDate: '',
        shownAdvices: [],
        timezone: 'Pacific/Auckland',
        dailyAdvice: null,
      });

      vi.mocked(storageService.getCurrentDailyAdvice).mockResolvedValue(null);
      vi.mocked(storageService.isDailyAdviceForToday).mockReturnValue(false);
      vi.mocked(storageService.getCurrentDateInTimezone).mockReturnValue('2025-10-16');

      const advice = await adviceService.getDailyAdvice();
      expect(advice).toBeDefined();
      expect(advice).toHaveProperty('id');
      expect(storageService.setDailyAdvice).toHaveBeenCalledWith(advice!.id, 'Pacific/Auckland');
    });

    it('should reset cycle when all advices have been shown', async () => {
      const allAdvices = await adviceService.getAllAdvices('nz');
      const allAdviceIds = allAdvices.map(a => a.id);

      vi.mocked(storageService.getPreferences).mockResolvedValue({
        selectedCountry: 'nz',
        notificationsEnabled: false,
        notificationTime: { type: 'fixed', fixedTime: '08:00' },
        disabledAdvices: [],
        lastViewedDate: '',
        shownAdvices: allAdviceIds,
        timezone: 'Pacific/Auckland',
        dailyAdvice: null,
      });

      vi.mocked(storageService.getCurrentDailyAdvice).mockResolvedValue(null);
      vi.mocked(storageService.isDailyAdviceForToday).mockReturnValue(false);
      vi.mocked(storageService.getCurrentDateInTimezone).mockReturnValue('2025-10-16');

      const advice = await adviceService.getDailyAdvice();
      expect(advice).toBeDefined();
      expect(storageService.resetShownAdvices).toHaveBeenCalled();
    });

    it('should filter out disabled advices', async () => {
      const allAdvices = await adviceService.getAllAdvices('nz');
      const firstAdviceId = allAdvices[0].id;

      vi.mocked(storageService.getPreferences).mockResolvedValue({
        selectedCountry: 'nz',
        notificationsEnabled: false,
        notificationTime: { type: 'fixed', fixedTime: '08:00' },
        disabledAdvices: [firstAdviceId],
        lastViewedDate: '',
        shownAdvices: [],
        timezone: 'Pacific/Auckland',
        dailyAdvice: null,
      });

      vi.mocked(storageService.getCurrentDailyAdvice).mockResolvedValue(null);
      vi.mocked(storageService.isDailyAdviceForToday).mockReturnValue(false);
      vi.mocked(storageService.getCurrentDateInTimezone).mockReturnValue('2025-10-16');

      const advice = await adviceService.getDailyAdvice();
      expect(advice).toBeDefined();
      expect(advice!.id).not.toBe(firstAdviceId);
    });

    it('should return cached daily advice when available for today', async () => {
      const cachedAdvice = { adviceId: 'A1', date: '2025-10-16' };

      vi.mocked(storageService.getPreferences).mockResolvedValue({
        selectedCountry: 'nz',
        notificationsEnabled: false,
        notificationTime: { type: 'fixed', fixedTime: '08:00' },
        disabledAdvices: [],
        lastViewedDate: '',
        shownAdvices: [],
        timezone: 'Pacific/Auckland',
        dailyAdvice: cachedAdvice,
      });

      vi.mocked(storageService.getCurrentDailyAdvice).mockResolvedValue(cachedAdvice);
      vi.mocked(storageService.isDailyAdviceForToday).mockReturnValue(true);

      const advice = await adviceService.getDailyAdvice();
      expect(advice).toBeDefined();
      expect(advice!.id).toBe('A1');
      // Should not call setDailyAdvice since it's already cached
      expect(storageService.setDailyAdvice).not.toHaveBeenCalled();
    });
  });

  describe('searchAdvices', () => {
    it('should find advices by text content', async () => {
      const results = await adviceService.searchAdvices('love', 'nz');
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(advice => 
        advice.text?.toLowerCase().includes('love') || 
        advice.query?.toLowerCase().includes('love')
      )).toBe(true);
    });

    it('should return empty array for no matches', async () => {
      const results = await adviceService.searchAdvices('nonexistent', 'nz');
      expect(results).toEqual([]);
    });
  });

  describe('getAdviceById', () => {
    it('should return advice by ID', async () => {
      const advice = await adviceService.getAdviceById('A1', 'nz');
      expect(advice).toBeDefined();
      expect(advice!.id).toBe('A1');
    });

    it('should return null for non-existent ID', async () => {
      const advice = await adviceService.getAdviceById('Z999', 'nz');
      expect(advice).toBeNull();
    });
  });

  describe('getAdviceStats', () => {
    it('should return correct statistics', async () => {
      vi.mocked(storageService.getPreferences).mockResolvedValue({
        selectedCountry: 'nz',
        notificationsEnabled: false,
        notificationTime: { type: 'fixed', fixedTime: '08:00' },
        disabledAdvices: ['A1', 'A2'],
        lastViewedDate: '',
        shownAdvices: ['A1', 'A3'],
        timezone: 'Pacific/Auckland',
        dailyAdvice: null,
      });

      const stats = await adviceService.getAdviceStats('nz');
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.disabled).toBe(2);
      expect(stats.available).toBe(stats.total - 2);
      expect(stats.shown).toBe(2);
    });
  });

  describe('getCountryName', () => {
    it('should return correct country names', () => {
      expect(adviceService.getCountryName('nz')).toBe('New Zealand');
      expect(adviceService.getCountryName('uk')).toBe('United Kingdom');
    });
  });

  describe('getAvailableCountries', () => {
    it('should return available countries', () => {
      const countries = adviceService.getAvailableCountries();
      expect(countries).toHaveLength(2);
      expect(countries[0]).toEqual({ id: 'nz', name: 'New Zealand' });
      expect(countries[1]).toEqual({ id: 'uk', name: 'United Kingdom' });
    });
  });
});
