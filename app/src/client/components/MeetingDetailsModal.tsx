import React from 'react';
import { MeetingDetail, TimeCategory } from '../../shared/types';
import AttendeeAvatar from './AttendeeAvatar';

interface MeetingDetailsModalProps {
  category: TimeCategory | null;
  isOpen: boolean;
  onClose: () => void;
}

function MeetingDetailsModal({ category, isOpen, onClose }: MeetingDetailsModalProps) {
  if (!isOpen || !category) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (minutes: number) => {
    const wholeHours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (wholeHours === 0) return `${remainingMinutes}m`;
    if (remainingMinutes === 0) return `${wholeHours}h`;
    return `${wholeHours}h ${remainingMinutes}m`;
  };

  const sortedMeetings = [...category.meetings].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-primary-teal text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">{category.name}</h2>
            <p className="text-primary-teal-light opacity-90">
              {category.meetings.length} meetings • {category.totalHours.toFixed(1)} hours total
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {sortedMeetings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-500">No meetings found in this category</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-primary-dark mb-1">
                        {meeting.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(meeting.startTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          {formatDuration(meeting.duration)}
                        </span>
                      </div>
                    </div>
                    <a
                      href={meeting.googleCalendarLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-primary-orange hover:text-primary-orange-dark transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View in Calendar
                    </a>
                  </div>

                  {/* Organizer */}
                  {meeting.organizer && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Organized by:</span>
                        <div className="flex items-center gap-2">
                          <AttendeeAvatar 
                            email={meeting.organizer.email}
                            name={meeting.organizer.displayName}
                            size="sm"
                          />
                          <span className="text-primary-dark">
                            {meeting.organizer.displayName || meeting.organizer.email}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Attendees */}
                  {meeting.attendees && meeting.attendees.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-sm text-gray-500">
                          {meeting.attendeeCount} attendees
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {meeting.attendees.slice(0, 8).map((attendee, index) => (
                          <div
                            key={`${attendee.email}-${index}`}
                            className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm"
                          >
                            <AttendeeAvatar 
                              email={attendee.email}
                              name={attendee.displayName}
                              size="xs"
                            />
                            <span className="text-gray-700">
                              {attendee.displayName || attendee.email.split('@')[0]}
                            </span>
                          </div>
                        ))}
                        {meeting.attendees.length > 8 && (
                          <div className="flex items-center justify-center bg-gray-200 rounded-full px-3 py-1 text-sm text-gray-600">
                            +{meeting.attendees.length - 8} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{category.totalHours.toFixed(1)} hours</span> spent in {category.name} meetings
          </div>
          <button
            onClick={onClose}
            className="bg-primary-teal text-white px-4 py-2 rounded-lg hover:bg-primary-teal-dark transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default MeetingDetailsModal;