import { google } from 'googleapis';
import { getRefreshTokenAuth } from './auth';

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
  htmlLink?: string;
}

export function generateGoogleCalendarLink(event: CalendarEvent): string {
  // If the event has an htmlLink from Google API, use it
  if (event.htmlLink) {
    return event.htmlLink;
  }
  
  // Fallback: construct the link manually
  const startTime = event.start.dateTime || event.start.date;
  if (startTime) {
    return `https://calendar.google.com/calendar/event?eid=${encodeURIComponent(event.id)}`;
  }
  
  return `https://calendar.google.com/calendar/event?eid=${encodeURIComponent(event.id)}`;
}

// Helper function to map Google Calendar events to our CalendarEvent interface
function mapGoogleEventsToCalendarEvents(events: any[]): CalendarEvent[] {
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
    attendees: event.attendees?.map((attendee: any) => ({
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
    htmlLink: event.htmlLink ?? undefined,
  }));
}

export async function getCalendarEventsWithRefresh(
  user: { accessToken: string; refreshToken?: string; id: string },
  timeMin?: Date,
  timeMax?: Date
): Promise<CalendarEvent[]> {
  try {
    let auth;
    
    // First try with the access token
    try {
      auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: user.accessToken });
      
      const calendar = google.calendar({ version: 'v3', auth });
      
      const defaultTimeMin = timeMin || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const defaultTimeMax = timeMax || new Date();
      
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: defaultTimeMin.toISOString(),
        timeMax: defaultTimeMax.toISOString(),
        maxResults: 2500,
        singleEvents: true,
        orderBy: 'startTime',
      });
      
      const events = response.data.items || [];
      return mapGoogleEventsToCalendarEvents(events);
    } catch (tokenError: any) {
      // If access token fails and we have a refresh token, try refreshing
      if (tokenError.code === 401 && user.refreshToken) {
        console.log('Access token expired, attempting refresh for user:', user.id);
        auth = await getRefreshTokenAuth(user.refreshToken);
      } else {
        throw tokenError;
      }
    }
    
    // Retry with refreshed token
    const calendar = google.calendar({ version: 'v3', auth });
    
    const defaultTimeMin = timeMin || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const defaultTimeMax = timeMax || new Date();

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: defaultTimeMin.toISOString(),
      timeMax: defaultTimeMax.toISOString(),
      maxResults: 2500,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    return mapGoogleEventsToCalendarEvents(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw new Error('Failed to fetch calendar events');
  }
}

// Legacy function for backward compatibility
export async function getCalendarEvents(
  accessToken: string,
  timeMin?: Date,
  timeMax?: Date
): Promise<CalendarEvent[]> {
  return getCalendarEventsWithRefresh({ accessToken, id: 'legacy' }, timeMin, timeMax);
}

export async function getUserCalendarEvents(
  auth: any,
  timeMin?: string,
  timeMax?: string
): Promise<CalendarEvent[]> {
  try {
    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      timeMax: timeMax || new Date().toISOString(), // Now
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
      htmlLink: event.htmlLink ?? undefined,
    }));
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw new Error('Failed to fetch calendar events');
  }
} 