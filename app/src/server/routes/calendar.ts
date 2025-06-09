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

export { router as calendarRoutes }; 