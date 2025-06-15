import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';

interface TimeCategory {
  category: string;
  totalHours: number;
  percentage: number;
  eventCount: number;
  events?: Array<{
    summary: string;
    start: string;
    end: string;
    duration: number;
  }>;
}

interface CalendarAnalysis {
  categories: TimeCategory[];
  totalMeetingHours: number;
  focusHours: number;
  suggestions: string[];
  topCollaborators: Array<{
    name: string;
    meetingCount: number;
    totalHours: number;
  }>;
  lastUpdated: string;
}

interface CalendarAnalysisContextType {
  analysis: CalendarAnalysis | null;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
  isStale: boolean;
  fetchAnalysis: () => Promise<void>;
  refreshAnalysis: () => Promise<void>;
  clearAnalysis: () => void;
}

const CalendarAnalysisContext = createContext<CalendarAnalysisContextType | undefined>(undefined);

// Cache duration in milliseconds (10 minutes)
const CACHE_DURATION = 10 * 60 * 1000;

export function CalendarAnalysisProvider({ children }: { children: React.ReactNode }) {
  const [analysis, setAnalysis] = useState<CalendarAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // Check if the cached data is stale
  const isStale = useCallback(() => {
    if (!lastFetched) return true;
    const now = new Date();
    const timeDiff = now.getTime() - lastFetched.getTime();
    return timeDiff > CACHE_DURATION;
  }, [lastFetched]);

  // Fetch analysis from the API
  const fetchAnalysis = useCallback(async () => {
    // If we have recent data and it's not stale, don't refetch
    if (analysis && !isStale()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/calendar/analysis', {
        withCredentials: true,
      });

      setAnalysis(response.data);
      setLastFetched(new Date());
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError('Not authenticated');
        } else {
          setError(err.response?.data?.error || 'Failed to fetch calendar analysis');
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, [analysis, isStale]);

  // Force refresh analysis (ignore cache)
  const refreshAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/calendar/analysis', {
        withCredentials: true,
      });

      setAnalysis(response.data);
      setLastFetched(new Date());
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError('Not authenticated');
        } else {
          setError(err.response?.data?.error || 'Failed to fetch calendar analysis');
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear the analysis data
  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setLastFetched(null);
    setError(null);
  }, []);

  // Auto-clear on logout
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axios.get('/api/auth/user', { withCredentials: true });
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          clearAnalysis();
        }
      }
    };

    // Check auth status when component mounts
    checkAuth();
  }, [clearAnalysis]);

  const value: CalendarAnalysisContextType = {
    analysis,
    loading,
    error,
    lastFetched,
    isStale: isStale(),
    fetchAnalysis,
    refreshAnalysis,
    clearAnalysis,
  };

  return (
    <CalendarAnalysisContext.Provider value={value}>
      {children}
    </CalendarAnalysisContext.Provider>
  );
}

// Custom hook to use the calendar analysis context
export function useCalendarAnalysis() {
  const context = useContext(CalendarAnalysisContext);
  if (context === undefined) {
    throw new Error('useCalendarAnalysis must be used within a CalendarAnalysisProvider');
  }
  return context;
} 