import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Landing Pages
import LandingPage from './landing/pages/LandingPage';
import Dashboard from './landing/components/Dashboard';

// Admin Pages  
import AdminLogin from './admin/pages/AdminLogin';
import KitchenLogin from './admin/pages/KitchenLogin';
import AdminHome from './admin/pages/AdminHome';
import KitchenHome from './admin/pages/KitchenHome';
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

// Components
import ProtectedRoute from './admin/components/ProtectedRoute';

function App() {
  return (
    <Router>
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

          {/* Admin Login */}
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

          {/* Kitchen Login */}
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

          {/* Admin Dashboard - Protected */}
          <Route
            path="/admin/dashboard"
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

          {/* Kitchen Dashboard - Protected */}
          <Route
            path="/kitchen/dashboard"
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

          {/* Restaurant Dashboard - Protected */}
          <Route 
            path="/:restaurantSlug/dashboard" 
            element={
              <LandingAuthProvider>
                <Dashboard />
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
  );
}

export default App;
