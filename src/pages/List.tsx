import React, { useState, useEffect, useCallback } from 'react';
import { UserPreferences } from '../services/storageService';
import { adviceService } from '../services/adviceService';
import { AdviceSection } from '../services/adviceService';
import AdviceCard from '../components/AdviceCard';
import BottomNav from '../components/BottomNav';
import { textStyles, inputStyles } from '../styles/components';

interface ListProps {
  preferences: UserPreferences;
}

const List: React.FC<ListProps> = ({ preferences }) => {
  const [sections, setSections] = useState<AdviceSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSections, setFilteredSections] = useState<AdviceSection[]>([]);
  const [disabledAdvices, setDisabledAdvices] = useState<string[]>([]);

  const loadSections = useCallback(async () => {
    try {
      setIsLoading(true);
      const sectionsData = await adviceService.getSections(preferences.selectedCountry);
      setSections(sectionsData);
      setFilteredSections(sectionsData);
    } catch (error) {
      console.error('Failed to load sections:', error);
    } finally {
      setIsLoading(false);
    }
  }, [preferences.selectedCountry]);

  const loadDisabledAdvices = useCallback(async () => {
    try {
      const disabled = await adviceService.getDisabledAdvices();
      setDisabledAdvices(disabled);
    } catch (error) {
      console.error('Failed to load disabled advices:', error);
    }
  }, []);

  const filterSections = useCallback(async () => {
    try {
      const searchResults = await adviceService.searchAdvices(searchQuery, preferences.selectedCountry);
      
      // Group results by section
      const groupedResults: { [key: string]: AdviceSection } = {};
      
      searchResults.forEach(advice => {
        const section = sections.find(s => s.advices.some(a => a.id === advice.id));
        if (section) {
          if (!groupedResults[section.id]) {
            groupedResults[section.id] = {
              id: section.id,
              title: section.title,
              advices: []
            };
          }
          groupedResults[section.id].advices.push(advice);
        }
      });
      
      setFilteredSections(Object.values(groupedResults));
    } catch (error) {
      console.error('Failed to search advices:', error);
    }
  }, [searchQuery, sections, preferences.selectedCountry]);

  useEffect(() => {
    loadSections();
    loadDisabledAdvices();
  }, [loadSections, loadDisabledAdvices]);

  useEffect(() => {
    if (searchQuery.trim()) {
      filterSections();
    } else {
      setFilteredSections(sections);
    }
  }, [searchQuery, sections, filterSections]);

  const handleToggleAdvice = async (adviceId: string) => {
    try {
      const isNowDisabled = await adviceService.toggleAdviceStatus(adviceId);
      
      if (isNowDisabled) {
        setDisabledAdvices(prev => [...prev, adviceId]);
      } else {
        setDisabledAdvices(prev => prev.filter(id => id !== adviceId));
      }
    } catch (error) {
      console.error('Failed to toggle advice status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Search */}
      <div className="sticky top-0 bg-white border-b border-secondary-200 p-4 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search advices and queries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputStyles.base} pl-10`}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-5 w-5 text-secondary-400 hover:text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 pb-20">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-400 mx-auto mb-4"></div>
            <p className="text-secondary-600">
              Loading advices and queries...
            </p>
          </div>
        ) : filteredSections.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-secondary-600">
              {searchQuery ? 'No advices found matching your search.' : 'No advices available.'}
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {filteredSections.map((section) => (
              <div key={section.id}>
                <h2 className={`${textStyles.headingLarge} mb-8 text-secondary-900`}>
                  Section {section.id}: {section.title}
                </h2>
                <div className="space-y-8">
                  {section.advices.map((advice) => (
                    <AdviceCard
                      key={advice.id}
                      advice={advice}
                      isDisabled={disabledAdvices.includes(advice.id)}
                      onToggleDisabled={handleToggleAdvice}
                      showToggle={true}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default List;