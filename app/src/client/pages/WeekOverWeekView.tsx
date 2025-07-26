import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import LoadingState from '../components/LoadingState';

interface WeekData {
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  analysis: {
    totalMeetingHours: number;
    focusHours: number;
    focusTimePercentage: number;
    categories: Array<{
      name: string;
      totalHours: number;
      percentage: number;
      eventCount: number;
    }>;
    topCategory: {
      name: string;
      totalHours: number;
      percentage: number;
      eventCount: number;
    } | null;
    eventCount: number;
  };
}

interface TrendData {
  change: number;
  direction: 'up' | 'down' | 'stable';
  changePercent: number;
}

interface WeekOverWeekData {
  weeks: WeekData[];
  trends: {
    meetingHours: TrendData;
    focusHours: TrendData;
    focusTimePercentage: TrendData;
    eventCount: TrendData;
  };
  generatedAt: string;
}

function WeekOverWeekView() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<WeekOverWeekData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchWeekOverWeekData();
    }
  }, [user]);

  const fetchWeekOverWeekData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/calendar/week-over-week', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      
      const weekOverWeekData = await response.json();
      setData(weekOverWeekData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load week-over-week data');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <span className="text-green-600">↗</span>;
      case 'down':
        return <span className="text-red-600">↘</span>;
      default:
        return <span className="text-gray-500">→</span>;
    }
  };

  const getTrendColor = (direction: string, metric: string) => {
    if (direction === 'stable') return 'text-gray-600';
    
    // For focus metrics, up is good (green), down is bad (red)
    // For meeting metrics, up is bad (red), down is good (green)
    const isFocusMetric = metric.includes('focus');
    
    if (direction === 'up') {
      return isFocusMetric ? 'text-green-600' : 'text-red-600';
    } else {
      return isFocusMetric ? 'text-red-600' : 'text-green-600';
    }
  };

  const formatTrendText = (trend: TrendData, metric: string, unit: string = '') => {
    if (trend.direction === 'stable') {
      return `No significant change (${Math.abs(trend.changePercent)}%)`;
    }
    
    const sign = trend.change > 0 ? '+' : '';
    return `${sign}${trend.change.toFixed(1)}${unit} (${trend.changePercent > 0 ? '+' : ''}${trend.changePercent}%)`;
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
              <button
                onClick={() => navigate('/dashboard')}
                className="text-primary-dark/70 hover:text-primary-dark transition-colors mr-2"
              >
                ← Back to Dashboard
              </button>
              <img src="/logo.png" alt="TimeSherpa Logo" className="h-10 w-10" />
              <h1 className="text-2xl font-bold text-primary-dark">Week over Week Analysis</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={fetchWeekOverWeekData}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary-dark/70 hover:text-primary-dark border border-primary-gray/30 rounded-lg hover:bg-white/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {data && (
          <>
            {/* Key Trends Summary */}
            <div className="card mb-8">
              <h2 className="text-2xl font-bold text-primary-dark mb-6">
                Key Trends (This Week vs Last Week)
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-primary-dark">Meeting Hours</h3>
                    {getTrendIcon(data.trends.meetingHours.direction)}
                  </div>
                  <div className="text-2xl font-bold text-primary-dark mb-1">
                    {data.weeks[0]?.analysis.totalMeetingHours.toFixed(1)}h
                  </div>
                  <div className={`text-sm ${getTrendColor(data.trends.meetingHours.direction, 'meeting')}`}>
                    {formatTrendText(data.trends.meetingHours, 'meeting', 'h')}
                  </div>
                </div>

                <div className="bg-white/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-primary-dark">Focus Hours</h3>
                    {getTrendIcon(data.trends.focusHours.direction)}
                  </div>
                  <div className="text-2xl font-bold text-primary-dark mb-1">
                    {data.weeks[0]?.analysis.focusHours.toFixed(1)}h
                  </div>
                  <div className={`text-sm ${getTrendColor(data.trends.focusHours.direction, 'focus')}`}>
                    {formatTrendText(data.trends.focusHours, 'focus', 'h')}
                  </div>
                </div>

                <div className="bg-white/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-primary-dark">Focus Time %</h3>
                    {getTrendIcon(data.trends.focusTimePercentage.direction)}
                  </div>
                  <div className="text-2xl font-bold text-primary-dark mb-1">
                    {data.weeks[0]?.analysis.focusTimePercentage}%
                  </div>
                  <div className={`text-sm ${getTrendColor(data.trends.focusTimePercentage.direction, 'focus')}`}>
                    {formatTrendText(data.trends.focusTimePercentage, 'focus', '%')}
                  </div>
                </div>

                <div className="bg-white/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-primary-dark">Total Events</h3>
                    {getTrendIcon(data.trends.eventCount.direction)}
                  </div>
                  <div className="text-2xl font-bold text-primary-dark mb-1">
                    {data.weeks[0]?.analysis.eventCount}
                  </div>
                  <div className={`text-sm ${getTrendColor(data.trends.eventCount.direction, 'meeting')}`}>
                    {formatTrendText(data.trends.eventCount, 'event')}
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Breakdown */}
            <div className="card mb-8">
              <h2 className="text-2xl font-bold text-primary-dark mb-6">
                4-Week Breakdown
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-primary-gray/20">
                      <th className="text-left py-3 px-4 font-medium text-primary-dark">Week</th>
                      <th className="text-left py-3 px-4 font-medium text-primary-dark">Meeting Hours</th>
                      <th className="text-left py-3 px-4 font-medium text-primary-dark">Focus Hours</th>
                      <th className="text-left py-3 px-4 font-medium text-primary-dark">Focus %</th>
                      <th className="text-left py-3 px-4 font-medium text-primary-dark">Top Category</th>
                      <th className="text-left py-3 px-4 font-medium text-primary-dark">Events</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.weeks.map((week, index) => (
                      <tr key={week.weekStart} className={`border-b border-primary-gray/10 ${index === 0 ? 'bg-primary-yellow/10' : ''}`}>
                        <td className="py-3 px-4">
                          <div className="font-medium text-primary-dark">{week.weekLabel}</div>
                          {index === 0 && (
                            <div className="text-xs text-primary-orange">Most Recent</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-primary-dark">
                          {week.analysis.totalMeetingHours.toFixed(1)}h
                        </td>
                        <td className="py-3 px-4 text-primary-dark">
                          {week.analysis.focusHours.toFixed(1)}h
                        </td>
                        <td className="py-3 px-4 text-primary-dark">
                          {week.analysis.focusTimePercentage}%
                        </td>
                        <td className="py-3 px-4 text-primary-dark">
                          {week.analysis.topCategory ? 
                            `${week.analysis.topCategory.name} (${week.analysis.topCategory.totalHours.toFixed(1)}h)` : 
                            'No meetings'
                          }
                        </td>
                        <td className="py-3 px-4 text-primary-dark">
                          {week.analysis.eventCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Performance Insights */}
            <div className="card">
              <h2 className="text-2xl font-bold text-primary-dark mb-6">
                Performance Insights
              </h2>
              <div className="space-y-4">
                {/* Focus Time Analysis */}
                <div className="bg-white/50 rounded-lg p-4">
                  <h3 className="font-medium text-primary-dark mb-2">Focus Time Progress</h3>
                  {data.trends.focusTimePercentage.direction === 'up' ? (
                    <p className="text-green-700">
                      🎉 Great job! Your focus time increased by {data.trends.focusTimePercentage.changePercent}% this week. 
                      You're making progress toward better work-life balance.
                    </p>
                  ) : data.trends.focusTimePercentage.direction === 'down' ? (
                    <p className="text-red-700">
                      ⚠️ Your focus time decreased by {Math.abs(data.trends.focusTimePercentage.changePercent)}% this week. 
                      Consider blocking dedicated time for deep work.
                    </p>
                  ) : (
                    <p className="text-gray-700">
                      Your focus time percentage remained stable this week at {data.weeks[0]?.analysis.focusTimePercentage}%.
                    </p>
                  )}
                </div>

                {/* Meeting Load Analysis */}
                <div className="bg-white/50 rounded-lg p-4">
                  <h3 className="font-medium text-primary-dark mb-2">Meeting Load Trends</h3>
                  {data.trends.meetingHours.direction === 'down' ? (
                    <p className="text-green-700">
                      ✅ Your meeting hours decreased by {Math.abs(data.trends.meetingHours.changePercent)}% this week. 
                      This gives you more time for strategic work.
                    </p>
                  ) : data.trends.meetingHours.direction === 'up' ? (
                    <p className="text-red-700">
                      📈 Your meeting hours increased by {data.trends.meetingHours.changePercent}% this week. 
                      Review if all meetings are necessary and consider delegation.
                    </p>
                  ) : (
                    <p className="text-gray-700">
                      Your meeting load remained consistent at {data.weeks[0]?.analysis.totalMeetingHours.toFixed(1)} hours this week.
                    </p>
                  )}
                </div>

                {/* Overall Trend */}
                <div className="bg-white/50 rounded-lg p-4">
                  <h3 className="font-medium text-primary-dark mb-2">Overall Assessment</h3>
                  {(() => {
                    const focusUp = data.trends.focusTimePercentage.direction === 'up';
                    const meetingsDown = data.trends.meetingHours.direction === 'down';
                    
                    if (focusUp && meetingsDown) {
                      return <p className="text-green-700">🌟 Excellent progress! You're increasing focus time while reducing meeting load. Keep up the great work!</p>;
                    } else if (focusUp || meetingsDown) {
                      return <p className="text-blue-700">📊 You're making positive changes. Continue focusing on the balance between meetings and deep work.</p>;
                    } else if (data.trends.focusTimePercentage.direction === 'down' && data.trends.meetingHours.direction === 'up') {
                      return <p className="text-red-700">🔄 Consider reassessing your calendar. More meetings and less focus time may impact productivity.</p>;
                    } else {
                      return <p className="text-gray-700">📈 Your schedule patterns are stable. Monitor for opportunities to optimize further.</p>;
                    }
                  })()}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default WeekOverWeekView;