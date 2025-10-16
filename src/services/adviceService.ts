import advicesData from '../data/advices.json';
import { storageService } from './storageService';

export interface Advice {
  id: string;
  query: string;
}

export interface AdviceSection {
  id: string;
  title: string;
  advices: Advice[];
}

export interface AdviceData {
  nz: {
    name: string;
    sections: AdviceSection[];
  };
  uk: {
    name: string;
    sections: AdviceSection[];
  };
}

/**
 * Parse query text into sentences while preserving original order
 * @param query - The query text to parse
 * @returns Array of sentence objects with type and content
 */
export function parseQuery(query: string): { type: 'text' | 'question'; content: string }[] {
  if (!query) {
    return [];
  }

  const sentences: { type: 'text' | 'question'; content: string }[] = [];
  
  // Split on both "." and "?" to preserve order
  const parts = query.split(/([.?])/);
  let currentSentence = '';
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    if (part === '.' || part === '?') {
      currentSentence = currentSentence.trim();
      if (currentSentence) {
        if (part === '?') {
          sentences.push({ type: 'question', content: currentSentence + '?' });
        } else {
          sentences.push({ type: 'text', content: currentSentence + '.' });
        }
      }
      currentSentence = '';
    } else {
      currentSentence += part;
    }
  }
  
  return sentences;
}


export class AdviceService {
  private static instance: AdviceService;
  private data: AdviceData = advicesData as AdviceData;

  private constructor() {}

  public static getInstance(): AdviceService {
    if (!AdviceService.instance) {
      AdviceService.instance = new AdviceService();
    }
    return AdviceService.instance;
  }

  public async getAllAdvices(country: 'nz' | 'uk'): Promise<Advice[]> {
    const countryData = this.data[country];
    const allAdvices: Advice[] = [];
    
    countryData.sections.forEach(section => {
      allAdvices.push(...section.advices);
    });
    
    return allAdvices;
  }

  public async getSections(country: 'nz' | 'uk'): Promise<AdviceSection[]> {
    return this.data[country].sections;
  }

  public async getDailyAdvice(): Promise<Advice | null> {
    const prefs = await storageService.getPreferences();
    const allAdvices = await this.getAllAdvices(prefs.selectedCountry);
    
    // Filter out disabled advices
    const availableAdvices = allAdvices.filter(advice => 
      !prefs.disabledAdvices.includes(advice.id)
    );

    if (availableAdvices.length === 0) {
      return null;
    }

    // Check if we already have a daily advice for today
    const currentDailyAdvice = await storageService.getCurrentDailyAdvice();
    if (storageService.isDailyAdviceForToday(currentDailyAdvice, prefs.timezone)) {
      // Return the cached daily advice - don't filter by shownAdvices for daily display
      const advice = availableAdvices.find(a => a.id === currentDailyAdvice!.adviceId);
      if (advice) {
        return advice;
      } else {
        // The cached advice doesn't exist in current country, clear it and generate new one
        await storageService.updatePreferences({ dailyAdvice: null });
      }
    }

    // We need to generate a new daily advice for today
    const selectedAdvice = await this.generateNewDailyAdvice(availableAdvices, prefs);
    
    if (selectedAdvice) {
      // Cache this advice for today
      await storageService.setDailyAdvice(selectedAdvice.id, prefs.timezone);
    }

    return selectedAdvice;
  }

  private async generateNewDailyAdvice(availableAdvices: Advice[], prefs: any): Promise<Advice | null> {
    if (availableAdvices.length === 0) {
      return null;
    }

    // Check if we need to reset the cycle (all advices have been shown)
    if (prefs.shownAdvices.length >= availableAdvices.length) {
      await storageService.resetShownAdvices();
    }

    // Get advices that haven't been shown yet
    const unshownAdvices = availableAdvices.filter(advice => 
      !prefs.shownAdvices.includes(advice.id)
    );

    // If all available advices have been shown, reset and use all
    const advicesToChooseFrom = unshownAdvices.length > 0 ? unshownAdvices : availableAdvices;

    // Fisher-Yates shuffle algorithm for random selection
    const shuffled = [...advicesToChooseFrom];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selectedAdvice = shuffled[0];
    
    // Mark this advice as shown
    await storageService.addShownAdvice(selectedAdvice.id);
    
    // Update last viewed date
    const today = storageService.getCurrentDateInTimezone(prefs.timezone);
    await storageService.updateLastViewedDate(today);

    return selectedAdvice;
  }

  public async getAdviceById(adviceId: string, country: 'nz' | 'uk'): Promise<Advice | null> {
    const allAdvices = await this.getAllAdvices(country);
    return allAdvices.find(advice => advice.id === adviceId) || null;
  }

  public async getAdvicesBySection(sectionId: string, country: 'nz' | 'uk'): Promise<Advice[]> {
    const sections = await this.getSections(country);
    const section = sections.find(s => s.id === sectionId);
    return section ? section.advices : [];
  }

  public async searchAdvices(query: string, country: 'nz' | 'uk'): Promise<Advice[]> {
    const allAdvices = await this.getAllAdvices(country);
    const searchTerm = query.toLowerCase();
    
    return allAdvices.filter(advice => 
      advice.query && advice.query.toLowerCase().includes(searchTerm)
    );
  }

  public async getDisabledAdvices(): Promise<string[]> {
    const prefs = await storageService.getPreferences();
    return prefs.disabledAdvices;
  }

  public async isAdviceDisabled(adviceId: string): Promise<boolean> {
    const disabledAdvices = await this.getDisabledAdvices();
    return disabledAdvices.includes(adviceId);
  }

  public async toggleAdviceStatus(adviceId: string): Promise<boolean> {
    const isDisabled = await this.isAdviceDisabled(adviceId);
    
    if (isDisabled) {
      await storageService.enableAdvice(adviceId);
      return false; // Now enabled
    } else {
      await storageService.disableAdvice(adviceId);
      return true; // Now disabled
    }
  }

  public async getAdviceStats(country: 'nz' | 'uk'): Promise<{
    total: number;
    disabled: number;
    available: number;
    shown: number;
  }> {
    const allAdvices = await this.getAllAdvices(country);
    const prefs = await storageService.getPreferences();
    
    return {
      total: allAdvices.length,
      disabled: prefs.disabledAdvices.length,
      available: allAdvices.length - prefs.disabledAdvices.length,
      shown: prefs.shownAdvices.length,
    };
  }

  public getCountryName(country: 'nz' | 'uk'): string {
    return this.data[country].name;
  }

  public getAvailableCountries(): Array<{ id: 'nz' | 'uk'; name: string }> {
    return [
      { id: 'nz', name: this.data.nz.name },
      { id: 'uk', name: this.data.uk.name },
    ];
  }
}

export const adviceService = AdviceService.getInstance();
