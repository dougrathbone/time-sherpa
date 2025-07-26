import React, { useState, useEffect } from 'react';
import { WorkweekSettings as WorkweekSettingsType } from '../../shared/types';

interface WorkweekSettingsProps {
  settings: WorkweekSettingsType;
  onSave: (settings: WorkweekSettingsType) => Promise<void>;
  loading?: boolean;
}

const defaultWorkweek: WorkweekSettingsType = {
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: false,
  sunday: false
};

const dayLabels = {
  monday: 'Monday',
  tuesday: 'Tuesday', 
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};

function WorkweekSettings({ settings, onSave, loading = false }: WorkweekSettingsProps) {
  const [workweek, setWorkweek] = useState<WorkweekSettingsType>(settings || defaultWorkweek);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setWorkweek(settings || defaultWorkweek);
  }, [settings]);

  const handleDayToggle = (day: keyof WorkweekSettingsType) => {
    const newWorkweek = { ...workweek, [day]: !workweek[day] };
    setWorkweek(newWorkweek);
    setHasChanges(JSON.stringify(newWorkweek) !== JSON.stringify(settings || defaultWorkweek));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(workweek);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save workweek settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setWorkweek(settings || defaultWorkweek);
    setHasChanges(false);
  };

  const workdayCount = Object.values(workweek).filter(Boolean).length;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Work Week Settings</h3>
          <p className="text-sm text-gray-600 mt-1">
            Configure which days are workdays. Scheduling suggestions will only consider these days.
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">
            {workdayCount} workday{workdayCount !== 1 ? 's' : ''} per week
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {Object.entries(dayLabels).map(([day, label]) => (
          <div key={day} className="flex items-center justify-between py-2">
            <div className="flex items-center">
              <span className="font-medium text-gray-900 w-24">{label}</span>
              {day === 'saturday' || day === 'sunday' ? (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full ml-2">
                  Weekend
                </span>
              ) : (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full ml-2">
                  Weekday
                </span>
              )}
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={workweek[day as keyof WorkweekSettingsType]}
                onChange={() => handleDayToggle(day as keyof WorkweekSettingsType)}
                className="sr-only peer"
                disabled={loading}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}
      </div>

      {workdayCount === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm text-amber-800">
              You need at least one workday to receive scheduling suggestions.
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t">
        <button
          onClick={handleReset}
          disabled={!hasChanges || loading || saving}
          className="px-4 py-2 text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Reset
        </button>
        
        <button
          onClick={handleSave}
          disabled={!hasChanges || loading || saving || workdayCount === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

export default WorkweekSettings;