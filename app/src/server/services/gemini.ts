import { GoogleGenerativeAI } from '@google/generative-ai';
import { CalendarEvent, generateGoogleCalendarLink } from './calendar';
import { CalendarAnalysis, MeetingDetail, ActionableSuggestion, WorkweekSettings } from '../../shared/types';
import { getNextWorkdays, defaultWorkweek } from '../utils/workweekUtils';

export { CalendarAnalysis, MeetingDetail };

function generateActionableSuggestions(
  suggestions: string[], 
  events: CalendarEvent[],
  workweek: WorkweekSettings = defaultWorkweek
): ActionableSuggestion[] {
  const actionableSuggestions: ActionableSuggestion[] = [];
  
  suggestions.forEach((suggestion, index) => {
    const analysis = analyzeSuggestionIntent(suggestion);
    
    let suggestedTimeSlots: ActionableSuggestion['suggestedTimeSlots'] = [];
    
    if (analysis.actionable) {
      switch (analysis.type) {
        case 'focus_time':
          suggestedTimeSlots = findFocusTimeSlots(events, suggestion, workweek);
          break;
        case 'break':
          suggestedTimeSlots = findBreakTimeSlots(events, suggestion, workweek);
          break;
        case 'review_session':
          suggestedTimeSlots = findReviewTimeSlots(events, suggestion, workweek);
          break;
        case 'planning_time':
          suggestedTimeSlots = findPlanningTimeSlots(events, suggestion, workweek);
          break;
        case 'meeting_scheduling':
          suggestedTimeSlots = findMeetingTimeSlots(events, suggestion, workweek);
          break;
      }
    }

    actionableSuggestions.push({
      id: `suggestion-${index}`,
      text: suggestion,
      type: analysis.type,
      actionable: analysis.actionable,
      actionLabel: analysis.actionLabel,
      actionDescription: analysis.actionDescription,
      suggestedTimeSlots: analysis.actionable ? suggestedTimeSlots : undefined
    });
  });

  return actionableSuggestions;
}

interface SuggestionAnalysis {
  type: ActionableSuggestion['type'];
  actionable: boolean;
  actionLabel?: string;
  actionDescription?: string;
}

function analyzeSuggestionIntent(suggestion: string): SuggestionAnalysis {
  const suggestionLower = suggestion.toLowerCase();
  
  // Focus time suggestions
  if (suggestionLower.includes('focus time') || 
      suggestionLower.includes('deep work') || 
      suggestionLower.includes('block') && (suggestionLower.includes('time') || suggestionLower.includes('hour'))) {
    return {
      type: 'focus_time',
      actionable: true,
      actionLabel: 'Schedule Focus Time',
      actionDescription: 'Block uninterrupted time for deep work and strategic thinking'
    };
  }

  // Break/lunch suggestions
  if (suggestionLower.includes('break') || suggestionLower.includes('lunch')) {
    return {
      type: 'break',
      actionable: true,
      actionLabel: 'Schedule Break',
      actionDescription: 'Add a break to your calendar to recharge and maintain productivity'
    };
  }

  // Meeting consolidation/delegation suggestions (NOT actionable for direct scheduling)
  if ((suggestionLower.includes('consolidate') || suggestionLower.includes('delegate')) && 
      suggestionLower.includes('meeting')) {
    return {
      type: 'review_session',
      actionable: true,
      actionLabel: 'Schedule Review Session',
      actionDescription: 'Block time to review and optimize your recurring meetings'
    };
  }

  // 1:1 or specific meeting suggestions
  if (suggestionLower.includes('1:1') || suggestionLower.includes('1-1') ||
      (suggestionLower.includes('schedule') && suggestionLower.includes('meeting'))) {
    return {
      type: 'meeting_scheduling',
      actionable: true,
      actionLabel: 'Schedule Meeting',
      actionDescription: 'Schedule the suggested meeting or check-in'
    };
  }

  // Planning/strategy suggestions
  if (suggestionLower.includes('plan') || suggestionLower.includes('strategy') || 
      suggestionLower.includes('review') && !suggestionLower.includes('meeting')) {
    return {
      type: 'planning_time',
      actionable: true,
      actionLabel: 'Schedule Planning Time',
      actionDescription: 'Block time for strategic planning and preparation'
    };
  }

  // Work-life balance (advisory only)
  if (suggestionLower.includes('work-life') || suggestionLower.includes('balance') || 
      suggestionLower.includes('late') && suggestionLower.includes('meeting')) {
    return {
      type: 'work_life_balance',
      actionable: false
    };
  }

  // General suggestions that don't have clear calendar actions
  return {
    type: 'general',
    actionable: false
  };
}

