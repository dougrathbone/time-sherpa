import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface TimeCategory {
  name: string;
  totalHours: number;
  percentage: number;
  eventCount: number;
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

interface TimeAnalysisChartProps {
  analysis: CalendarAnalysis;
}

// Brand colors with better contrast for data visualization
const COLORS = [
  '#FF5B04', // Primary Orange
  '#075056', // Primary Teal
  '#F4D47C', // Primary Yellow
  '#8B5CF6', // Purple for better contrast
  '#10B981', // Green for variety
  '#6B7280', // Gray
  '#EC4899', // Pink
  '#3B82F6', // Blue
];

function TimeAnalysisChart({ analysis }: TimeAnalysisChartProps) {
  const pieData = analysis.categories.map((category, index) => ({
    name: category.name,
    value: category.totalHours,
    percentage: category.percentage,
    color: COLORS[index % COLORS.length],
  }));

  // Sort categories by hours for better visualization
  const sortedCategories = [...analysis.categories].sort((a, b) => b.totalHours - a.totalHours);
  
  const barData = sortedCategories.map((category, index) => ({
    name: category.name.length > 15 ? category.name.substring(0, 12) + '...' : category.name,
    fullName: category.name,
    hours: category.totalHours,
    events: category.eventCount,
    fill: COLORS[index % COLORS.length],
  }));

  return (
    <div className="space-y-8">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-orange">
            {analysis.totalMeetingHours.toFixed(1)}h
          </div>
          <div className="text-sm text-primary-dark/70">Total Meeting Time</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-teal">
            {analysis.focusHours.toFixed(1)}h
          </div>
          <div className="text-sm text-primary-dark/70">Focus Time</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-dark">
            {analysis.categories.reduce((sum, cat) => sum + cat.eventCount, 0)}
          </div>
          <div className="text-sm text-primary-dark/70">Total Events</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-yellow">
            {analysis.categories.length}
          </div>
          <div className="text-sm text-primary-dark/70">Categories</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-8 mt-8">
        {/* Pie Chart */}
        <div>
          <h3 className="text-lg font-semibold text-primary-dark mb-4">
            Time Distribution
          </h3>
          <div className="relative">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `${value.toFixed(1)}h`}
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center -mt-10">
                <div className="text-2xl font-bold text-primary-dark">
                  {(analysis.totalMeetingHours + analysis.focusHours).toFixed(1)}h
                </div>
                <div className="text-sm text-primary-dark/70">Total Hours</div>
              </div>
            </div>
          </div>
          {/* Legend */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2 text-sm p-1 hover:bg-gray-50 rounded transition-colors">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-primary-dark/80 truncate" title={entry.name}>
                  {entry.name} ({entry.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div>
          <h3 className="text-lg font-semibold text-primary-dark mb-4">
            Hours by Category
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart 
              data={barData}
              margin={{ top: 20, right: 20, bottom: 80, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={11}
                tick={{ fill: '#233038' }}
                interval={0}
              />
              <YAxis 
                tick={{ fill: '#233038' }}
                fontSize={11}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'hours' ? `${value.toFixed(1)} hours` : `${value} events`,
                  name === 'hours' ? 'Time Spent' : 'Event Count'
                ]}
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
              />
              <Bar 
                dataKey="hours" 
                name="Hours"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Details */}
      <div>
        <h3 className="text-lg font-semibold text-primary-dark mb-4">
          Category Breakdown
        </h3>
        <div className="space-y-3">
          {analysis.categories.map((category, index) => (
            <div key={category.name} className="flex items-center justify-between p-3 bg-white rounded-lg border border-primary-gray/20">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span className="font-medium text-primary-dark">{category.name}</span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-primary-dark/70">
                  {category.totalHours.toFixed(1)}h ({category.percentage}%)
                </span>
                <span className="text-primary-dark/70">
                  {category.eventCount} events
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TimeAnalysisChart; 