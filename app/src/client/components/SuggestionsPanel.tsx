import React from 'react';
import { ActionableSuggestion } from '../../shared/types';

interface SuggestionsPanelProps {
  suggestions: string[] | null;
  actionableSuggestions?: ActionableSuggestion[] | null;
  onSuggestionClick?: (suggestion: ActionableSuggestion) => void;
}

function SuggestionsPanel({ suggestions, actionableSuggestions, onSuggestionClick }: SuggestionsPanelProps) {
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
          {(actionableSuggestions || suggestions.map((text, index) => ({ 
            id: `suggestion-${index}`, 
            text, 
            type: 'general' as const, 
            actionable: false 
          }))).map((suggestion, index) => {
            const isActionable = suggestion.actionable && onSuggestionClick;
            return (
              <li 
                key={suggestion.id || index} 
                className={`flex items-start gap-3 ${isActionable ? 'cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors' : ''}`}
                onClick={isActionable ? () => onSuggestionClick!(suggestion) : undefined}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isActionable 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-primary-orange/10 text-primary-orange'
                }`}>
                  {isActionable ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <span className="text-primary-dark/80 text-sm">{suggestion.text}</span>
                  {isActionable && (
                    <div className="mt-1">
                      <span className="text-xs text-blue-600 font-medium">
                        Click to {suggestion.actionLabel || 'take action'} →
                      </span>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-primary-dark/60 text-sm">No suggestions available at this time.</p>
      )}
    </div>
  );
}

export default SuggestionsPanel; 