function findFocusTimeSlots(events: CalendarEvent[], _suggestion: string, workweek: WorkweekSettings = defaultWorkweek): ActionableSuggestion['suggestedTimeSlots'] {
  const timeSlots: NonNullable<ActionableSuggestion['suggestedTimeSlots']> = [];
  const today = new Date();
  
  // Get next 7 workdays instead of calendar days
  const workdays = getNextWorkdays(today, 7, workweek);

  // Find free time slots for focus work (2-3 hour blocks)
  for (const d of workdays) {
    const dayStart = new Date(d);
    dayStart.setHours(9, 0, 0, 0); // Start at 9 AM
    const dayEnd = new Date(d);
    dayEnd.setHours(17, 0, 0, 0); // End at 5 PM

    const dayEvents = events.filter(event => {
      const eventStart = new Date(event.start.dateTime || event.start.date || '');
      return eventStart.toDateString() === d.toDateString();
    }).sort((a, b) => {
      const aStart = new Date(a.start.dateTime || a.start.date || '');
      const bStart = new Date(b.start.dateTime || b.start.date || '');
      return aStart.getTime() - bStart.getTime();
    });

    // Find gaps of 2+ hours
    let currentTime = dayStart;
    for (const event of dayEvents) {
      const eventStart = new Date(event.start.dateTime || event.start.date || '');
      const eventEnd = new Date(event.end.dateTime || event.end.date || '');
      
      if (eventStart.getTime() - currentTime.getTime() >= 2 * 60 * 60 * 1000) {
        // Found a 2+ hour gap
        const endTime = new Date(Math.min(eventStart.getTime(), currentTime.getTime() + 3 * 60 * 60 * 1000));
        timeSlots.push({
          startTime: currentTime.toTimeString().slice(0, 5),
          endTime: endTime.toTimeString().slice(0, 5),
          date: d.toISOString().split('T')[0],
          reasoning: 'Uninterrupted time block perfect for deep work'
        });
      }
      currentTime = eventEnd;
    }

    // Check for time after last meeting
    if (dayEnd.getTime() - currentTime.getTime() >= 2 * 60 * 60 * 1000) {
      const endTime = new Date(Math.min(dayEnd.getTime(), currentTime.getTime() + 3 * 60 * 60 * 1000));
      timeSlots.push({
        startTime: currentTime.toTimeString().slice(0, 5),
        endTime: endTime.toTimeString().slice(0, 5),
        date: d.toISOString().split('T')[0],
        reasoning: 'End of day focus session'
      });
    }
  }

  return timeSlots.slice(0, 3); // Return top 3 options
}

function findBreakTimeSlots(_events: CalendarEvent[], suggestion: string, workweek: WorkweekSettings = defaultWorkweek): ActionableSuggestion['suggestedTimeSlots'] {
  const timeSlots: NonNullable<ActionableSuggestion['suggestedTimeSlots']> = [];
  
  // Extract specific time if mentioned in suggestion (e.g., "1pm for lunch")
  const timeMatch = suggestion.match(/(\d{1,2})(am|pm)/i);
  if (timeMatch) {
    const hour = parseInt(timeMatch[1]);
    const isPM = timeMatch[2].toLowerCase() === 'pm';
    const actualHour = isPM && hour !== 12 ? hour + 12 : (!isPM && hour === 12 ? 0 : hour);
    
    const today = new Date();
    const workdays = getNextWorkdays(today, 5, workweek);
    
    for (const date of workdays) {
      
      timeSlots.push({
        startTime: `${actualHour.toString().padStart(2, '0')}:00`,
        endTime: `${(actualHour + 1).toString().padStart(2, '0')}:00`,
        date: date.toISOString().split('T')[0],
        reasoning: 'Suggested break time'
      });
    }
  }

  return timeSlots;
}

