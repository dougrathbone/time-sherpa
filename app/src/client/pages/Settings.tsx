import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCalendarAnalysis } from '../hooks/useCalendarAnalysis';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import { withRetry, getErrorMessage, ERROR_MESSAGES } from '../utils/errorHandling';

interface SubscriptionPreferences {
  isSubscribed: boolean;
  frequency: 'daily' | 'weekly' | null;
}

export function Settings() {
  const navigate = useNavigate();
  const { user, checkAuthStatus } = useAuth();
  const { analysis, loading: analysisLoading, fetchAnalysis, refreshAnalysis, lastFetched } = useCalendarAnalysis();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<SubscriptionPreferences>({
    isSubscribed: false,
    frequency: null,
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    // Fetch user preferences on mount
    fetchPreferences();
  }, []);

  useEffect(() => {
    // Redirect if not authenticated
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const fetchPreferences = async () => {
    try {
      const response = await withRetry(
        () => axios.get('/api/v1/subscription', {
          withCredentials: true,
        }),
        {
          maxRetries: 2,
          shouldRetry: (error) => {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
              return false;
            }
            return true;
          }
        }
      );
      setPreferences(response.data);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      const errorMessage = getErrorMessage(error);
      setMessage({ type: 'error', text: errorMessage });
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      await withRetry(
        () => axios.put('/api/v1/subscription', preferences, {
          withCredentials: true,
        }),
        {
          maxRetries: 2,
          retryDelay: 500
        }
      );
      setMessage({ type: 'success', text: 'Preferences saved successfully!' });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSubscription = () => {
    setPreferences(prev => ({
      isSubscribed: !prev.isSubscribed,
      frequency: !prev.isSubscribed ? 'weekly' : null,
    }));
  };

  const handleFrequencyChange = (frequency: 'daily' | 'weekly') => {
    setPreferences(prev => ({
      ...prev,
      frequency,
    }));
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-orange mx-auto"></div>
          <p className="mt-4 text-primary-dark">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-cream">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-primary-dark">Settings</h1>
          <button
            onClick={handleBackToDashboard}
            className="text-primary-teal hover:text-primary-dark transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-primary-dark mb-6">Email Subscription</h2>
          
          {/* Analysis Status - Only show if truly no analysis exists */}
          {!analysisLoading && !analysis && !lastFetched && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">No calendar analysis available yet.</span>
              </div>
              <p className="mt-1 text-sm">
                Return to your dashboard to analyze your calendar data before setting up email summaries.
              </p>
            </div>
          )}
          
          {message && (
            <div className={`p-4 rounded-lg mb-6 ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-primary-cream/50 rounded-lg">
              <div>
                <h3 className="text-lg font-medium text-primary-dark">Email Summaries</h3>
                <p className="text-sm text-primary-dark/70 mt-1">
                  Receive TimeSherpa insights directly in your inbox
                </p>
              </div>
              <button
                onClick={handleToggleSubscription}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.isSubscribed ? 'bg-primary-orange' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.isSubscribed ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {preferences.isSubscribed && (
              <div className="p-4 bg-primary-cream/50 rounded-lg">
                <h3 className="text-lg font-medium text-primary-dark mb-4">Delivery Frequency</h3>
                <div className="space-y-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="frequency"
                      value="daily"
                      checked={preferences.frequency === 'daily'}
                      onChange={() => handleFrequencyChange('daily')}
                      className="mr-3 text-primary-orange focus:ring-primary-orange"
                    />
                    <div>
                      <span className="font-medium text-primary-dark">Daily</span>
                      <p className="text-sm text-primary-dark/70">
                        Get a summary of your previous day's calendar every morning
                      </p>
                    </div>
                  </label>
                  
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="frequency"
                      value="weekly"
                      checked={preferences.frequency === 'weekly'}
                      onChange={() => handleFrequencyChange('weekly')}
                      className="mr-3 text-primary-orange focus:ring-primary-orange"
                    />
                    <div>
                      <span className="font-medium text-primary-dark">Weekly</span>
                      <p className="text-sm text-primary-dark/70">
                        Receive a comprehensive weekly review every Monday morning
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-6">
              <button
                onClick={handleBackToDashboard}
                className="px-6 py-2 border border-primary-gray text-primary-dark rounded-lg hover:bg-primary-cream/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-primary-orange text-white rounded-lg hover:bg-primary-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto mt-6 text-center text-sm text-primary-dark/60">
          <p>
            Email summaries help you stay on top of your time management goals without 
            needing to log in every day.
          </p>
        </div>
      </div>
    </div>
  );
} 