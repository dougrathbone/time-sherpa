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
              <Route path="/settings" element={
                <ErrorBoundary fallback={
                  <div className="min-h-screen bg-primary-cream flex items-center justify-center">
                    <div className="text-center">
                      <h2 className="text-xl font-semibold text-primary-dark mb-2">
                        Error loading settings
                      </h2>
                      <button 
                        onClick={() => window.location.href = '/dashboard'}
                        className="text-primary-teal hover:text-primary-dark"
                      >
                        Return to Dashboard
                      </button>
                    </div>
                  </div>
                }>
                  <Settings />
                </ErrorBoundary>
              } />
            </Routes>
          </div>
        </CalendarAnalysisProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App; 