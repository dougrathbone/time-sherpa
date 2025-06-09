import React from 'react';

interface ScheduleSuggestions {
  suggestions: string[];
  anomalies: string[];
  focusTimeRecommendations: string[];
}

interface SuggestionsPanelProps {
  suggestions: ScheduleSuggestions | null;
}

function SuggestionsPanel({ suggestions }: SuggestionsPanelProps) {
  if (!suggestions) {
    return (
      <div className="card">
        <h3 className="text-xl font-semibold text-primary-dark mb-4">
          Schedule Insights
        </h3>
        <div className="flex items-center justify-center h-32">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* General Suggestions */}
      <div className="card">
        <h3 className="text-xl font-semibold text-primary-dark mb-4">
          Schedule Suggestions
        </h3>
        {suggestions.suggestions.length > 0 ? (
          <ul className="space-y-3">
            {suggestions.suggestions.map((suggestion, index) => (
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

      {/* Anomalies */}
      {suggestions.anomalies.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold text-primary-dark mb-4">
            Schedule Anomalies
          </h3>
          <ul className="space-y-3">
            {suggestions.anomalies.map((anomaly, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <span className="text-primary-dark/80 text-sm">{anomaly}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Focus Time Recommendations */}
      {suggestions.focusTimeRecommendations.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold text-primary-dark mb-4">
            Focus Time Tips
          </h3>
          <ul className="space-y-3">
            {suggestions.focusTimeRecommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-teal/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-primary-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className="text-primary-dark/80 text-sm">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default SuggestionsPanel; 