function findMeetingTimeSlots(events: CalendarEvent[], _suggestion: string, workweek: WorkweekSettings = defaultWorkweek): ActionableSuggestion['suggestedTimeSlots'] {
  const timeSlots: NonNullable<ActionableSuggestion['suggestedTimeSlots']> = [];
  const today = new Date();
  
  // Find common meeting times (10 AM, 2 PM, 3 PM slots)
  const commonTimes = [
    { hour: 10, label: 'Mid-morning slot' },
    { hour: 14, label: 'Early afternoon slot' }, 
    { hour: 15, label: 'Mid-afternoon slot' }
  ];

  const workdays = getNextWorkdays(today, 7, workweek);

  for (const date of workdays) {
    
    commonTimes.forEach(time => {
      const startTime = `${time.hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(time.hour + 1).toString().padStart(2, '0')}:00`;
      
      // Check if slot is free
      const conflictingEvents = events.filter(event => {
        const eventStart = new Date(event.start.dateTime || event.start.date || '');
        const eventDate = eventStart.toISOString().split('T')[0];
        const eventHour = eventStart.getHours();
        
        return eventDate === date.toISOString().split('T')[0] && 
               eventHour >= time.hour && eventHour < (time.hour + 1);
      });
      
      if (conflictingEvents.length === 0) {
        timeSlots.push({
          startTime,
          endTime,
          date: date.toISOString().split('T')[0],
          reasoning: time.label
        });
      }
    });
  }

  return timeSlots.slice(0, 4); // Return top 4 options
}

function findReviewTimeSlots(events: CalendarEvent[], _suggestion: string, workweek: WorkweekSettings = defaultWorkweek): ActionableSuggestion['suggestedTimeSlots'] {
  const timeSlots: NonNullable<ActionableSuggestion['suggestedTimeSlots']> = [];
  const today = new Date();
  
  // Find 1-2 hour slots for reviewing meetings/processes
  const reviewTimes = [
    { hour: 9, duration: 1, label: 'Morning review session' },
    { hour: 16, duration: 1, label: 'End-of-day review' },
    { hour: 13, duration: 1, label: 'Midday process review' }
  ];

  const workdays = getNextWorkdays(today, 5, workweek);

  for (const date of workdays) {
    
    reviewTimes.forEach(time => {
      const startTime = `${time.hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(time.hour + time.duration).toString().padStart(2, '0')}:00`;
      
      // Check if slot is free
      const conflictingEvents = events.filter(event => {
        const eventStart = new Date(event.start.dateTime || event.start.date || '');
        const eventDate = eventStart.toISOString().split('T')[0];
        const eventHour = eventStart.getHours();
        
        return eventDate === date.toISOString().split('T')[0] && 
               eventHour >= time.hour && eventHour < (time.hour + time.duration);
      });
      
      if (conflictingEvents.length === 0) {
        timeSlots.push({
          startTime,
          endTime,
          date: date.toISOString().split('T')[0],
          reasoning: time.label
        });
      }
    });
  }

  return timeSlots.slice(0, 3); // Return top 3 options
}

function findPlanningTimeSlots(events: CalendarEvent[], _suggestion: string, workweek: WorkweekSettings = defaultWorkweek): ActionableSuggestion['suggestedTimeSlots'] {
  const timeSlots: NonNullable<ActionableSuggestion['suggestedTimeSlots']> = [];
  const today = new Date();
  
  // Find 1-2 hour slots for planning, preferably in morning or end of day
  const planningTimes = [
    { hour: 8, duration: 2, label: 'Early morning planning session' },
    { hour: 17, duration: 1, label: 'End-of-day planning' },
    { hour: 10, duration: 1, label: 'Mid-morning strategy time' }
  ];

  const workdays = getNextWorkdays(today, 7, workweek);

  for (const date of workdays) {
    
    planningTimes.forEach(time => {
      const startTime = `${time.hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(time.hour + time.duration).toString().padStart(2, '0')}:00`;
      
      // Check if slot is free
      const conflictingEvents = events.filter(event => {
        const eventStart = new Date(event.start.dateTime || event.start.date || '');
        const eventDate = eventStart.toISOString().split('T')[0];
        const eventHour = eventStart.getHours();
        
        return eventDate === date.toISOString().split('T')[0] && 
               eventHour >= time.hour && eventHour < (time.hour + time.duration);
      });
      
      if (conflictingEvents.length === 0) {
        timeSlots.push({
          startTime,
          endTime,
          date: date.toISOString().split('T')[0],
          reasoning: time.label
        });
      }
    });
  }

  return timeSlots.slice(0, 3); // Return top 3 options
}

