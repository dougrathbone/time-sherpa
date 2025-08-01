// Shared types between client and server

export interface WorkweekSettings {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

export interface MeetingDetail {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  duration: number; // Duration in minutes
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

export interface ActionableSuggestion {
  id: string;
  text: string;
  type: 'focus_time' | 'break' | 'meeting_scheduling' | 'work_life_balance' | 'general' | 'review_session' | 'planning_time';
  actionable: boolean;
  suggestedTimeSlots?: Array<{
    startTime: string;
    endTime: string;
    date: string;
    reasoning: string;
  }>;
  actionLabel?: string; // e.g., "Schedule Focus Time", "Add Break", "Schedule Meeting"
  actionDescription?: string; // More detailed explanation of what the action will do
}

export interface CalendarAnalysis {
  categories: TimeCategory[];
  totalMeetingHours: number;
  focusHours: number;
  keyInsights: string[];
  suggestions: string[];
  actionableSuggestions?: ActionableSuggestion[];
  topCollaborators: {
    name: string;
    totalHours: number;
    meetingCount: number;
  }[];
  lastUpdated: string;
}