import { google } from 'googleapis';
import { ActionableSuggestion } from '../../shared/types';

export interface ScheduleEventRequest {
  suggestion: ActionableSuggestion;
  timeSlot: {
    startTime: string;
    endTime: string;
    date: string;
    reasoning: string;
  };
  accessToken: string;
}

export interface ScheduleEventResult {
  success: boolean;
  eventId?: string;
  eventLink?: string;
  error?: string;
}

export async function scheduleCalendarEvent(
  request: ScheduleEventRequest
): Promise<ScheduleEventResult> {
  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: request.accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Create event details based on suggestion type
    const eventDetails = createEventDetails(request.suggestion, request.timeSlot);

    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventDetails,
    });

    return {
      success: true,
      eventId: event.data.id || undefined,
      eventLink: event.data.htmlLink || undefined,
    };
  } catch (error) {
    console.error('Error scheduling calendar event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

function createEventDetails(
  suggestion: ActionableSuggestion, 
  timeSlot: any
) {
  const startDateTime = new Date(`${timeSlot.date}T${timeSlot.startTime}:00`);
  const endDateTime = new Date(`${timeSlot.date}T${timeSlot.endTime}:00`);

  let summary = '';
  let description = '';
  let colorId = '1'; // Default blue

  switch (suggestion.type) {
    case 'focus_time':
      summary = 'Focus Time - Deep Work';
      description = `Scheduled based on TimeSherpa insight: "${suggestion.text}"\n\nThis time is blocked for deep work and strategic thinking.`;
      colorId = '9'; // Blue
      break;
    
    case 'break':
      summary = 'Break Time';
      description = `Scheduled based on TimeSherpa insight: "${suggestion.text}"\n\nTake a break to recharge and maintain productivity.`;
      colorId = '10'; // Green
      break;
    
    case 'review_session':
      summary = 'Meeting Review Session';
      description = `Scheduled based on TimeSherpa insight: "${suggestion.text}"\n\nUse this time to:\n• Review recurring meetings for consolidation opportunities\n• Identify meetings that can be delegated\n• Optimize your meeting schedule`;
      colorId = '6'; // Orange
      break;
    
    case 'planning_time':
      summary = 'Strategic Planning Time';
      description = `Scheduled based on TimeSherpa insight: "${suggestion.text}"\n\nUse this time for:\n• Strategic planning and preparation\n• Weekly/monthly planning\n• Goal setting and review`;
      colorId = '8'; // Purple
      break;
    
    case 'meeting_scheduling':
      summary = 'Scheduled Meeting';
      description = `Meeting scheduled based on TimeSherpa insight: "${suggestion.text}"\n\nPlease add attendees and agenda details.`;
      colorId = '11'; // Red
      break;
    
    default:
      summary = 'TimeSherpa Suggestion';
      description = `Scheduled based on insight: "${suggestion.text}"`;
      colorId = '1'; // Default
      break;
  }

  return {
    summary,
    description,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    colorId,
    reminders: {
      useDefault: true,
    },
    extendedProperties: {
      private: {
        timeSherpaGenerated: 'true',
        suggestionId: suggestion.id,
        suggestionType: suggestion.type,
      },
    },
  };
}