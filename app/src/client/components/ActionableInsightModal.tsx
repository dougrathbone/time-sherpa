import React, { useState } from 'react';
import { ActionableSuggestion } from '../../shared/types';

interface ActionableInsightModalProps {
  suggestion: ActionableSuggestion | null;
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (suggestion: ActionableSuggestion, timeSlot: any) => Promise<void>;
}

function ActionableInsightModal({ 
  suggestion, 
  isOpen, 
  onClose, 
  onSchedule 
}: ActionableInsightModalProps) {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<any>(null);
  const [isScheduling, setIsScheduling] = useState(false);

  if (!isOpen || !suggestion) return null;

  const handleSchedule = async () => {
    if (!selectedTimeSlot) return;
    
    setIsScheduling(true);
    try {
      await onSchedule(suggestion, selectedTimeSlot);
      onClose();
    } catch (error) {
      console.error('Failed to schedule:', error);
    } finally {
      setIsScheduling(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'focus_time':
        return (
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'break':
        return (
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a1.5 1.5 0 100-3H9v3zM9 10v6a1 1 0 11-2 0v-6m6 0a1 1 0 112 0v6a1 1 0 11-2 0v-6z" />
          </svg>
        );
      case 'meeting_scheduling':
        return (
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'review_session':
        return (
          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      case 'planning_time':
        return (
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'work_life_balance':
        return (
          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              {getIcon(suggestion.type)}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Take Action on This Insight
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {suggestion.actionLabel || 'Schedule this suggestion'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Suggestion Text */}
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-800 mb-3">{suggestion.text}</p>
              {suggestion.actionDescription && (
                <div className="border-t pt-3 mt-3">
                  <p className="text-sm text-gray-600 font-medium mb-1">What this action will do:</p>
                  <p className="text-sm text-gray-700">{suggestion.actionDescription}</p>
                </div>
              )}
            </div>
          </div>

          {/* Time Slots */}
          {suggestion.suggestedTimeSlots && suggestion.suggestedTimeSlots.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Suggested Time Slots
              </h3>
              <div className="space-y-3">
                {suggestion.suggestedTimeSlots.map((timeSlot, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedTimeSlot === timeSlot
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTimeSlot(timeSlot)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          checked={selectedTimeSlot === timeSlot}
                          onChange={() => setSelectedTimeSlot(timeSlot)}
                          className="text-blue-600"
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            {formatDate(timeSlot.date)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatTime(timeSlot.startTime)} - {formatTime(timeSlot.endTime)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {timeSlot.reasoning}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            {suggestion.actionable && suggestion.suggestedTimeSlots && (
              <button
                onClick={handleSchedule}
                disabled={!selectedTimeSlot || isScheduling}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isScheduling ? 'Scheduling...' : suggestion.actionLabel || 'Schedule Now'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActionableInsightModal;