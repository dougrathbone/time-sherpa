import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface SubscriptionPreferences {
  isSubscribed: boolean;
  frequency: 'daily' | 'weekly' | null;
}

export function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<SubscriptionPreferences>({
    isSubscribed: false,
    frequency: null,
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await axios.get('/api/v1/subscription', {
        withCredentials: true,
      });
      setPreferences(response.data);
    } catch (error) {
      console.error('Error fetching preferences:', error);
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
      await axios.put('/api/v1/subscription', preferences, {
        withCredentials: true,
      });
      setMessage({ type: 'success', text: 'Preferences saved successfully!' });
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-primary-dark">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-light">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-primary-dark">Settings</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-secondary hover:text-secondary-dark transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-primary-dark mb-6">Email Subscription</h2>
          
          {message && (
            <div className={`p-4 rounded-lg mb-6 ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-neutral-light rounded-lg">
              <div>
                <h3 className="text-lg font-medium text-primary-dark">Email Summaries</h3>
                <p className="text-sm text-neutral-dark mt-1">
                  Receive TimeSherpa insights directly in your inbox
                </p>
              </div>
              <button
                onClick={handleToggleSubscription}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.isSubscribed ? 'bg-accent' : 'bg-gray-300'
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
              <div className="p-4 bg-neutral-light rounded-lg">
                <h3 className="text-lg font-medium text-primary-dark mb-4">Delivery Frequency</h3>
                <div className="space-y-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="frequency"
                      value="daily"
                      checked={preferences.frequency === 'daily'}
                      onChange={() => handleFrequencyChange('daily')}
                      className="mr-3 text-accent focus:ring-accent"
                    />
                    <div>
                      <span className="font-medium text-primary-dark">Daily</span>
                      <p className="text-sm text-neutral-dark">
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
                      className="mr-3 text-accent focus:ring-accent"
                    />
                    <div>
                      <span className="font-medium text-primary-dark">Weekly</span>
                      <p className="text-sm text-neutral-dark">
                        Receive a comprehensive weekly review every Monday morning
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-6">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 border border-neutral-dark text-neutral-dark rounded-lg hover:bg-neutral-light transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto mt-6 text-center text-sm text-neutral-dark">
          <p>
            Email summaries help you stay on top of your time management goals without 
            needing to log in every day.
          </p>
        </div>
      </div>
    </div>
  );
} 