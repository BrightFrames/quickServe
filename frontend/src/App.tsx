import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useState, useEffect } from 'react';

// Shared Components
import LoadingScreen from './shared/components/LoadingScreen';

// Landing Pages
import LandingPage from './landing/pages/LandingPage';
import Dashboard from './landing/components/Dashboard';
import { DashboardProtection } from './landing/components/DashboardProtection';

// Admin Pages  
import AdminLogin from './admin/pages/AdminLogin';
import KitchenLogin from './admin/pages/KitchenLogin';
import AdminHome from './admin/pages/AdminHome';
import KitchenHome from './admin/pages/KitchenHome';
import CaptainLogin from './admin/pages/CaptainLogin';
import CaptainHome from './admin/pages/CaptainHome';
import ReceptionLogin from './admin/pages/ReceptionLogin';
import ReceptionHome from './admin/pages/ReceptionHome';
import RestaurantVerification from './admin/pages/RestaurantVerification';
import LoginSelection from './admin/pages/LoginSelection';

// Customer Pages
import { CustomerApp } from './customer/CustomerApp';

// Contexts
import { AuthProvider as LandingAuthProvider } from './landing/context/AuthContext';
import { AuthProvider as AdminAuthProvider } from './admin/context/AuthContext';
import { RestaurantProvider as AdminRestaurantProvider } from './admin/context/RestaurantContext';
import { RestaurantProvider as CustomerRestaurantProvider } from './customer/context/RestaurantContext';
import { CartProvider } from './customer/context/CartContext';

// Performance: React Query Client
import { queryClient } from './customer/config/queryClient';

