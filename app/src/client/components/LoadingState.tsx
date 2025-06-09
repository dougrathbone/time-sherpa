import React from 'react';

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-cream">
      <div className="text-center">
        <div className="loading-spinner mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-primary-dark mb-2">
          Analyzing Your Calendar
        </h2>
        <p className="text-primary-dark/70">
          Our AI is processing your calendar data to generate insights...
        </p>
      </div>
    </div>
  );
}

export default LoadingState; 