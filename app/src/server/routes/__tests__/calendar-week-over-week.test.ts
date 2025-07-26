import request from 'supertest';
import express from 'express';
import { calendarRoutes } from '../calendar';
import { getCalendarEvents } from '../../services/calendar';
import { analyzeCalendarData } from '../../services/gemini';

// Mock the services
jest.mock('../../services/calendar');
jest.mock('../../services/gemini');
jest.mock('../../services/auth', () => ({
  ensureAuthenticated: (_req: any, _res: any, next: any) => {
    // Mock authenticated user
    _req.user = {
      id: 'user1',
      email: 'test@example.com',
      name: 'Test User',
      accessToken: 'mock-token'
    };
    next();
  }
}));

const mockGetCalendarEvents = getCalendarEvents as jest.MockedFunction<typeof getCalendarEvents>;
const mockAnalyzeCalendarData = analyzeCalendarData as jest.MockedFunction<typeof analyzeCalendarData>;

const app = express();
app.use(express.json());
app.use('/api/calendar', calendarRoutes);

const mockCalendarEvents = [
  {
    id: '1',
    summary: '1:1 with John',
    description: 'Weekly sync',
    start: { dateTime: '2025-01-20T10:00:00Z' },
    end: { dateTime: '2025-01-20T11:00:00Z' },
    attendees: [{ email: 'john@company.com', displayName: 'John Doe' }],
    organizer: { email: 'test@example.com' }
  },
  {
    id: '2',
    summary: 'Team Meeting',
    start: { dateTime: '2025-01-20T14:00:00Z' },
    end: { dateTime: '2025-01-20T15:30:00Z' },
    attendees: [
      { email: 'alice@company.com', displayName: 'Alice' },
      { email: 'bob@company.com', displayName: 'Bob' }
    ],
    organizer: { email: 'test@example.com' }
  }
];

const mockAnalysisResult = {
  categories: [
    { name: '1:1 Meetings', totalHours: 4.0, percentage: 40, eventCount: 4 },
    { name: 'Team Meetings', totalHours: 6.0, percentage: 60, eventCount: 4 }
  ],
  totalMeetingHours: 10.0,
  focusHours: 2.0,
  keyInsights: ['You spend 83% of your time in meetings'],
  suggestions: ['Consider blocking more focus time'],
  topCollaborators: [
    { name: 'John Doe', totalHours: 4.0, meetingCount: 4 }
  ],
  lastUpdated: '2025-01-26T10:00:00Z'
};

