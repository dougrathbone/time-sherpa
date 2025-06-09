import { GoogleGenerativeAI } from '@google/generative-ai';
import { CalendarEvent } from './calendar';

export interface CalendarAnalysis {
  categories: {
    name: string;
    totalHours: number;
    percentage: number;
    eventCount: number;
  }[];
  totalMeetingHours: number;
  focusHours: number;
  keyInsights: string[];
  topCollaborators: {
    name: string;
    hours: number;
  }[];
}

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
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Prepare event data for analysis
    const eventSummaries = events.map(event => ({
      title: event.summary,
      description: event.description,
      duration: calculateEventDuration(event),
      attendeeCount: event.attendees?.length || 0,
      isRecurring: event.summary.toLowerCase().includes('recurring') || 
                   event.summary.toLowerCase().includes('weekly') ||
                   event.summary.toLowerCase().includes('daily'),
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
Analyze the following calendar events from the past month and provide insights in JSON format:

Events: ${JSON.stringify(events, null, 2)}

Please categorize the events and provide analysis in this exact JSON structure:
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
    "Most meetings are with your direct reports"
  ],
  "topCollaborators": [
    {
      "name": "John Doe",
      "hours": 5.5
    }
  ]
}

Categories should include: 1:1 Meetings, Team Meetings, External Meetings, Focus Time, Personal Time, Other.
Focus on actionable insights and patterns.
`;
}

function generateUpcomingAnalysisPrompt(events: any[]): string {
  return `
Analyze the following upcoming calendar events for the next week and provide proactive suggestions in JSON format:

Events: ${JSON.stringify(events, null, 2)}

Please provide analysis in this exact JSON structure:
{
  "suggestions": [
    "You have 5 hours of back-to-back meetings on Tuesday. Consider scheduling breaks.",
    "Your focus time decreased by 30% this week. Block some deep work time."
  ],
  "anomalies": [
    "Unusual number of external meetings this week",
    "No 1:1s scheduled with your team"
  ],
  "focusTimeRecommendations": [
    "Schedule 2-hour focus blocks on Wednesday morning",
    "Move non-critical meetings to create larger time blocks"
  ]
}

Focus on schedule optimization and work-life balance insights.
`;
}

function parseHistoricalAnalysis(analysisText: string, events: CalendarEvent[]): CalendarAnalysis {
  try {
    // Try to extract JSON from the response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
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
  const totalHours = events.reduce((sum, event) => sum + calculateEventDuration(event), 0);
  
  return {
    categories: [
      {
        name: 'All Meetings',
        totalHours: totalHours,
        percentage: 100,
        eventCount: events.length,
      }
    ],
    totalMeetingHours: totalHours,
    focusHours: 0,
    keyInsights: [
      `You have ${events.length} events scheduled`,
      `Total meeting time: ${totalHours.toFixed(1)} hours`
    ],
    topCollaborators: [],
  };
} 