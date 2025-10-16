import { Preferences } from '@capacitor/preferences';

export interface UserPreferences {
  selectedCountry: 'nz' | 'uk';
  notificationsEnabled: boolean;
  notificationTime: {
    type: 'fixed' | 'random';
    fixedTime?: string; // HH:MM format
    randomStart?: string; // HH:MM format
    randomEnd?: string; // HH:MM format
  };
  disabledAdvices: string[]; // Array of advice IDs that are disabled
  lastViewedDate: string; // YYYY-MM-DD format
  shownAdvices: string[]; // Array of advice IDs shown in current cycle
  timezone: string; // User's timezone (e.g., 'Pacific/Auckland', 'Europe/London')
  dailyAdvice: {
    adviceId: string;
    date: string; // YYYY-MM-DD format in user's timezone
  } | null; // Current day's advice
}

const DEFAULT_PREFERENCES: UserPreferences = {
  selectedCountry: 'nz',
  notificationsEnabled: false,
  notificationTime: {
    type: 'fixed',
    fixedTime: '08:00',
  },
  disabledAdvices: [],
  lastViewedDate: '',
  shownAdvices: [],
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Auto-detect user's timezone
  dailyAdvice: null,
};

export class StorageService {
  private static instance: StorageService;
  private preferences: UserPreferences | null = null;

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  public async initialize(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: 'userPreferences' });
      if (value) {
        this.preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(value) };
      } else {
        this.preferences = { ...DEFAULT_PREFERENCES };
        await this.savePreferences();
      }
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      this.preferences = { ...DEFAULT_PREFERENCES };
    }
  }

  public async getPreferences(): Promise<UserPreferences> {
    if (!this.preferences) {
      await this.initialize();
    }
    return this.preferences!;
  }

  public async updatePreferences(updates: Partial<UserPreferences>): Promise<void> {
    if (!this.preferences) {
      await this.initialize();
    }
    
    this.preferences = { ...this.preferences!, ...updates };
    await this.savePreferences();
  }

  public async setCountry(country: 'nz' | 'uk'): Promise<void> {
    await this.updatePreferences({ 
      selectedCountry: country,
      dailyAdvice: null // Clear daily advice when country changes
    });
    // Mark that the user has completed the initial setup
    await Preferences.set({
      key: 'hasCompletedSetup',
      value: 'true'
    });
  }

  public async setNotificationsEnabled(enabled: boolean): Promise<void> {
    await this.updatePreferences({ notificationsEnabled: enabled });
  }

  public async updateNotificationSettings(settings: UserPreferences['notificationTime']): Promise<void> {
    await this.updatePreferences({ notificationTime: settings });
  }

  public async disableAdvice(adviceId: string): Promise<void> {
    if (!this.preferences) {
      await this.initialize();
    }
    
    const disabledAdvices = [...this.preferences!.disabledAdvices];
    if (!disabledAdvices.includes(adviceId)) {
      disabledAdvices.push(adviceId);
      await this.updatePreferences({ disabledAdvices });
    }
  }

  public async enableAdvice(adviceId: string): Promise<void> {
    if (!this.preferences) {
      await this.initialize();
    }
    
    const disabledAdvices = this.preferences!.disabledAdvices.filter(id => id !== adviceId);
    await this.updatePreferences({ disabledAdvices });
  }

  public async addShownAdvice(adviceId: string): Promise<void> {
    if (!this.preferences) {
      await this.initialize();
    }
    
    const shownAdvices = [...this.preferences!.shownAdvices];
    if (!shownAdvices.includes(adviceId)) {
      shownAdvices.push(adviceId);
      await this.updatePreferences({ shownAdvices });
    }
  }

  public async resetShownAdvices(): Promise<void> {
    await this.updatePreferences({ shownAdvices: [] });
  }

  public async updateLastViewedDate(date: string): Promise<void> {
    await this.updatePreferences({ lastViewedDate: date });
  }

  public async isFirstLaunch(): Promise<boolean> {
    // Check if this is truly the first launch (no country selected yet)
    // We'll use a special key to track if the user has completed the initial setup
    const { value } = await Preferences.get({ key: 'hasCompletedSetup' });
    return !value;
  }

  // Helper method to get current date in user's timezone
  public getCurrentDateInTimezone(timezone: string): string {
    const now = new Date();
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);
  }

  // Helper method to check if daily advice is for today
  public isDailyAdviceForToday(dailyAdvice: { adviceId: string; date: string } | null, timezone: string): boolean {
    if (!dailyAdvice) return false;
    const today = this.getCurrentDateInTimezone(timezone);
    return dailyAdvice.date === today;
  }

  // Method to set daily advice
  public async setDailyAdvice(adviceId: string, timezone: string): Promise<void> {
    const today = this.getCurrentDateInTimezone(timezone);
    await this.updatePreferences({
      dailyAdvice: {
        adviceId,
        date: today
      }
    });
  }

  // Method to get current daily advice
  public async getCurrentDailyAdvice(): Promise<{ adviceId: string; date: string } | null> {
    const prefs = await this.getPreferences();
    return prefs.dailyAdvice;
  }

  private async savePreferences(): Promise<void> {
    if (!this.preferences) return;
    
    try {
      await Preferences.set({
        key: 'userPreferences',
        value: JSON.stringify(this.preferences),
      });
    } catch (error) {
      console.error('Failed to save preferences:', error);
      throw error;
    }
  }
}

export const storageService = StorageService.getInstance();
