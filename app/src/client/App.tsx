import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { CalendarAnalysisProvider } from './hooks/useCalendarAnalysis';
import { ErrorBoundary } from './components/ErrorBoundary';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import { Settings } from './pages/Settings';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CalendarAnalysisProvider>
          <div className="min-h-screen">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </CalendarAnalysisProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App; 