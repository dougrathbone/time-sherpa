import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import ExpandableCategory from './ExpandableCategory';
import MeetingDetailsModal from './MeetingDetailsModal';
import { CalendarAnalysis, TimeCategory } from '../../shared/types';

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
  const [selectedCategory, setSelectedCategory] = useState<TimeCategory | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCategoryClick = (categoryName: string) => {
    const category = analysis.categories.find(cat => cat.name === categoryName);
    if (category) {
      setSelectedCategory(category);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
  };

  const pieData = analysis.categories.map((category, index) => ({
    name: category.name,
    value: category.totalHours,
    percentage: category.percentage,
    color: COLORS[index % COLORS.length],
    category: category, // Store reference to full category data
  }));

  // Sort categories by hours for better visualization
  const sortedCategories = [...analysis.categories].sort((a, b) => b.totalHours - a.totalHours);
  
  const barData = sortedCategories.map((category, index) => ({
    name: category.name.length > 15 ? category.name.substring(0, 12) + '...' : category.name,
    fullName: category.name,
    hours: category.totalHours,
    events: category.eventCount,
    fill: COLORS[index % COLORS.length],
    category: category, // Store reference to full category data
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
                  onClick={(data) => handleCategoryClick(data.name)}
                  style={{ cursor: 'pointer' }}
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      className="hover:opacity-80 transition-opacity"
                    />
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
              <div 
                key={entry.name} 
                className="flex items-center gap-2 text-sm p-2 hover:bg-gray-50 rounded transition-colors cursor-pointer"
                onClick={() => handleCategoryClick(entry.name)}
                title={`Click to view ${entry.name} meetings`}
              >
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-primary-dark/80 truncate">
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
                onClick={(data) => handleCategoryClick(data.fullName)}
                style={{ cursor: 'pointer' }}
                className="hover:opacity-80 transition-opacity"
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
            <ExpandableCategory
              key={category.name}
              category={category}
              color={COLORS[index % COLORS.length]}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Meeting Details Modal */}
      <MeetingDetailsModal
        category={selectedCategory}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}

export default TimeAnalysisChart; 