export interface ScheduleSuggestions {
  suggestions: string[];
  anomalies: string[];
  focusTimeRecommendations: string[];
}

export async function analyzeCalendarData(
  events: CalendarEvent[],
  isUpcomingAnalysis = false,
  workweek: WorkweekSettings = defaultWorkweek
): Promise<CalendarAnalysis | ScheduleSuggestions> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    console.log(`Analyzing ${events.length} calendar events with Gemini AI...`);

    // Prepare event data for analysis
    const eventSummaries = events.map(event => ({
      title: event.summary,
      description: event.description,
      duration: calculateEventDuration(event),
      attendeeCount: event.attendees?.length || 0,
      attendees: event.attendees?.map(a => a.email || a.displayName || 'Unknown').join(', ') || '',
      organizer: event.organizer?.email || event.organizer?.displayName || '',
      isRecurring: event.summary.toLowerCase().includes('recurring') || 
                   event.summary.toLowerCase().includes('weekly') ||
                   event.summary.toLowerCase().includes('daily') ||
                   event.summary.toLowerCase().includes('standup') ||
                   event.summary.toLowerCase().includes('sync'),
      time: event.start.dateTime || event.start.date,
    }));

    let prompt: string;
    
    if (isUpcomingAnalysis) {
      prompt = generateUpcomingAnalysisPrompt(eventSummaries);
    } else {
      prompt = generateHistoricalAnalysisPrompt(eventSummaries);
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();

    console.log('Gemini AI response received, parsing results...');

    // Parse the AI response
    if (isUpcomingAnalysis) {
      return parseUpcomingAnalysis(analysisText);
    } else {
      return parseHistoricalAnalysis(analysisText, events, workweek);
    }
  } catch (error) {
    console.error('Error analyzing calendar data with Gemini:', error);
    
    // Return fallback analysis
    if (isUpcomingAnalysis) {
      return {
        suggestions: ['Unable to analyze upcoming schedule at this time.'],
        anomalies: [],
        focusTimeRecommendations: ['Try to schedule some focus time blocks.'],
      };
    } else {
      return generateFallbackAnalysis(events);
    }
  }
}

function calculateEventDuration(event: CalendarEvent): number {
  try {
    const startTime = new Date(event.start.dateTime || event.start.date || '');
    const endTime = new Date(event.end.dateTime || event.end.date || '');
    return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // Minutes
  } catch {
    return 60; // Default to 60 minutes if can't calculate
  }
}

function generateHistoricalAnalysisPrompt(events: any[]): string {
  return `
You are analyzing calendar events for a leader/executive to help them understand their time allocation.

Events to analyze: ${JSON.stringify(events, null, 2)}

Categorize each event into EXACTLY one of these categories based on title, attendees, and patterns:
- "1:1 Meetings": Events with exactly 2 attendees (including the user) or titles containing "1:1", "1-1", "one on one"
- "Team Meetings": Events with 3+ internal attendees, standups, team syncs, all-hands
- "External Meetings": Events with external email domains (not your organization), client/customer/vendor meetings
- "Focus Time": Blocked time for deep work, no attendees, titles like "focus", "work time", "blocked"
- "Personal Time": Lunch, breaks, personal appointments, titles containing "lunch", "break", "personal", "doctor"
- "Other": Everything else that doesn't clearly fit above categories

Calculate the total hours and percentage for each category. Extract the top 5 people the user spends the most time with.

Provide 3-5 actionable insights about their time management patterns, such as:
- Meeting load and distribution
- Balance between meetings and focus time
- Collaboration patterns
- Schedule density and back-to-back meetings
- Opportunities for optimization

Return ONLY valid JSON in this exact structure:
{
  "categories": [
    {
      "name": "1:1 Meetings",
      "totalHours": 10.5,
      "percentage": 25,
      "eventCount": 12
    }
  ],
  "totalMeetingHours": 42,
  "focusHours": 8,
  "keyInsights": [
    "You spend 60% of your time in meetings",
    "Your 1:1s are well-distributed across your team",
    "Consider blocking more focus time - you only have 8 hours this month"
  ],
  "suggestions": [
    "Block 2-3 hours of focus time each day",
    "Consider delegating some recurring meetings"
  ],
  "topCollaborators": [
    {
      "name": "John Doe",
      "totalHours": 5.5,
      "meetingCount": 8
    }
  ],
  "lastUpdated": "2024-01-15T10:30:00Z"
}
`;
}

