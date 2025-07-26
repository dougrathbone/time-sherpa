import { GoogleGenerativeAI } from '@google/generative-ai';
import { CalendarEvent, generateGoogleCalendarLink } from './calendar';
import { CalendarAnalysis, MeetingDetail } from '../../shared/types';

export { CalendarAnalysis, MeetingDetail };

export interface ScheduleSuggestions {
  suggestions: string[];
  anomalies: string[];
  focusTimeRecommendations: string[];
}

export async function analyzeCalendarData(
  events: CalendarEvent[],
  isUpcomingAnalysis = false
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
      return parseHistoricalAnalysis(analysisText, events);
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
    return (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // Hours
  } catch {
    return 1; // Default to 1 hour if can't calculate
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

function parseHistoricalAnalysis(analysisText: string, events: CalendarEvent[]): CalendarAnalysis {
  try {
    // Try to extract JSON from the response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // If AI analysis doesn't include meeting details, we'll use fallback
      // which includes the meeting details. For now, we'll always use fallback
      // to ensure we have meeting details for the expandable categories
      const fallbackAnalysis = generateFallbackAnalysis(events);
      
      // Enhance the fallback with AI insights if available
      return {
        ...fallbackAnalysis,
        keyInsights: parsed.keyInsights || fallbackAnalysis.keyInsights,
        suggestions: parsed.suggestions || parsed.keyInsights || fallbackAnalysis.suggestions,
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
  return generateFallbackAnalysis(events);
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

function generateFallbackAnalysis(events: CalendarEvent[]): CalendarAnalysis {
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
      hours: current.hours + duration,
      count: current.count + 1,
      meetings: [...current.meetings, meetingDetail]
    });
    
    // Track collaborators
    event.attendees?.forEach(attendee => {
      const name = attendee.displayName || attendee.email || 'Unknown';
      const current = collaborators.get(name) || { hours: 0, meetingCount: 0 };
      collaborators.set(name, {
        hours: current.hours + duration,
        meetingCount: current.meetingCount + 1
      });
    });
  });
  
  const totalHours = events.reduce((sum, event) => sum + calculateEventDuration(event), 0);
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
  
  return {
    categories: categoryArray,
    totalMeetingHours: Math.round(meetingHours * 10) / 10,
    focusHours: Math.round(focusHours * 10) / 10,
    keyInsights,
    suggestions: [],
    topCollaborators,
    lastUpdated: new Date().toISOString()
  };
} 