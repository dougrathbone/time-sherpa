import { google } from 'googleapis';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  creator?: {
    email: string;
    displayName?: string;
  };
  organizer?: {
    email: string;
    displayName?: string;
  };
}

export async function getCalendarEvents(
  accessToken: string,
  timeMin?: Date,
  timeMax?: Date
): Promise<CalendarEvent[]> {
  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth });

    const defaultTimeMin = timeMin || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const defaultTimeMax = timeMax || new Date(); // Now

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: defaultTimeMin.toISOString(),
      timeMax: defaultTimeMax.toISOString(),
      maxResults: 2500,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    
    return events.map((event): CalendarEvent => ({
      id: event.id!,
      summary: event.summary!,
      description: event.description ?? undefined,
      start: {
        dateTime: event.start?.dateTime ?? undefined,
        date: event.start?.date ?? undefined,
      },
      end: {
        dateTime: event.end?.dateTime ?? undefined,
        date: event.end?.date ?? undefined,
      },
      attendees: event.attendees?.map(attendee => ({
        email: attendee.email!,
        displayName: attendee.displayName ?? undefined,
      })),
      creator: event.creator ? {
        email: event.creator.email || '',
        displayName: event.creator.displayName,
      } : undefined,
      organizer: event.organizer ? {
        email: event.organizer.email || '',
        displayName: event.organizer.displayName,
      } : undefined,
    }));
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw new Error('Failed to fetch calendar events');
  }
} 