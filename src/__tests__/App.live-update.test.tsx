import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';

// Mock the Live Update modules
vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn(),
    removeAllListeners: vi.fn(),
  },
}));

vi.mock('@capawesome/capacitor-live-update', () => ({
  LiveUpdate: {
    sync: vi.fn(),
    reload: vi.fn(),
  },
}));

vi.mock('../services/storageService', () => ({
  storageService: {
    initialize: vi.fn().mockResolvedValue(undefined),
    getPreferences: vi.fn().mockResolvedValue({
      selectedCountry: 'nz',
      notificationsEnabled: false,
      disabledAdvices: [],
      timezone: 'UTC',
      dailyAdvice: null,
    }),
    isFirstLaunch: vi.fn().mockResolvedValue(false),
  },
}));

vi.mock('../services/notificationService', () => ({
  notificationService: {
    initialize: vi.fn().mockResolvedValue(undefined),
    checkAndTopUpNotifications: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../services/safeAreaService', () => ({
  safeAreaService: {
    initialize: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('App - Live Update Integration', () => {
  let App: typeof import('../App').default;
  let CapacitorApp: typeof import('@capacitor/app').App;
  let LIVE_UPDATE_ENABLED: boolean;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Dynamically import to get fresh module state
    const appModule = await import('../App');
    App = appModule.default;
    CapacitorApp = (await import('@capacitor/app')).App;
    const configModule = await import('../../config/live-update');
    LIVE_UPDATE_ENABLED = configModule.LIVE_UPDATE_ENABLED;
  });

  it('should conditionally register LiveUpdate listener based on flag', async () => {
    render(<App />);

    await waitFor(() => {
      if (LIVE_UPDATE_ENABLED) {
        expect(CapacitorApp.addListener).toHaveBeenCalledWith(
          'resume',
          expect.any(Function)
        );
      } else {
        expect(CapacitorApp.addListener).not.toHaveBeenCalled();
      }
    });
  });

  it('should not register listener when LIVE_UPDATE_ENABLED is false', async () => {
    // This test verifies the default disabled state
    if (!LIVE_UPDATE_ENABLED) {
      render(<App />);
      
      await waitFor(() => {
        expect(CapacitorApp.addListener).not.toHaveBeenCalled();
      });
    }
  });
});

