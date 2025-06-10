import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import TimeAnalysisChart from '../components/TimeAnalysisChart';
import SuggestionsPanel from '../components/SuggestionsPanel';
import LoadingState from '../components/LoadingState';
import { SubscriptionPrompt } from '../components/SubscriptionPrompt';

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

function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<CalendarAnalysis | null>(null);
  const [suggestions, setSuggestions] = useState<ScheduleSuggestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubscriptionPrompt, setShowSubscriptionPrompt] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAnalysis();
      fetchSuggestions();
    }
  }, [user]);

  const fetchAnalysis = async () => {
    try {
      const response = await fetch('/api/calendar/analysis', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
      } else {
        throw new Error('Failed to fetch analysis');
      }
    } catch (err) {
      console.error('Error fetching analysis:', err);
      setError('Failed to load calendar analysis');
    }
  };

  const fetchSuggestions = async () => {
    try {
      const response = await fetch('/api/calendar/upcoming', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions);
      } else {
        throw new Error('Failed to fetch suggestions');
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissPrompt = () => {
    setShowSubscriptionPrompt(false);
    // Store in localStorage to remember dismissal
    localStorage.setItem('subscriptionPromptDismissed', 'true');
  };

  useEffect(() => {
    // Check if prompt was previously dismissed
    const dismissed = localStorage.getItem('subscriptionPromptDismissed');
    if (dismissed === 'true') {
      setShowSubscriptionPrompt(false);
    }
  }, []);

  if (authLoading || loading) {
    return <LoadingState />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-primary-cream">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="TimeSherpa Logo" className="h-10 w-10" />
              <h1 className="text-2xl font-bold text-primary-dark">TimeSherpa</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {user.picture && (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-primary-dark font-medium">{user.name}</span>
              </div>
              <button
                onClick={() => navigate('/settings')}
                className="text-primary-dark/70 hover:text-primary-dark transition-colors"
              >
                Settings
              </button>
              <button
                onClick={logout}
                className="text-primary-dark/70 hover:text-primary-dark transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Subscription Prompt */}
        {showSubscriptionPrompt && analysis && (
          <SubscriptionPrompt onDismiss={handleDismissPrompt} />
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Time Analysis Section */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-2xl font-bold text-primary-dark mb-6">
                Time Analysis - Past Month
              </h2>
              {analysis ? (
                <TimeAnalysisChart analysis={analysis} />
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="loading-spinner"></div>
                </div>
              )}
            </div>

            {/* Key Insights */}
            {analysis && analysis.keyInsights.length > 0 && (
              <div className="card mt-6">
                <h3 className="text-xl font-semibold text-primary-dark mb-4">
                  Key Insights
                </h3>
                <ul className="space-y-2">
                  {analysis.keyInsights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary-orange rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-primary-dark/80">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Suggestions Panel */}
          <div className="lg:col-span-1">
            <SuggestionsPanel suggestions={suggestions} />
            
            {/* Top Collaborators */}
            {analysis && analysis.topCollaborators.length > 0 && (
              <div className="card mt-6">
                <h3 className="text-xl font-semibold text-primary-dark mb-4">
                  Top Collaborators
                </h3>
                <div className="space-y-3">
                  {analysis.topCollaborators.map((collaborator, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-primary-dark font-medium">
                        {collaborator.name}
                      </span>
                      <span className="text-primary-dark/70">
                        {collaborator.hours.toFixed(1)}h
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard; 