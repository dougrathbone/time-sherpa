import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import axios from 'axios';

interface TimeCategory {
  name: string;
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

interface CalendarAnalysisState {
  analysis: CalendarAnalysis | null;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
}

interface CalendarAnalysisContextType extends CalendarAnalysisState {
  fetchAnalysis: () => Promise<void>;
  refreshAnalysis: () => Promise<void>;
  clearData: () => void;
  isStale: boolean;
}

const CalendarAnalysisContext = createContext<CalendarAnalysisContextType | undefined>(undefined);

// Cache duration in milliseconds (10 minutes)
const CACHE_DURATION = 10 * 60 * 1000;

interface CalendarAnalysisProviderProps {
  children: ReactNode;
}

export function CalendarAnalysisProvider({ children }: CalendarAnalysisProviderProps) {
  const [state, setState] = useState<CalendarAnalysisState>({
    analysis: null,
    loading: false,
    error: null,
    lastFetched: null,
  });

  // Use ref to track loading state without causing re-renders
  const loadingRef = useRef(false);

  // Check if the cached data is stale
  const checkIsStale = useCallback(() => {
    if (!state.lastFetched) return true;
    const timeDiff = Date.now() - state.lastFetched.getTime();
    return timeDiff > CACHE_DURATION;
  }, [state.lastFetched]);

  const isStale = checkIsStale();

  const fetchAnalysis = useCallback(async () => {
    // Check current state inside the callback
    setState(currentState => {
      // If we have recent data and it's not stale, don't refetch
      if (currentState.analysis && currentState.lastFetched) {
        const timeDiff = Date.now() - currentState.lastFetched.getTime();
        if (timeDiff < CACHE_DURATION) {
          return currentState; // No state change
        }
      }

      // Prevent duplicate requests
      if (loadingRef.current) {
        return currentState;
      }

      loadingRef.current = true;
      return { ...currentState, loading: true, error: null };
    });

    // Only proceed if we actually started loading
    if (!loadingRef.current) return;
    
    try {
      const response = await axios.get('/api/calendar/analysis', {
        withCredentials: true,
      });
      
      setState(prev => ({
        ...prev,
        analysis: response.data,
        loading: false,
        lastFetched: new Date(),
        error: null,
      }));
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setState(prev => ({
            ...prev,
            error: 'Not authenticated',
            loading: false,
          }));
        } else {
          setState(prev => ({
            ...prev,
            error: err.response?.data?.error || 'Failed to fetch calendar analysis',
            loading: false,
          }));
        }
      } else {
        setState(prev => ({
          ...prev,
          error: 'An unexpected error occurred',
          loading: false,
        }));
      }
    } finally {
      loadingRef.current = false;
    }
  }, []); // No dependencies - function is stable

  // Force refresh analysis (ignore cache)
  const refreshAnalysis = useCallback(async () => {
    loadingRef.current = true;
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await axios.get('/api/calendar/analysis', {
        withCredentials: true,
      });
      
      setState(prev => ({
        ...prev,
        analysis: response.data,
        loading: false,
        lastFetched: new Date(),
        error: null,
      }));
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setState(prev => ({
            ...prev,
            error: 'Not authenticated',
            loading: false,
          }));
        } else {
          setState(prev => ({
            ...prev,
            error: err.response?.data?.error || 'Failed to fetch calendar analysis',
            loading: false,
          }));
        }
      } else {
        setState(prev => ({
          ...prev,
          error: 'An unexpected error occurred',
          loading: false,
        }));
      }
    } finally {
      loadingRef.current = false;
    }
  }, []); // No dependencies - function is stable

  const clearData = useCallback(() => {
    setState({
      analysis: null,
      loading: false,
      error: null,
      lastFetched: null,
    });
  }, []); // No dependencies - function is stable

  const contextValue: CalendarAnalysisContextType = {
    ...state,
    fetchAnalysis,
    refreshAnalysis,
    clearData,
    isStale,
  };

  return (
    <CalendarAnalysisContext.Provider value={contextValue}>
      {children}
    </CalendarAnalysisContext.Provider>
  );
}

export function useCalendarAnalysis() {
  const context = useContext(CalendarAnalysisContext);
  if (context === undefined) {
    throw new Error('useCalendarAnalysis must be used within a CalendarAnalysisProvider');
  }
  return context;
} 