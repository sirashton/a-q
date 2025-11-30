import React from 'react';
import { Advice, parseQuery } from '../services/adviceService';

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
  
  // Parse the query into sentences while preserving original order
  const sentences = parseQuery(advice.query);
  
  return (
    <div className={`text-center ${className}`} data-testid="advice-content">
      <h2 className="text-4xl font-light text-secondary-800 mb-8">
        {/* {displayId} */}
        {displayId}
      </h2>
      
      {/* Render sentences in original order */}
      {sentences.length > 0 && (
        <div className="max-w-2xl mx-auto">
          {sentences.map((sentence, index) => (
            <p key={index} className={`text-lg text-secondary-700 leading-relaxed mb-2 ${
              sentence.type === 'question' ? 'italic' : ''
            }`}>
              {sentence.content}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimpleAdviceCard;
