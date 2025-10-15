import React from 'react';
import { Advice } from '../services/adviceService';
import { cardStyles, textStyles, buttonStyles } from '../styles/components';

interface AdviceCardProps {
  advice: Advice;
  isDisabled?: boolean;
  onToggleDisabled?: (adviceId: string) => void;
  showToggle?: boolean;
  className?: string;
}

const AdviceCard: React.FC<AdviceCardProps> = ({
  advice,
  isDisabled = false,
  onToggleDisabled,
  showToggle = false,
  className = '',
}) => {
  const handleToggle = () => {
    if (onToggleDisabled) {
      onToggleDisabled(advice.id);
    }
  };

  return (
    <div className={`${cardStyles.base} ${className} ${isDisabled ? 'opacity-60' : ''}`} data-testid="advice-card">
      <div className="flex justify-between items-start mb-4">
        <span className="text-sm font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded">
          {advice.id}
        </span>
        {showToggle && onToggleDisabled && (
          <button
            onClick={handleToggle}
            className={`text-sm px-3 py-1 rounded transition-colors ${
              isDisabled
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            {isDisabled ? 'Enable' : 'Disable'}
          </button>
        )}
      </div>

      {advice.text && (
        <div className="mb-4">
          <p className={`${textStyles.body} leading-relaxed`}>
            {advice.text}
          </p>
        </div>
      )}

      {advice.query && (
        <div className="border-l-4 border-primary-200 pl-4">
          <p className={`${textStyles.body} font-medium text-primary-800 italic`}>
            {advice.query}
          </p>
        </div>
      )}

      {isDisabled && (
        <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          This advice is currently disabled and will not appear in daily notifications.
        </div>
      )}
    </div>
  );
};

export default AdviceCard;
