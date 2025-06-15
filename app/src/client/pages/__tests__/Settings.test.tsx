import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Settings } from '../Settings';
import { useAuth } from '../../hooks/useAuth';
import { useCalendarAnalysis } from '../../hooks/useCalendarAnalysis';
import axios from 'axios';

// Mock dependencies
jest.mock('../../hooks/useAuth');
jest.mock('../../hooks/useCalendarAnalysis');
jest.mock('axios');

// Mock the error handling utilities
jest.mock('../../utils/errorHandling', () => ({
  withRetry: jest.fn(async (fn) => {
    try {
      return await fn();
    } catch (error) {
      throw error;
    }
  }),
  getErrorMessage: jest.fn((error: any) => {
    if (error?.response?.status === 401) {
      return 'Your session has expired. Please sign in again.';
    }
    return 'An error occurred';
  }),
  ERROR_MESSAGES: {
    SUBSCRIPTION_UPDATE_FAILED: 'Unable to update your subscription preferences. Please try again.',
  },
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedUseCalendarAnalysis = useCalendarAnalysis as jest.MockedFunction<typeof useCalendarAnalysis>;
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Settings', () => {
  const mockUser = {
    id: '123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockAnalysis = {
    categories: [],
    totalMeetingHours: 20,
    focusHours: 10,
    suggestions: [],
    topCollaborators: [],
    lastUpdated: '2024-01-01T10:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockedUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuthStatus: jest.fn(),
    });

    mockedUseCalendarAnalysis.mockReturnValue({
      analysis: mockAnalysis,
      loading: false,
      error: null,
      lastFetched: new Date(),
      fetchAnalysis: jest.fn(),
      refreshAnalysis: jest.fn(),
      clearData: jest.fn(),
      isStale: false,
    });
  });

  it('renders settings page successfully', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { isSubscribed: false, frequency: null },
    });

    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Email Subscription')).toBeInTheDocument();
    });
  });

  it('fetches user preferences on mount', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { isSubscribed: true, frequency: 'weekly' },
    });

    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/subscription', {
        withCredentials: true,
      });
    });
  });

  it('handles fetch preferences error', async () => {
    mockedAxios.get.mockRejectedValue({
      response: { status: 500 },
      isAxiosError: true,
    });

    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('An error occurred')).toBeInTheDocument();
    });
  });

  it('redirects to home if user is not authenticated', async () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuthStatus: jest.fn(),
    });

    mockedAxios.get.mockResolvedValue({
      data: { isSubscribed: false, frequency: null },
    });

    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('toggles subscription status', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { isSubscribed: false, frequency: null },
    });

    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Email Summaries')).toBeInTheDocument();
    });

    const toggleButton = screen.getByRole('button', { name: '' });
    fireEvent.click(toggleButton);

    // Should show frequency options when toggled on
    await waitFor(() => {
      expect(screen.getByText('Delivery Frequency')).toBeInTheDocument();
      expect(screen.getByLabelText(/Daily/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Weekly/)).toBeInTheDocument();
    });
  });

  it('saves preferences successfully', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { isSubscribed: false, frequency: null },
    });
    mockedAxios.put.mockResolvedValue({});

    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Save Preferences')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save Preferences');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        '/api/v1/subscription',
        { isSubscribed: false, frequency: null },
        { withCredentials: true }
      );
      expect(screen.getByText('Preferences saved successfully!')).toBeInTheDocument();
    });
  });

  it('handles save preferences error', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { isSubscribed: false, frequency: null },
    });
    mockedAxios.put.mockRejectedValue({
      response: { status: 500 },
      isAxiosError: true,
    });

    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Save Preferences')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save Preferences');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('An error occurred')).toBeInTheDocument();
    });
  });

  it('navigates back to dashboard', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { isSubscribed: false, frequency: null },
    });

    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('← Back to Dashboard')).toBeInTheDocument();
    });

    const backButton = screen.getByText('← Back to Dashboard');
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('shows loading state while fetching preferences', () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    expect(screen.getByText('Loading preferences...')).toBeInTheDocument();
  });

  it('shows analysis warning when no analysis exists', async () => {
    mockedUseCalendarAnalysis.mockReturnValue({
      analysis: null,
      loading: false,
      error: null,
      lastFetched: null,
      fetchAnalysis: jest.fn(),
      refreshAnalysis: jest.fn(),
      clearData: jest.fn(),
      isStale: false,
    });

    mockedAxios.get.mockResolvedValue({
      data: { isSubscribed: false, frequency: null },
    });

    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No calendar analysis available yet.')).toBeInTheDocument();
    });
  });
}); 