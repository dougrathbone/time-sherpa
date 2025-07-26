import { Router } from 'express';
import { ensureAuthenticated } from '../services/auth';
import { getCalendarEvents } from '../services/calendar';
import { analyzeCalendarData } from '../services/gemini';
import { scheduleCalendarEvent, ScheduleEventRequest } from '../services/calendarScheduling';
import { getUserWorkweek } from '../utils/userHelpers';

const router = Router();

// Get calendar analysis
router.get('/analysis', ensureAuthenticated, async (req: any, res: any) => {
  try {
    const user = req.user;
    
    // Get calendar events from the past month
    const events = await getCalendarEvents(user.accessToken);
    
    // Get user's workweek settings
    const workweek = await getUserWorkweek(user.id);
    
    // Analyze with Gemini AI
    const analysis = await analyzeCalendarData(events, false, workweek);
    
    // Return the analysis directly as the client expects
    res.json(analysis);
  } catch (error) {
    console.error('Calendar analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze calendar data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get week-over-week analysis
router.get('/week-over-week', ensureAuthenticated, async (req: any, res: any) => {
  try {
    const user = req.user;
    
    // Get data for the past 4 weeks
    const weeks = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - (7 * (i + 1)));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      // Get calendar events for this week
      const events = await getCalendarEvents(user.accessToken, weekStart, weekEnd);
      
      // Analyze this week's data
      const analysis = await analyzeCalendarData(events) as any;
      
      weeks.push({
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        weekLabel: `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        analysis: {
          totalMeetingHours: analysis.totalMeetingHours || 0,
          focusHours: analysis.focusHours || 0,
          focusTimePercentage: analysis.totalMeetingHours > 0 ? 
            Math.round((analysis.focusHours / (analysis.totalMeetingHours + analysis.focusHours)) * 100) : 0,
          categories: analysis.categories || [],
          topCategory: analysis.categories?.[0] || null,
          eventCount: events.length
        }
      });
    }
    
    // Calculate week-over-week trends
    const trends = calculateWeekOverWeekTrends(weeks);
    
    res.json({
      weeks: weeks.reverse(), // Most recent week first
      trends,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Week-over-week analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze week-over-week data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get upcoming events analysis
router.get('/upcoming', ensureAuthenticated, async (req: any, res: any) => {
  try {
    const user = req.user;
    
    // Get upcoming events for the next week
    const startTime = new Date();
    const endTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const events = await getCalendarEvents(user.accessToken, startTime, endTime);
    
    // Get user's workweek settings
    const workweek = await getUserWorkweek(user.id);
    
    // Analyze upcoming schedule
    const suggestions = await analyzeCalendarData(events, true, workweek);
    
    res.json({
      suggestions,
      upcomingEvents: events.length,
      dateRange: {
        start: startTime.toISOString(),
        end: endTime.toISOString()
      }
    });
  } catch (error) {
    console.error('Upcoming events analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze upcoming events',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test endpoint for Gemini analysis (development only)
if (process.env.NODE_ENV === 'development') {
  router.get('/test-analysis', async (_req: any, res: any) => {
    try {
      // Create sample events for testing
      const sampleEvents = [
        {
          id: '1',
          summary: '1:1 with John Doe',
          description: 'Weekly sync',
          start: { dateTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
          end: { dateTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
          attendees: [{ email: 'john.doe@company.com', displayName: 'John Doe' }]
        },
        {
          id: '2',
          summary: 'Team Standup',
          start: { dateTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
          end: { dateTime: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString() },
          attendees: [
            { email: 'alice@company.com', displayName: 'Alice' },
            { email: 'bob@company.com', displayName: 'Bob' },
            { email: 'carol@company.com', displayName: 'Carol' }
          ]
        },
        {
          id: '3',
          summary: 'Focus Time - Strategic Planning',
          start: { dateTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
          end: { dateTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
          attendees: []
        },
        {
          id: '4',
          summary: 'Client Meeting - Acme Corp',
          start: { dateTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
          end: { dateTime: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString() },
          attendees: [
            { email: 'client@acme.com', displayName: 'Client Rep' }
          ]
        },
        {
          id: '5',
          summary: 'Lunch Break',
          start: { dateTime: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString() },
          end: { dateTime: new Date(Date.now() - 19 * 60 * 60 * 1000).toISOString() },
          attendees: []
        }
      ];
      
      const analysis = await analyzeCalendarData(sampleEvents);
      
      // Return the analysis directly as the client expects
      res.json(analysis);
    } catch (error) {
      console.error('Test analysis error:', error);
      res.status(500).json({ 
        error: 'Test analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

// Helper function to calculate week-over-week trends
function calculateWeekOverWeekTrends(weeks: any[]) {
  if (weeks.length < 2) {
    return {
      meetingHours: { change: 0, direction: 'stable', changePercent: 0 },
      focusHours: { change: 0, direction: 'stable', changePercent: 0 },
      focusTimePercentage: { change: 0, direction: 'stable', changePercent: 0 },
      eventCount: { change: 0, direction: 'stable', changePercent: 0 }
    };
  }
  
  // Compare most recent week (index 0 after reverse) with previous week (index 1)
  const currentWeek = weeks[0].analysis;
  const previousWeek = weeks[1].analysis;
  
  const calculateTrend = (current: number, previous: number) => {
    const change = current - previous;
    const changePercent = previous > 0 ? Math.round((change / previous) * 100) : 0;
    let direction: 'up' | 'down' | 'stable' = 'stable';
    
    if (Math.abs(changePercent) >= 5) { // Only show trend if change is >= 5%
      direction = change > 0 ? 'up' : 'down';
    }
    
    return { change, direction, changePercent };
  };
  
  return {
    meetingHours: calculateTrend(currentWeek.totalMeetingHours, previousWeek.totalMeetingHours),
    focusHours: calculateTrend(currentWeek.focusHours, previousWeek.focusHours),
    focusTimePercentage: calculateTrend(currentWeek.focusTimePercentage, previousWeek.focusTimePercentage),
    eventCount: calculateTrend(currentWeek.eventCount, previousWeek.eventCount)
  };
}

// Schedule a calendar event based on actionable suggestion
router.post('/schedule-suggestion', ensureAuthenticated, async (req: any, res: any) => {
  try {
    const user = req.user;
    const { suggestion, timeSlot } = req.body;

    if (!suggestion || !timeSlot) {
      return res.status(400).json({ 
        error: 'Missing required fields: suggestion and timeSlot' 
      });
    }

    const scheduleRequest: ScheduleEventRequest = {
      suggestion,
      timeSlot,
      accessToken: user.accessToken,
    };

    const result = await scheduleCalendarEvent(scheduleRequest);

    if (result.success) {
      res.json({
        success: true,
        eventId: result.eventId,
        eventLink: result.eventLink,
        message: 'Event scheduled successfully!'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to schedule event'
      });
    }
  } catch (error) {
    console.error('Error scheduling suggestion:', error);
    res.status(500).json({ 
      error: 'Failed to schedule calendar event',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as calendarRoutes }; 