function generateUpcomingAnalysisPrompt(events: any[]): string {
  return `
You are a productivity coach analyzing an executive's upcoming week to help them optimize their schedule.

Upcoming events for the next 7 days: ${JSON.stringify(events, null, 2)}

Analyze these events and provide:

1. SUGGESTIONS: 2-4 specific, actionable recommendations based on patterns you see:
   - Back-to-back meeting warnings (if 3+ hours without breaks)
   - Meeting-heavy days that need balance
   - Missing regular 1:1s or team syncs
   - Work-life balance concerns (late meetings, no lunch breaks)

2. ANOMALIES: 1-3 unusual patterns compared to typical executive schedules:
   - Unusually high/low meeting density
   - Missing key meetings (no 1:1s, no team meetings)
   - Unusual meeting times or patterns
   - Disproportionate external vs internal meetings

3. FOCUS TIME RECOMMENDATIONS: 2-3 specific suggestions for deep work:
   - Identify the best open slots for focus blocks
   - Suggest meeting consolidation opportunities
   - Recommend specific days/times for deep work

Return ONLY valid JSON in this exact structure:
{
  "suggestions": [
    "Tuesday has 6 hours of back-to-back meetings from 10am-4pm. Schedule a 30-min break at 1pm for lunch.",
    "You have no 1:1s scheduled this week. Consider adding time with your direct reports.",
    "Thursday afternoon (2-5pm) is completely free - perfect for a focus block."
  ],
  "anomalies": [
    "80% of your meetings are external this week (typical is 30-40%)",
    "No team meetings scheduled - unusual for a leadership role"
  ],
  "focusTimeRecommendations": [
    "Block Thursday 2-5pm for strategic planning or deep work",
    "Monday morning 9-11am is open - ideal for weekly planning",
    "Consider moving the Friday 4pm meeting to consolidate afternoon meetings"
  ]
}
`;
}

