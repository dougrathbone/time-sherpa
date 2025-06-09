import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

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

interface TimeAnalysisChartProps {
  analysis: CalendarAnalysis;
}

const COLORS = ['#FF5B04', '#075056', '#F4D47C', '#D3DBDD', '#233038', '#FDF6E3'];

function TimeAnalysisChart({ analysis }: TimeAnalysisChartProps) {
  const pieData = analysis.categories.map((category, index) => ({
    name: category.name,
    value: category.totalHours,
    percentage: category.percentage,
    color: COLORS[index % COLORS.length],
  }));

  const barData = analysis.categories.map((category, index) => ({
    name: category.name.length > 15 ? category.name.substring(0, 15) + '...' : category.name,
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
      <div className="grid md:grid-cols-2 gap-8">
        {/* Pie Chart */}
        <div>
          <h3 className="text-lg font-semibold text-primary-dark mb-4">
            Time Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value.toFixed(1)}h`, 'Hours']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div>
          <h3 className="text-lg font-semibold text-primary-dark mb-4">
            Hours by Category
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'hours' ? `${value.toFixed(1)}h` : value,
                  name === 'hours' ? 'Hours' : 'Events'
                ]}
              />
              <Legend />
              <Bar dataKey="hours" name="Hours" />
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