import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import Dashboard from './components/Dashboard';

const AppContent: React.FC = () => {
  const { restaurant, isLoading } = useAuth();

  console.log('[APP] Restaurant state:', restaurant);
  console.log('[APP] Is loading:', isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={restaurant ? <Navigate to="/dashboard" replace /> : <LandingPage />} 
      />
      <Route 
        path="/dashboard" 
        element={restaurant ? <Dashboard /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/admin/*" 
        element={restaurant ? <iframe src="http://localhost:5174" className="w-full h-screen border-0" title="Admin Panel" /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/customer/*" 
        element={restaurant ? <iframe src="http://localhost:8080" className="w-full h-screen border-0" title="Customer App" /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="*" 
        element={<Navigate to="/" replace />} 
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;