function parseHistoricalAnalysis(analysisText: string, events: CalendarEvent[], workweek: WorkweekSettings = defaultWorkweek): CalendarAnalysis {
  try {
    // Try to extract JSON from the response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // If AI analysis doesn't include meeting details, we'll use fallback
      // which includes the meeting details. For now, we'll always use fallback
      // to ensure we have meeting details for the expandable categories
      const fallbackAnalysis = generateFallbackAnalysis(events, workweek);
      
      // Enhance the fallback with AI insights if available
      const suggestions = parsed.suggestions || parsed.keyInsights || fallbackAnalysis.suggestions;
      const actionableSuggestions = generateActionableSuggestions(suggestions, events, workweek);
      
      return {
        ...fallbackAnalysis,
        keyInsights: parsed.keyInsights || fallbackAnalysis.keyInsights,
        suggestions,
        actionableSuggestions,
        topCollaborators: (parsed.topCollaborators || fallbackAnalysis.topCollaborators).map((collab: any) => ({
          name: collab.name,
          totalHours: collab.totalHours || collab.hours || 0,
          meetingCount: collab.meetingCount || 1
        })),
        lastUpdated: parsed.lastUpdated || new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Error parsing Gemini analysis:', error);
  }
  
  // Fallback to simple analysis if parsing fails
  return generateFallbackAnalysis(events, workweek);
}

function parseUpcomingAnalysis(analysisText: string): ScheduleSuggestions {
  try {
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Error parsing upcoming analysis:', error);
  }
  
  return {
    suggestions: ['Review your upcoming schedule for optimization opportunities.'],
    anomalies: [],
    focusTimeRecommendations: ['Consider blocking time for focused work.'],
  };
}

function generateFallbackAnalysis(events: CalendarEvent[], workweek: WorkweekSettings = defaultWorkweek): CalendarAnalysis {
  // Basic categorization based on simple rules
  const categories = new Map<string, { hours: number; count: number; meetings: MeetingDetail[] }>();
  const collaborators = new Map<string, { hours: number; meetingCount: number }>();
  
  events.forEach(event => {
    const duration = calculateEventDuration(event);
    const attendeeCount = event.attendees?.length || 0;
    const title = event.summary.toLowerCase();
    
    // Simple categorization rules
    let category = 'Other';
    if (attendeeCount === 1 || title.includes('1:1') || title.includes('1-1')) {
      category = '1:1 Meetings';
    } else if (attendeeCount > 5 || title.includes('team') || title.includes('standup') || title.includes('all hands')) {
      category = 'Team Meetings';
    } else if (title.includes('focus') || title.includes('work time') || title.includes('blocked') || attendeeCount === 0) {
      category = 'Focus Time';
    } else if (title.includes('lunch') || title.includes('break') || title.includes('personal')) {
      category = 'Personal Time';
    } else if (attendeeCount > 0 && attendeeCount <= 5) {
      category = 'Small Group Meetings';
    }
    
    // Create meeting detail
    const meetingDetail: MeetingDetail = {
      id: event.id,
      title: event.summary,
      startTime: event.start.dateTime || event.start.date || '',
      endTime: event.end.dateTime || event.end.date || '',
      duration,
      attendeeCount,
      attendees: event.attendees || [],
      googleCalendarLink: generateGoogleCalendarLink(event),
      organizer: event.organizer
    };
    
    const current = categories.get(category) || { hours: 0, count: 0, meetings: [] };
    categories.set(category, {
      hours: current.hours + (duration / 60), // Convert minutes to hours
      count: current.count + 1,
      meetings: [...current.meetings, meetingDetail]
    });
    
    // Track collaborators
    event.attendees?.forEach(attendee => {
      const name = attendee.displayName || attendee.email || 'Unknown';
      const current = collaborators.get(name) || { hours: 0, meetingCount: 0 };
      collaborators.set(name, {
        hours: current.hours + (duration / 60), // Convert minutes to hours
        meetingCount: current.meetingCount + 1
      });
    });
  });
  
  const totalHours = events.reduce((sum, event) => sum + (calculateEventDuration(event) / 60), 0); // Convert minutes to hours
  const focusHours = categories.get('Focus Time')?.hours || 0;
  const meetingHours = totalHours - focusHours - (categories.get('Personal Time')?.hours || 0);
  
  // Convert to array and calculate percentages
  const categoryArray = Array.from(categories.entries()).map(([name, data]) => ({
    name,
    totalHours: Math.round(data.hours * 10) / 10,
    percentage: Math.round((data.hours / totalHours) * 100),
    eventCount: data.count,
    meetings: data.meetings.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  })).sort((a, b) => b.totalHours - a.totalHours);
  
  // Get top collaborators
  const topCollaborators = Array.from(collaborators.entries())
    .sort((a, b) => b[1].hours - a[1].hours)
    .slice(0, 5)
    .map(([name, data]) => ({
      name,
      totalHours: Math.round(data.hours * 10) / 10,
      meetingCount: data.meetingCount
    }));
  
  // Generate insights
  const meetingPercentage = Math.round((meetingHours / totalHours) * 100);
  const keyInsights = [
    `You spent ${meetingPercentage}% of your time in meetings (${meetingHours.toFixed(1)} hours)`,
    `You have ${focusHours.toFixed(1)} hours of focus time scheduled`,
    events.length > 50 ? 'Your calendar is very busy - consider delegating or declining some meetings' :
    events.length < 20 ? 'Your calendar has room for more strategic activities' :
    'Your meeting load appears balanced'
  ];
  
  if (topCollaborators.length > 0) {
    keyInsights.push(`You spend the most time with ${topCollaborators[0].name} (${topCollaborators[0].totalHours} hours)`);
  }
  
  // Generate basic suggestions
  const suggestions = [];
  if (focusHours < totalHours * 0.2) {
    suggestions.push('Consider blocking 2-3 hours of focus time daily to enhance deep work productivity.');
  }
  if (meetingPercentage > 70) {
    suggestions.push('Your meeting load is high. Consider delegating or declining some recurring meetings.');
  }
  if (events.some(e => e.attendees && e.attendees.length > 8)) {
    suggestions.push('Some large meetings could be more efficient as smaller focused sessions.');
  }

  const actionableSuggestions = generateActionableSuggestions(suggestions, events, workweek);

  return {
    categories: categoryArray,
    totalMeetingHours: Math.round(meetingHours * 10) / 10,
    focusHours: Math.round(focusHours * 10) / 10,
    keyInsights,
    suggestions,
    actionableSuggestions,
    topCollaborators,
    lastUpdated: new Date().toISOString()
  };
} 