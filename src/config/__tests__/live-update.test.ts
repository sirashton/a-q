import { describe, it, expect } from 'vitest';
import { LIVE_UPDATE_ENABLED } from '../../../config/live-update';

describe('Live Update Config', () => {
  it('should export LIVE_UPDATE_ENABLED as a boolean', () => {
    expect(typeof LIVE_UPDATE_ENABLED).toBe('boolean');
  });

  it('should have LIVE_UPDATE_ENABLED defined', () => {
    expect(LIVE_UPDATE_ENABLED).toBeDefined();
  });
});

