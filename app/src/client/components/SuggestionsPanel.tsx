import React from 'react';

interface SuggestionsPanelProps {
  suggestions: string[] | null;
}

function SuggestionsPanel({ suggestions }: SuggestionsPanelProps) {
  if (!suggestions) {
    return (
      <div className="card">
        <h3 className="text-xl font-semibold text-primary-dark mb-4">
          Schedule Insights
        </h3>
        <div className="flex items-center justify-center h-32">
          <p className="text-primary-dark/60 text-sm">Loading insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-xl font-semibold text-primary-dark mb-4">
        Schedule Insights & Suggestions
      </h3>
      {suggestions.length > 0 ? (
        <ul className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary-orange/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-primary-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-primary-dark/80 text-sm">{suggestion}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-primary-dark/60 text-sm">No suggestions available at this time.</p>
      )}
    </div>
  );
}

export default SuggestionsPanel; 