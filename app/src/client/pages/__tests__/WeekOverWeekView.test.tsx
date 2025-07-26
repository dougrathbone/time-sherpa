import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import WeekOverWeekView from '../WeekOverWeekView';
import { useAuth } from '../../hooks/useAuth';

// Mock the useAuth hook
jest.mock('../../hooks/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockWeekOverWeekData = {
  weeks: [
    {
      weekStart: '2025-01-20T00:00:00.000Z',
      weekEnd: '2025-01-26T23:59:59.999Z',
      weekLabel: 'Week of Jan 20',
      analysis: {
        totalMeetingHours: 25.5,
        focusHours: 12.0,
        focusTimePercentage: 32,
        categories: [
          { name: '1:1 Meetings', totalHours: 8.5, percentage: 33, eventCount: 12 },
          { name: 'Team Meetings', totalHours: 10.0, percentage: 39, eventCount: 8 },
        ],
        topCategory: { name: 'Team Meetings', totalHours: 10.0, percentage: 39, eventCount: 8 },
        eventCount: 35
      }
    },
    {
      weekStart: '2025-01-13T00:00:00.000Z',
      weekEnd: '2025-01-19T23:59:59.999Z',
      weekLabel: 'Week of Jan 13',
      analysis: {
        totalMeetingHours: 30.0,
        focusHours: 8.0,
        focusTimePercentage: 21,
        categories: [
          { name: '1:1 Meetings', totalHours: 12.0, percentage: 40, eventCount: 15 },
          { name: 'Team Meetings', totalHours: 12.0, percentage: 40, eventCount: 10 },
        ],
        topCategory: { name: '1:1 Meetings', totalHours: 12.0, percentage: 40, eventCount: 15 },
        eventCount: 42
      }
    }
  ],
  trends: {
    meetingHours: { change: -4.5, direction: 'down' as const, changePercent: -15 },
    focusHours: { change: 4.0, direction: 'up' as const, changePercent: 50 },
    focusTimePercentage: { change: 11, direction: 'up' as const, changePercent: 52 },
    eventCount: { change: -7, direction: 'down' as const, changePercent: -17 }
  },
  generatedAt: '2025-01-26T10:00:00.000Z'
};

const renderWeekOverWeekView = () => {
  return render(
    <BrowserRouter>
      <WeekOverWeekView />
    </BrowserRouter>
  );
};

