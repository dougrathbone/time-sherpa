import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { CalendarAnalysisProvider, useCalendarAnalysis } from '../useCalendarAnalysis';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('useCalendarAnalysis', () => {
  const mockAnalysis = {
    categories: [
      { category: 'Meetings', totalHours: 20, percentage: 50, eventCount: 15 },
      { category: 'Focus Time', totalHours: 10, percentage: 25, eventCount: 5 },
    ],
    totalMeetingHours: 20,
    focusHours: 10,
    suggestions: ['Consider blocking more focus time', 'Your meeting load is high'],
    topCollaborators: [
      { name: 'John Doe', meetingCount: 5, totalHours: 8 },
      { name: 'Jane Smith', meetingCount: 3, totalHours: 5 },
    ],
    lastUpdated: '2024-01-01T10:00:00Z',
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CalendarAnalysisProvider>{children}</CalendarAnalysisProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Mock axios.isAxiosError
    mockedAxios.isAxiosError = jest.fn((error: any): error is any => {
      return error && error.isAxiosError === true;
    }) as any;
    
    // Mock the initial auth check
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/auth/user') {
        return Promise.resolve({ data: { user: { id: '123', name: 'Test User' } } });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useCalendarAnalysis(), { wrapper });

    expect(result.current.analysis).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastFetched).toBeNull();
    expect(result.current.isStale).toBe(true);
  });

  it('should fetch analysis successfully', async () => {
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/auth/user') {
        return Promise.resolve({ data: { user: { id: '123', name: 'Test User' } } });
      }
      if (url === '/api/calendar/analysis') {
        return Promise.resolve({ data: mockAnalysis });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useCalendarAnalysis(), { wrapper });

    await act(async () => {
      await result.current.fetchAnalysis();
    });

    expect(result.current.analysis).toEqual(mockAnalysis);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastFetched).not.toBeNull();
    expect(result.current.isStale).toBe(false);
  });

  it('should handle fetch error', async () => {
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/auth/user') {
        return Promise.resolve({ data: { user: { id: '123', name: 'Test User' } } });
      }
      if (url === '/api/calendar/analysis') {
        return Promise.reject({
          response: { status: 500, data: { error: 'Server error' } },
          isAxiosError: true,
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useCalendarAnalysis(), { wrapper });

    await act(async () => {
      await result.current.fetchAnalysis();
    });

    expect(result.current.analysis).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Server error');
  });

  it('should handle 401 error', async () => {
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/auth/user') {
        return Promise.resolve({ data: { user: { id: '123', name: 'Test User' } } });
      }
      if (url === '/api/calendar/analysis') {
        return Promise.reject({
          response: { status: 401 },
          isAxiosError: true,
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useCalendarAnalysis(), { wrapper });

    await act(async () => {
      await result.current.fetchAnalysis();
    });

    expect(result.current.error).toBe('Not authenticated');
  });

  it('should not refetch if data is fresh', async () => {
    let analysisCallCount = 0;
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/auth/user') {
        return Promise.resolve({ data: { user: { id: '123', name: 'Test User' } } });
      }
      if (url === '/api/calendar/analysis') {
        analysisCallCount++;
        return Promise.resolve({ data: mockAnalysis });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useCalendarAnalysis(), { wrapper });

    // First fetch
    await act(async () => {
      await result.current.fetchAnalysis();
    });

    expect(analysisCallCount).toBe(1);

    // Second fetch should not trigger API call
    await act(async () => {
      await result.current.fetchAnalysis();
    });

    expect(analysisCallCount).toBe(1);
  });

  it('should refetch if data is stale', async () => {
    let analysisCallCount = 0;
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/auth/user') {
        return Promise.resolve({ data: { user: { id: '123', name: 'Test User' } } });
      }
      if (url === '/api/calendar/analysis') {
        analysisCallCount++;
        return Promise.resolve({ data: mockAnalysis });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useCalendarAnalysis(), { wrapper });

    // First fetch
    await act(async () => {
      await result.current.fetchAnalysis();
    });

    expect(analysisCallCount).toBe(1);
    expect(result.current.isStale).toBe(false);

    // Fast forward 11 minutes to make data stale
    act(() => {
      jest.advanceTimersByTime(11 * 60 * 1000);
    });

    // Force re-render to update isStale
    const { result: result2 } = renderHook(() => useCalendarAnalysis(), { wrapper });

    // Should refetch since data is stale
    await act(async () => {
      await result2.current.fetchAnalysis();
    });

    expect(analysisCallCount).toBe(2);
  });

  it('should force refresh with refreshAnalysis', async () => {
    let analysisCallCount = 0;
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/auth/user') {
        return Promise.resolve({ data: { user: { id: '123', name: 'Test User' } } });
      }
      if (url === '/api/calendar/analysis') {
        analysisCallCount++;
        return Promise.resolve({ data: mockAnalysis });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useCalendarAnalysis(), { wrapper });

    // First fetch
    await act(async () => {
      await result.current.fetchAnalysis();
    });

    expect(analysisCallCount).toBe(1);

    // Force refresh should always fetch
    await act(async () => {
      await result.current.refreshAnalysis();
    });

    expect(analysisCallCount).toBe(2);
  });

  it('should clear data', async () => {
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/auth/user') {
        return Promise.resolve({ data: { user: { id: '123', name: 'Test User' } } });
      }
      if (url === '/api/calendar/analysis') {
        return Promise.resolve({ data: mockAnalysis });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useCalendarAnalysis(), { wrapper });

    await act(async () => {
      await result.current.fetchAnalysis();
    });

    expect(result.current.analysis).toEqual(mockAnalysis);

    act(() => {
      result.current.clearData();
    });

    expect(result.current.analysis).toBeNull();
    expect(result.current.lastFetched).toBeNull();
    expect(result.current.error).toBeNull();
  });
}); 