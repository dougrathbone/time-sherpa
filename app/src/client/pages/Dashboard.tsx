import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCalendarAnalysis } from '../hooks/useCalendarAnalysis';
import { useNavigate } from 'react-router-dom';
import TimeAnalysisChart from '../components/TimeAnalysisChart';
import SuggestionsPanel from '../components/SuggestionsPanel';
import LoadingState from '../components/LoadingState';
import { SubscriptionPrompt } from '../components/SubscriptionPrompt';

function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const { 
    analysis, 
    suggestions, 
    loading, 
    error, 
    fetchAnalysis, 
    fetchSuggestions, 
    clearData,
    isStale,
    lastFetched 
  } = useCalendarAnalysis();
  const navigate = useNavigate();
  const [showSubscriptionPrompt, setShowSubscriptionPrompt] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && !user) {
      // Clear analysis data when user logs out
      clearData();
    }
  }, [user, authLoading, clearData]);

  useEffect(() => {
    if (user) {
      // Only fetch if we don't have data or if it's stale
      if (!analysis || isStale()) {
        fetchAnalysis();
      }
      
      // Always fetch suggestions as they're for upcoming events
      if (!suggestions) {
        fetchSuggestions();
      }
    }
  }, [user, analysis, suggestions, isStale, fetchAnalysis, fetchSuggestions]);

  const handleRefresh = async () => {
    await fetchAnalysis();
    await fetchSuggestions();
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

  const getDataFreshnessText = () => {
    if (!lastFetched) return '';
    
    const minutes = Math.floor((Date.now() - lastFetched.getTime()) / (1000 * 60));
    if (minutes < 1) return 'Updated just now';
    if (minutes === 1) return 'Updated 1 minute ago';
    if (minutes < 60) return `Updated ${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return 'Updated 1 hour ago';
    return `Updated ${hours} hours ago`;
  };

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

        {/* Data Freshness and Refresh Controls */}
        {analysis && (
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-sm text-primary-dark/60">
              <div className={`w-2 h-2 rounded-full ${isStale() ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
              {getDataFreshnessText()}
              {isStale() && <span className="text-yellow-600">(Data may be outdated)</span>}
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary-dark/70 hover:text-primary-dark border border-primary-gray/30 rounded-lg hover:bg-white/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
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