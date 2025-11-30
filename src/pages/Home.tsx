import React, { useState, useEffect } from 'react';
import { UserPreferences } from '../services/storageService';
import { adviceService, Advice } from '../services/adviceService';
import SimpleAdviceCard from '../components/SimpleAdviceCard';
import BottomNav from '../components/BottomNav';

interface HomeProps {
  preferences: UserPreferences;
}

const Home: React.FC<HomeProps> = ({ preferences }) => {
  const [dailyAdvice, setDailyAdvice] = useState<Advice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDailyAdvice();
  }, [preferences.selectedCountry]);

  const loadDailyAdvice = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const advice = await adviceService.getDailyAdvice();
      setDailyAdvice(advice);
    } catch (err) {
      setError('Failed to load today\'s reflection');
      console.error('Error loading daily advice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <main className="min-h-screen flex items-center justify-center px-4 bottom-nav-spacing">
        {isLoading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-400 mx-auto mb-4"></div>
            <p className="text-secondary-600">
              Loading today's reflection...
            </p>
          </div>
        ) : error ? (
          <div className="text-center">
            <p className="text-red-600 mb-4">
              {error}
            </p>
          </div>
        ) : dailyAdvice ? (
          <SimpleAdviceCard advice={dailyAdvice} />
        ) : (
          <div className="text-center">
            <p className="text-secondary-600">
              No advice available at the moment.
            </p>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Home;