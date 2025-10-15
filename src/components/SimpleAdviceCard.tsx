import React from 'react';
import { Advice } from '../services/adviceService';

interface SimpleAdviceCardProps {
  advice: Advice;
  className?: string;
}

const SimpleAdviceCard: React.FC<SimpleAdviceCardProps> = ({
  advice,
  className = '',
}) => {
  // Only add '#' if the first character is a number (UK version)
  const displayId = /^\d/.test(advice.id) ? `#${advice.id}` : advice.id;
  
  return (
    <div className={`text-center ${className}`} data-testid="advice-content">
      <h2 className="text-4xl font-light text-secondary-800 mb-8">
        {displayId}
      </h2>
      
      {advice.text && (
        <p className="text-lg text-secondary-700 leading-relaxed max-w-2xl mx-auto">
          {advice.text}
        </p>
      )}

      {advice.query && (
        <div className="mt-6">
          <p className="text-lg text-secondary-700 leading-relaxed max-w-2xl mx-auto italic">
            {advice.query}
          </p>
        </div>
      )}
    </div>
  );
};

export default SimpleAdviceCard;
