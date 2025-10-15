import React, { useState } from 'react';
import { adviceService } from '../services/adviceService';
import { buttonStyles, cardStyles, textStyles } from '../styles/components';

interface CountrySelectorProps {
  onCountrySelected: (country: 'nz' | 'uk') => void;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({ onCountrySelected }) => {
  const [selectedCountry, setSelectedCountry] = useState<'nz' | 'uk' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const countries = adviceService.getAvailableCountries();

  const handleContinue = async () => {
    if (!selectedCountry) return;
    
    setIsLoading(true);
    try {
      await onCountrySelected(selectedCountry);
    } catch (error) {
      console.error('Failed to set country:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center p-4">
      <div className={`${cardStyles.elevated} max-w-md w-full`}>
        <div className="text-center mb-8">
          <h1 className={`${textStyles.headingLarge} mb-4`}>
            Welcome to Advices & Queries
          </h1>
          <p className={`${textStyles.body} text-secondary-600`}>
            Please select your country to get started with the appropriate version of Advices and Queries.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {countries.map((country) => (
            <button
              key={country.id}
              onClick={() => setSelectedCountry(country.id)}
              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                selectedCountry === country.id
                  ? 'border-primary-500 bg-primary-50 text-primary-900'
                  : 'border-secondary-200 hover:border-secondary-300 bg-white text-secondary-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{country.name}</span>
                {selectedCountry === country.id && (
                  <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={!selectedCountry || isLoading}
          className={`${buttonStyles.primary} w-full ${
            !selectedCountry || isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Setting up...
            </div>
          ) : (
            'Continue'
          )}
        </button>

        <p className={`${textStyles.caption} text-center mt-6`}>
          You can change this setting later in the app settings.
        </p>
      </div>
    </div>
  );
};

export default CountrySelector;