// Components
import ProtectedRoute from './admin/components/ProtectedRoute';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if this is the first visit in this session
    const hasSeenLoading = sessionStorage.getItem('hasSeenLoading');
    
    if (hasSeenLoading) {
      setIsLoading(false);
    }
  }, []);

  const handleLoadingComplete = () => {
    sessionStorage.setItem('hasSeenLoading', 'true');
    setIsLoading(false);
  };

  if (isLoading) {
    return <LoadingScreen onLoadingComplete={handleLoadingComplete} minDuration={2500} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-gray-50">
          <Routes>
          {/* Landing Routes - Public */}
          <Route 
            path="/" 
            element={
              <LandingAuthProvider>
                <LandingPage />
              </LandingAuthProvider>
            } 
          />
          
          {/* Admin/Kitchen Login Selection */}
          <Route 
            path="/login" 
            element={
              <AdminAuthProvider>
                <AdminRestaurantProvider>
                  <LoginSelection />
                </AdminRestaurantProvider>
              </AdminAuthProvider>
            } 
          />

          {/* Admin Login with Restaurant Slug */}
          <Route 
            path="/:restaurantSlug/admin/login" 
            element={
              <AdminAuthProvider>
                <AdminRestaurantProvider>
                  <AdminLogin />
                </AdminRestaurantProvider>
              </AdminAuthProvider>
            } 
          />

          {/* Admin Login (fallback without slug) */}
          <Route 
            path="/admin/login" 
            element={
              <AdminAuthProvider>
                <AdminRestaurantProvider>
                  <AdminLogin />
                </AdminRestaurantProvider>
              </AdminAuthProvider>
            } 
          />

          {/* Kitchen Login with Restaurant Slug */}
          <Route 
            path="/:restaurantSlug/kitchen/login" 
            element={
              <AdminAuthProvider>
                <AdminRestaurantProvider>
                  <KitchenLogin />
                </AdminRestaurantProvider>
              </AdminAuthProvider>
            } 
          />

          {/* Kitchen Login (fallback without slug) */}
          <Route 
            path="/kitchen/login" 
            element={
              <AdminAuthProvider>
                <AdminRestaurantProvider>
                  <KitchenLogin />
                </AdminRestaurantProvider>
              </AdminAuthProvider>
            } 
          />

          {/* Captain Login with Restaurant Slug */}
          <Route 
            path="/:restaurantSlug/captain/login" 
            element={
              <AdminAuthProvider>
                <AdminRestaurantProvider>
                  <CaptainLogin />
                </AdminRestaurantProvider>
              </AdminAuthProvider>
            } 
          />

          {/* Captain Login (fallback without slug) */}
          <Route 
            path="/captain/login" 
            element={
              <AdminAuthProvider>
                <AdminRestaurantProvider>
                  <CaptainLogin />
                </AdminRestaurantProvider>
              </AdminAuthProvider>
            } 
          />

          {/* Admin Dashboard - Protected (with slug) */}
          <Route
            path="/:restaurantSlug/admin/dashboard"
            element={
              <AdminAuthProvider>
                <AdminRestaurantProvider>
                  <ProtectedRoute role="admin">
                    <AdminHome />
                  </ProtectedRoute>
                </AdminRestaurantProvider>
              </AdminAuthProvider>
            }
          />

          {/* Kitchen Dashboard with Restaurant Slug - Protected */}
          <Route
            path="/:restaurantSlug/kitchen/dashboard"
            element={
              <AdminAuthProvider>
                <AdminRestaurantProvider>
                  <ProtectedRoute role="kitchen">
                    <KitchenHome />
                  </ProtectedRoute>
                </AdminRestaurantProvider>
              </AdminAuthProvider>
            }
          />



          {/* Captain Dashboard with Restaurant Slug - Protected */}
          <Route
            path="/:restaurantSlug/captain/dashboard"
            element={
              <AdminAuthProvider>
                <AdminRestaurantProvider>
                  <ProtectedRoute role="captain">
                    <CaptainHome />
                  </ProtectedRoute>
                </AdminRestaurantProvider>
              </AdminAuthProvider>
            }
          />

          {/* Reception Login */}
          <Route 
            path="/reception/login" 
            element={
              <AdminAuthProvider>
                <AdminRestaurantProvider>
                  <ReceptionLogin />
                </AdminRestaurantProvider>
              </AdminAuthProvider>
            } 
          />

          {/* Reception Login with Restaurant Slug */}
          <Route 
            path="/:restaurantSlug/reception/login" 
            element={
              <AdminAuthProvider>
                <AdminRestaurantProvider>
                  <ReceptionLogin />
                </AdminRestaurantProvider>
              </AdminAuthProvider>
            } 
          />



          {/* Reception Dashboard with Restaurant Slug - Protected */}
          <Route
            path="/:restaurantSlug/reception/dashboard"
            element={
              <AdminAuthProvider>
                <AdminRestaurantProvider>
                  <ProtectedRoute role="reception">
                    <ReceptionHome />
                  </ProtectedRoute>
                </AdminRestaurantProvider>
              </AdminAuthProvider>
            }
          />

          {/* Restaurant Dashboard - Password Protected */}
          <Route 
            path="/:restaurantSlug/dashboard" 
            element={
              <LandingAuthProvider>
                <DashboardProtection>
                  <Dashboard />
                </DashboardProtection>
              </LandingAuthProvider>
            } 
          />

          {/* Customer Routes - All under /:slug/customer/* */}
          <Route 
            path="/:restaurantSlug/customer/*" 
            element={
              <CustomerRestaurantProvider>
                <CartProvider>
                  <CustomerApp />
                </CartProvider>
              </CustomerRestaurantProvider>
            } 
          />

          {/* Restaurant Verification - New URL format: /:slug?code=QS1234/admin */}
          <Route 
            path="/:restaurantSlug" 
            element={
              <AdminAuthProvider>
                <AdminRestaurantProvider>
                  <RestaurantVerification />
                </AdminRestaurantProvider>
              </AdminAuthProvider>
            } 
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <Toaster position="top-right" richColors />
      </div>
    </Router>
    </QueryClientProvider>
  );
}

export default App;
