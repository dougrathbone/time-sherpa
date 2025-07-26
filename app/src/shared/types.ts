// Shared types between client and server

export interface MeetingDetail {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  duration: number;
  attendeeCount: number;
  attendees: Array<{
    email: string;
    displayName?: string;
  }>;
  googleCalendarLink: string;
  organizer?: {
    email: string;
    displayName?: string;
  };
}

export interface TimeCategory {
  name: string;
  totalHours: number;
  percentage: number;
  eventCount: number;
  meetings: MeetingDetail[];
}

export interface CalendarAnalysis {
  categories: TimeCategory[];
  totalMeetingHours: number;
  focusHours: number;
  keyInsights: string[];
  suggestions: string[];
  topCollaborators: {
    name: string;
    totalHours: number;
    meetingCount: number;
  }[];
  lastUpdated: string;
}