describe('Calendar Week Over Week API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCalendarEvents.mockResolvedValue(mockCalendarEvents);
    mockAnalyzeCalendarData.mockResolvedValue(mockAnalysisResult);
  });

  describe('GET /api/calendar/week-over-week', () => {
    it('should return week-over-week analysis for authenticated user', async () => {
      const response = await request(app)
        .get('/api/calendar/week-over-week')
        .expect(200);

      expect(response.body).toHaveProperty('weeks');
      expect(response.body).toHaveProperty('trends');
      expect(response.body).toHaveProperty('generatedAt');
      
      // Should have 4 weeks of data
      expect(response.body.weeks).toHaveLength(4);
      
      // Check first week structure
      const firstWeek = response.body.weeks[0];
      expect(firstWeek).toHaveProperty('weekStart');
      expect(firstWeek).toHaveProperty('weekEnd');
      expect(firstWeek).toHaveProperty('weekLabel');
      expect(firstWeek).toHaveProperty('analysis');
      
      // Check analysis structure
      expect(firstWeek.analysis).toHaveProperty('totalMeetingHours');
      expect(firstWeek.analysis).toHaveProperty('focusHours');
      expect(firstWeek.analysis).toHaveProperty('focusTimePercentage');
      expect(firstWeek.analysis).toHaveProperty('categories');
      expect(firstWeek.analysis).toHaveProperty('topCategory');
      expect(firstWeek.analysis).toHaveProperty('eventCount');
    });

    it('should call getCalendarEvents for each week with correct date ranges', async () => {
      await request(app)
        .get('/api/calendar/week-over-week')
        .expect(200);

      // Should call getCalendarEvents 4 times (once for each week)
      expect(mockGetCalendarEvents).toHaveBeenCalledTimes(4);
      
      // Check that dates are properly calculated for each week
      const calls = mockGetCalendarEvents.mock.calls;
      
      // Each call should have accessToken, startDate, endDate
      calls.forEach(call => {
        expect(call[0]).toBe('mock-token'); // accessToken
        expect(call[1]).toBeInstanceOf(Date); // startDate
        expect(call[2]).toBeInstanceOf(Date); // endDate
        
        // Verify the date range is 7 days
        const startDate = call[1] as Date;
        const endDate = call[2] as Date;
        const diffInDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        expect(Math.floor(diffInDays)).toBe(6); // 6 days difference means 7-day week
      });
    });

    it('should call analyzeCalendarData for each week', async () => {
      await request(app)
        .get('/api/calendar/week-over-week')
        .expect(200);

      // Should call analyzeCalendarData 4 times (once for each week)
      expect(mockAnalyzeCalendarData).toHaveBeenCalledTimes(4);
      
      // Each call should pass the calendar events
      mockAnalyzeCalendarData.mock.calls.forEach(call => {
        expect(call[0]).toEqual(mockCalendarEvents);
      });
    });

    it('should calculate trends correctly', async () => {
      // Mock different data for different weeks to test trend calculation
      mockAnalyzeCalendarData
        .mockResolvedValueOnce({
          ...mockAnalysisResult,
          totalMeetingHours: 10.0,
          focusHours: 5.0
        })
        .mockResolvedValueOnce({
          ...mockAnalysisResult,
          totalMeetingHours: 12.0,
          focusHours: 3.0
        })
        .mockResolvedValueOnce({
          ...mockAnalysisResult,
          totalMeetingHours: 8.0,
          focusHours: 4.0
        })
        .mockResolvedValueOnce({
          ...mockAnalysisResult,
          totalMeetingHours: 9.0,
          focusHours: 4.5
        });

      const response = await request(app)
        .get('/api/calendar/week-over-week')
        .expect(200);

      expect(response.body.trends).toHaveProperty('meetingHours');
      expect(response.body.trends).toHaveProperty('focusHours');
      expect(response.body.trends).toHaveProperty('focusTimePercentage');
      expect(response.body.trends).toHaveProperty('eventCount');
      
      // Verify trend structure
      const meetingTrend = response.body.trends.meetingHours;
      expect(meetingTrend).toHaveProperty('change');
      expect(meetingTrend).toHaveProperty('direction');
      expect(meetingTrend).toHaveProperty('changePercent');
      
      // Should compare first week (10h) vs second week (12h) = -2h change
      expect(meetingTrend.change).toBe(-2.0);
      expect(meetingTrend.direction).toBe('down');
    });

    it('should return weeks in correct order (most recent first)', async () => {
      const response = await request(app)
        .get('/api/calendar/week-over-week')
        .expect(200);

      const weeks = response.body.weeks;
      
      // Parse dates and verify they're in descending order
      for (let i = 0; i < weeks.length - 1; i++) {
        const currentWeekStart = new Date(weeks[i].weekStart);
        const nextWeekStart = new Date(weeks[i + 1].weekStart);
        expect(currentWeekStart.getTime()).toBeGreaterThan(nextWeekStart.getTime());
      }
    });

    it('should handle stable trends (changes < 5%)', async () => {
      // Mock similar data to test stable trend detection
      mockAnalyzeCalendarData
        .mockResolvedValueOnce({
          ...mockAnalysisResult,
          totalMeetingHours: 10.0,
          focusHours: 5.0
        })
        .mockResolvedValueOnce({
          ...mockAnalysisResult,
          totalMeetingHours: 10.2, // Only 2% change
          focusHours: 4.9 // Only 2% change
        });

      const response = await request(app)
        .get('/api/calendar/week-over-week')
        .expect(200);

      // Trends with < 5% change should be marked as stable
      expect(response.body.trends.meetingHours.direction).toBe('stable');
      expect(response.body.trends.focusHours.direction).toBe('stable');
    });

    it('should handle calendar service errors gracefully', async () => {
      mockGetCalendarEvents.mockRejectedValue(new Error('Calendar API error'));

      const response = await request(app)
        .get('/api/calendar/week-over-week')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Failed to analyze week-over-week data');
      expect(response.body).toHaveProperty('details');
    });

    it('should handle Gemini analysis errors gracefully', async () => {
      mockAnalyzeCalendarData.mockRejectedValue(new Error('Gemini API error'));

      const response = await request(app)
        .get('/api/calendar/week-over-week')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Failed to analyze week-over-week data');
      expect(response.body).toHaveProperty('details');
    });

    it('should calculate focus time percentage correctly', async () => {
      mockAnalyzeCalendarData.mockResolvedValue({
        ...mockAnalysisResult,
        totalMeetingHours: 20.0,
        focusHours: 10.0
      });

      const response = await request(app)
        .get('/api/calendar/week-over-week')
        .expect(200);

      const firstWeek = response.body.weeks[0];
      
      // Focus percentage should be 10 / (20 + 10) * 100 = 33%
      expect(firstWeek.analysis.focusTimePercentage).toBe(33);
    });

    it('should handle zero meeting hours for focus percentage calculation', async () => {
      mockAnalyzeCalendarData.mockResolvedValue({
        ...mockAnalysisResult,
        totalMeetingHours: 0,
        focusHours: 5.0
      });

      const response = await request(app)
        .get('/api/calendar/week-over-week')
        .expect(200);

      const firstWeek = response.body.weeks[0];
      
      // Should not crash with division by zero
      expect(firstWeek.analysis.focusTimePercentage).toBe(0);
    });

    it('should include week labels in correct format', async () => {
      const response = await request(app)
        .get('/api/calendar/week-over-week')
        .expect(200);

      const weeks = response.body.weeks;
      
      weeks.forEach((week: any) => {
        expect(week.weekLabel).toMatch(/^Week of [A-Za-z]{3} \d{1,2}$/);
      });
    });
  });
});