describe('WeekOverWeekView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it('redirects to landing page when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuthStatus: jest.fn(),
    });

    renderWeekOverWeekView();

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('shows loading state while authenticating', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuthStatus: jest.fn(),
    });

    renderWeekOverWeekView();

    expect(screen.getByText('Analyzing Your Calendar')).toBeInTheDocument();
  });

  it('fetches and displays week-over-week data for authenticated user', async () => {
    const mockUser = {
      id: 'user1',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg'
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuthStatus: jest.fn(),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockWeekOverWeekData,
    } as Response);

    renderWeekOverWeekView();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/calendar/week-over-week', {
        credentials: 'include'
      });
    });

    // Check if key trends are displayed
    await waitFor(() => {
      expect(screen.getByText('Key Trends (This Week vs Last Week)')).toBeInTheDocument();
      expect(screen.getAllByText('25.5h')[0]).toBeInTheDocument(); // Meeting hours
      expect(screen.getAllByText('12.0h')[0]).toBeInTheDocument(); // Focus hours
      expect(screen.getAllByText('32%')[0]).toBeInTheDocument(); // Focus percentage
      expect(screen.getAllByText('35')[0]).toBeInTheDocument(); // Event count
    });
  });

  it('displays trend indicators correctly', async () => {
    const mockUser = {
      id: 'user1',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg'
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuthStatus: jest.fn(),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockWeekOverWeekData,
    } as Response);

    renderWeekOverWeekView();

    await waitFor(() => {
      // Should show down arrow for meeting hours (good trend)
      expect(screen.getByText('-4.5h (-15%)')).toBeInTheDocument();
      // Should show up arrow for focus hours (good trend)
      expect(screen.getByText('+4.0h (+50%)')).toBeInTheDocument();
      // Should show up arrow for focus percentage (good trend)
      expect(screen.getByText('+11% (+52%)')).toBeInTheDocument();
    });
  });

  it('displays weekly breakdown table', async () => {
    const mockUser = {
      id: 'user1',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg'
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuthStatus: jest.fn(),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockWeekOverWeekData,
    } as Response);

    renderWeekOverWeekView();

    await waitFor(() => {
      expect(screen.getByText('4-Week Breakdown')).toBeInTheDocument();
      expect(screen.getByText('Week of Jan 20')).toBeInTheDocument();
      expect(screen.getByText('Week of Jan 13')).toBeInTheDocument();
      expect(screen.getByText('Most Recent')).toBeInTheDocument();
    });
  });

  it('displays performance insights', async () => {
    const mockUser = {
      id: 'user1',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg'
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuthStatus: jest.fn(),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockWeekOverWeekData,
    } as Response);

    renderWeekOverWeekView();

    await waitFor(() => {
      expect(screen.getByText('Performance Insights')).toBeInTheDocument();
      expect(screen.getByText('Focus Time Progress')).toBeInTheDocument();
      expect(screen.getByText('Meeting Load Trends')).toBeInTheDocument();
      expect(screen.getByText('Overall Assessment')).toBeInTheDocument();
    });
  });

  it('shows positive insight when focus increases and meetings decrease', async () => {
    const mockUser = {
      id: 'user1',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg'
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuthStatus: jest.fn(),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockWeekOverWeekData,
    } as Response);

    renderWeekOverWeekView();

    await waitFor(() => {
      expect(screen.getByText(/Great job! Your focus time increased/)).toBeInTheDocument();
      expect(screen.getByText(/Your meeting hours decreased/)).toBeInTheDocument();
      expect(screen.getByText(/Excellent progress!/)).toBeInTheDocument();
    });
  });

  it('handles fetch errors gracefully', async () => {
    const mockUser = {
      id: 'user1',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg'
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuthStatus: jest.fn(),
    });

    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    renderWeekOverWeekView();

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it('navigates back to dashboard when back button is clicked', async () => {
    const mockUser = {
      id: 'user1',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg'
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuthStatus: jest.fn(),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockWeekOverWeekData,
    } as Response);

    renderWeekOverWeekView();

    const backButton = await screen.findByText('← Back to Dashboard');
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('can refresh data when refresh button is clicked', async () => {
    const mockUser = {
      id: 'user1',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg'
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuthStatus: jest.fn(),
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockWeekOverWeekData,
    } as Response);

    renderWeekOverWeekView();

    // Wait for initial load and data to appear
    await waitFor(() => {
      expect(screen.getByText('Key Trends (This Week vs Last Week)')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  it('displays stable trends correctly', async () => {
    const stableData = {
      ...mockWeekOverWeekData,
      trends: {
        meetingHours: { change: 0.5, direction: 'stable' as const, changePercent: 2 },
        focusHours: { change: -0.2, direction: 'stable' as const, changePercent: -3 },
        focusTimePercentage: { change: 1, direction: 'stable' as const, changePercent: 3 },
        eventCount: { change: 1, direction: 'stable' as const, changePercent: 2 }
      }
    };

    const mockUser = {
      id: 'user1',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg'
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuthStatus: jest.fn(),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => stableData,
    } as Response);

    renderWeekOverWeekView();

    await waitFor(() => {
      // Look for stable trend indicators - check for the "→" symbol and stable messages
      expect(screen.getByText('No significant change (2%)')).toBeInTheDocument();
      expect(screen.getByText('No significant change (3%)')).toBeInTheDocument();
    });
  });
});