import { SafeArea } from 'capacitor-plugin-safe-area';

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

class SafeAreaService {
  private insets: SafeAreaInsets = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  };

  /**
   * Initialize the safe area service and set up CSS variables
   */
  public async initialize(): Promise<void> {
    try {
      // Get initial safe area insets
      await this.updateSafeAreaInsets();
      
      // Listen for changes (e.g., orientation changes)
      SafeArea.addListener('safeAreaChanged', ({ insets }) => {
        this.insets = insets;
        this.setCSSVariables();
      });
      
      console.log('✅ Safe area service initialized');
    } catch (error) {
      console.error('Failed to initialize safe area service:', error);
    }
  }

  /**
   * Update safe area insets from the plugin
   */
  private async updateSafeAreaInsets(): Promise<void> {
    try {
      const { insets } = await SafeArea.getSafeAreaInsets();
      this.insets = insets;
      this.setCSSVariables();
    } catch (error) {
      console.error('Failed to get safe area insets:', error);
    }
  }

  /**
   * Set CSS custom properties for safe area insets
   */
  private setCSSVariables(): void {
    document.documentElement.style.setProperty('--safe-area-inset-top', `${this.insets.top}px`);
    document.documentElement.style.setProperty('--safe-area-inset-right', `${this.insets.right}px`);
    document.documentElement.style.setProperty('--safe-area-inset-bottom', `${this.insets.bottom}px`);
    document.documentElement.style.setProperty('--safe-area-inset-left', `${this.insets.left}px`);
  }

  /**
   * Get current safe area insets
   */
  public getInsets(): SafeAreaInsets {
    return { ...this.insets };
  }

  /**
   * Get safe area top inset (useful for headers)
   */
  public getTopInset(): number {
    return this.insets.top;
  }

  /**
   * Get safe area bottom inset (useful for footers)
   */
  public getBottomInset(): number {
    return this.insets.bottom;
  }
}

export const safeAreaService = new SafeAreaService();
