import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface SubscriptionPromptProps {
  onDismiss: () => void;
}

export function SubscriptionPrompt({ onDismiss }: SubscriptionPromptProps) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    onDismiss();
  };

  const handleSubscribe = () => {
    navigate('/settings');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-primary-yellow to-primary-cream p-6 rounded-lg shadow-lg relative mb-6 border border-primary-gray/20">
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 text-primary-dark/60 hover:text-primary-dark transition-colors"
        aria-label="Close"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <div className="flex items-center justify-between pr-8">
        <div className="text-primary-dark">
          <h3 className="text-xl font-semibold mb-2">
            Want these insights in your inbox?
          </h3>
          <p className="text-primary-dark/80">
            Subscribe to receive personalized time management summaries via email. 
            Choose daily or weekly delivery.
          </p>
        </div>
        
        <button
          onClick={handleSubscribe}
          className="bg-primary-orange text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-orange/90 transition-colors ml-6 whitespace-nowrap shadow-md"
        >
          Subscribe Now
        </button>
      </div>
    </div>
  );
} 