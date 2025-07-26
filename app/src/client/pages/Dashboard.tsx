import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCalendarAnalysis } from '../hooks/useCalendarAnalysis';
import { useNavigate } from 'react-router-dom';
import TimeAnalysisChart from '../components/TimeAnalysisChart';
import SuggestionsPanel from '../components/SuggestionsPanel';
import ActionableInsightModal from '../components/ActionableInsightModal';
import LoadingState from '../components/LoadingState';
import { SubscriptionPrompt } from '../components/SubscriptionPrompt';
import { ActionableSuggestion } from '../../shared/types';
import axios from 'axios';

function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const { 
    analysis, 
    loading, 
    error, 
    fetchAnalysis, 
    refreshAnalysis,
    clearData,
    isStale,
    lastFetched 
  } = useCalendarAnalysis();
  const navigate = useNavigate();
  const [showSubscriptionPrompt, setShowSubscriptionPrompt] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<ActionableSuggestion | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuggestionClick = (suggestion: ActionableSuggestion) => {
    setSelectedSuggestion(suggestion);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSuggestion(null);
  };

  const handleSchedule = async (suggestion: ActionableSuggestion, timeSlot: any) => {
    try {
      const response = await axios.post('/api/calendar/schedule-suggestion', {
        suggestion,
        timeSlot
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        // Refresh analysis to potentially get updated suggestions
        refreshAnalysis();
        // Show success message or notification
        console.log('Successfully scheduled:', response.data);
      }
    } catch (error) {
      console.error('Failed to schedule suggestion:', error);
      throw error;
    }
  };

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
      // Fetch analysis if we don't have data
      fetchAnalysis();
    }
  }, [user, fetchAnalysis]);

  const handleRefresh = async () => {
    await refreshAnalysis();
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
                onClick={() => navigate('/week-over-week')}
                className="text-primary-dark/70 hover:text-primary-dark transition-colors"
              >
                Week over Week
              </button>
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
              <div className={`w-2 h-2 rounded-full ${isStale ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
              {getDataFreshnessText()}
              {isStale && <span className="text-yellow-600">(Data may be outdated)</span>}
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
            {analysis && analysis.suggestions && analysis.suggestions.length > 0 && (
              <div className="card mt-6">
                <h3 className="text-xl font-semibold text-primary-dark mb-4">
                  Key Insights
                </h3>
                <ul className="space-y-2">
                  {analysis.suggestions.slice(0, 3).map((insight, index) => (
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
            <SuggestionsPanel 
              suggestions={analysis?.suggestions || []} 
              actionableSuggestions={analysis?.actionableSuggestions || null}
              onSuggestionClick={handleSuggestionClick}
            />
            
            {/* Opportunities for Improvement */}
            {analysis && (
              <div className="card mt-6">
                <h3 className="text-xl font-semibold text-primary-dark mb-4">
                  Opportunities for Improvement
                </h3>
                <div className="space-y-4">
                  {/* Focus Time Opportunity */}
                  {analysis.focusHours < analysis.totalMeetingHours * 0.4 && (
                    <div className="bg-primary-yellow/10 border border-primary-yellow/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary-yellow/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-primary-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-primary-dark mb-1">Increase Focus Time</h4>
                          <p className="text-sm text-primary-dark/70">
                            Your focus time is only {((analysis.focusHours / analysis.totalMeetingHours) * 100).toFixed(0)}% of your meeting time. 
                            Consider blocking dedicated focus hours in your calendar.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Meeting Overload */}
                  {analysis.totalMeetingHours > 30 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-primary-dark mb-1">Reduce Meeting Load</h4>
                          <p className="text-sm text-primary-dark/70">
                            You spent {analysis.totalMeetingHours.toFixed(1)} hours in meetings last month. 
                            Review recurring meetings and consider which ones could be emails or async updates.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Category Imbalance */}
                  {analysis.categories && analysis.categories.length > 0 && 
                   analysis.categories[0].percentage > 50 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-primary-dark mb-1">Balance Your Time</h4>
                          <p className="text-sm text-primary-dark/70">
                            {analysis.categories[0].name} takes up {analysis.categories[0].percentage.toFixed(0)}% of your time. 
                            Consider delegating or redistributing responsibilities.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Default recommendation if no specific issues */}
                  {(!analysis.focusHours || analysis.focusHours >= analysis.totalMeetingHours * 0.4) && 
                   analysis.totalMeetingHours <= 30 && 
                   (!analysis.categories || analysis.categories.length === 0 || analysis.categories[0].percentage <= 50) && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-primary-dark mb-1">Well Balanced Schedule</h4>
                          <p className="text-sm text-primary-dark/70">
                            Your time allocation looks healthy! Keep monitoring for changes and maintain your current balance.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Top Collaborators */}
            {analysis && analysis.topCollaborators && analysis.topCollaborators.length > 0 && (
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
                        {collaborator.totalHours.toFixed(1)}h
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Actionable Insight Modal */}
      <ActionableInsightModal
        suggestion={selectedSuggestion}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSchedule={handleSchedule}
      />
    </div>
  );
}

export default Dashboard; 