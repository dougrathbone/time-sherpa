import { google } from 'googleapis';
import { getRefreshTokenAuth } from './auth';
import fs from 'fs';
import path from 'path';

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

// Cache Google OAuth credentials so we don't read the file on every request
let cachedCredentials: { client_id: string; client_secret: string; redirect_uris: string[] } | null = null;

function getGoogleCredentials() {
  if (!cachedCredentials) {
    try {
      const credentialsPath = path.join(process.cwd(), 'client_secret.json');
      const raw = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      cachedCredentials = raw.web;
    } catch {
      return null;
    }
  }
  return cachedCredentials;
}

function createOAuth2Client(accessToken: string) {
  const creds = getGoogleCredentials();
  if (creds) {
    const client = new google.auth.OAuth2(
      creds.client_id,
      creds.client_secret,
      creds.redirect_uris[0]
    );
    client.setCredentials({ access_token: accessToken });
    return client;
  }
  // Fallback: bare client (less reliable)
  const client = new google.auth.OAuth2();
  client.setCredentials({ access_token: accessToken });
  return client;
}

/**
 * Extract the HTTP status code from a GaxiosError or similar error.
 * GaxiosError stores the HTTP status in `.status`, while `.code` may be
 * a string like 'ECONNREFUSED'. For AIP-193 errors `.code` can also be
 * numeric. We check both to be safe.
 */
function getHttpStatus(error: any): number | undefined {
  if (typeof error?.status === 'number') return error.status;
  if (typeof error?.code === 'number') return error.code;
  return undefined;
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
  const defaultTimeMin = timeMin || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const defaultTimeMax = timeMax || new Date();
  
  const fetchEvents = async (auth: any) => {
    const calendar = google.calendar({ version: 'v3', auth });
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: defaultTimeMin.toISOString(),
      timeMax: defaultTimeMax.toISOString(),
      maxResults: 2500,
      singleEvents: true,
      orderBy: 'startTime',
    });
    return response.data.items || [];
  };

  try {
    // First try with the access token using a properly configured OAuth2 client
    try {
      const auth = createOAuth2Client(user.accessToken);
      const events = await fetchEvents(auth);
      return mapGoogleEventsToCalendarEvents(events);
    } catch (tokenError: any) {
      // If access token fails (401 expired, or 403 insufficient scopes) and we have a refresh token, try refreshing
      // GaxiosError stores HTTP status in `.status`; `.code` can be a string like 'ECONNREFUSED'
      const httpStatus = getHttpStatus(tokenError);
      if ((httpStatus === 401 || httpStatus === 403) && user.refreshToken) {
        console.log(`Access token error (${httpStatus}), attempting refresh for user:`, user.id);
        const refreshedAuth = await getRefreshTokenAuth(user.refreshToken);
        const events = await fetchEvents(refreshedAuth);
        return mapGoogleEventsToCalendarEvents(events);
      }
      throw tokenError;
    }
  } catch (error: any) {
    console.error('Error fetching calendar events:', error);
    
    // Preserve the Google API error code and message for upstream handling
    const calendarError: any = new Error(
      error?.cause?.message || error?.message || 'Failed to fetch calendar events'
    );
    calendarError.code = getHttpStatus(error) || 500;
    calendarError.googleError = error?.cause || null;
    throw calendarError;
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