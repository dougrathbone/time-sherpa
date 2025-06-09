import { Router } from 'express';
import { ensureAuthenticated } from '../services/auth';
import { getCalendarEvents } from '../services/calendar';
import { analyzeCalendarData } from '../services/gemini';

const router = Router();

// Get calendar analysis
router.get('/analysis', ensureAuthenticated, async (req: any, res: any) => {
  try {
    const user = req.user;
    
    // Get calendar events from the past month
    const events = await getCalendarEvents(user.accessToken);
    
    // Analyze with Gemini AI
    const analysis = await analyzeCalendarData(events);
    
    res.json({
      analysis,
      eventsCount: events.length,
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Calendar analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze calendar data',
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
    
    // Analyze upcoming schedule
    const suggestions = await analyzeCalendarData(events, true);
    
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
      
      res.json({
        message: 'Test analysis complete',
        analysis,
        eventsCount: sampleEvents.length
      });
    } catch (error) {
      console.error('Test analysis error:', error);
      res.status(500).json({ 
        error: 'Test analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

export { router as calendarRoutes }; 