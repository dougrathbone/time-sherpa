import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface CalendarAnalysis {
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

interface ScheduleSuggestions {
  suggestions: string[];
  anomalies: string[];
  focusTimeRecommendations: string[];
}

interface CalendarAnalysisState {
  analysis: CalendarAnalysis | null;
  suggestions: ScheduleSuggestions | null;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
}

interface CalendarAnalysisContextType extends CalendarAnalysisState {
  fetchAnalysis: () => Promise<void>;
  fetchSuggestions: () => Promise<void>;
  clearData: () => void;
  isStale: () => boolean;
}

const CalendarAnalysisContext = createContext<CalendarAnalysisContextType | undefined>(undefined);

interface CalendarAnalysisProviderProps {
  children: ReactNode;
}

export function CalendarAnalysisProvider({ children }: CalendarAnalysisProviderProps) {
  const [state, setState] = useState<CalendarAnalysisState>({
    analysis: null,
    suggestions: null,
    loading: false,
    error: null,
    lastFetched: null,
  });

  const fetchAnalysis = useCallback(async () => {
    if (state.loading) return; // Prevent duplicate requests

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch('/api/calendar/analysis', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          analysis: data.analysis,
          loading: false,
          lastFetched: new Date(),
        }));
      } else {
        throw new Error('Failed to fetch analysis');
      }
    } catch (err) {
      console.error('Error fetching analysis:', err);
      setState(prev => ({
        ...prev,
        error: 'Failed to load calendar analysis',
        loading: false,
      }));
    }
  }, [state.loading]);

  const fetchSuggestions = useCallback(async () => {
    try {
      const response = await fetch('/api/calendar/upcoming', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          suggestions: data.suggestions,
        }));
      } else {
        throw new Error('Failed to fetch suggestions');
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      // Don't set error for suggestions as they're secondary
    }
  }, []);

  const clearData = useCallback(() => {
    setState({
      analysis: null,
      suggestions: null,
      loading: false,
      error: null,
      lastFetched: null,
    });
  }, []);

  const isStale = useCallback(() => {
    if (!state.lastFetched) return true;
    
    // Consider data stale after 10 minutes
    const staleThreshold = 10 * 60 * 1000; // 10 minutes in milliseconds
    return (Date.now() - state.lastFetched.getTime()) > staleThreshold;
  }, [state.lastFetched]);

  const contextValue: CalendarAnalysisContextType = {
    ...state,
    fetchAnalysis,
    fetchSuggestions,
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