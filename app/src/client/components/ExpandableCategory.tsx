import React, { useState } from 'react';
import AttendeeAvatar from './AttendeeAvatar';
import { TimeCategory } from '../shared/types';

interface ExpandableCategoryProps {
  category: TimeCategory;
  color: string;
  index: number;
}

function ExpandableCategory({ category, color, index }: ExpandableCategoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${hours.toFixed(1)}h`;
  };


  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-white rounded-lg border border-primary-gray/20 overflow-hidden">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: color }}
          ></div>
          <span className="font-medium text-primary-dark">{category.name}</span>
          <div className="flex items-center gap-2">
            <svg 
              className={`w-4 h-4 text-primary-dark/50 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <span className="text-primary-dark/70">
            {category.totalHours.toFixed(1)}h ({category.percentage}%)
          </span>
          <span className="text-primary-dark/70">
            {category.eventCount} events
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-primary-gray/20 bg-gray-50/30">
          <div className="p-4 space-y-3">
            {category.meetings.length === 0 ? (
              <div className="text-center text-primary-dark/50 py-4">
                No meetings in this category
              </div>
            ) : (
              category.meetings.map((meeting) => (
                <div 
                  key={meeting.id}
                  className="bg-white rounded-lg p-4 border border-primary-gray/10 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-primary-dark truncate pr-2">
                        {meeting.title}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-primary-dark/60 mt-1">
                        <span>
                          {formatTime(meeting.startTime)}
                        </span>
                        <span>
                          {formatDuration(meeting.duration)}
                        </span>
                      </div>
                    </div>
                    <a
                      href={meeting.googleCalendarLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary-orange text-white rounded-md hover:bg-primary-orange/90 transition-colors flex-shrink-0"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open
                    </a>
                  </div>
                  
                  {meeting.attendees.length > 0 && (
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs text-primary-dark/60 font-medium">
                        {meeting.attendees.length} attendee{meeting.attendees.length !== 1 ? 's' : ''}:
                      </span>
                      <div className="flex items-center">
                        {meeting.attendees.slice(0, 5).map(attendee => (
                          <AttendeeAvatar
                            key={attendee.email}
                            email={attendee.email}
                            displayName={attendee.displayName}
                            size="sm"
                          />
                        ))}
                        {meeting.attendees.length > 5 && (
                          <div className="w-6 h-6 rounded-full bg-primary-gray/20 text-primary-dark/60 text-xs font-medium flex items-center justify-center border border-white -ml-1">
                            +{meeting.attendees.length - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {meeting.organizer && (
                    <div className="text-xs text-primary-dark/50 mt-2">
                      Organized by {meeting.organizer.displayName || meeting.organizer.email}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpandableCategory;