import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import LoginSelection from './pages/LoginSelection'
import AdminLogin from './pages/AdminLogin'
import KitchenLogin from './pages/KitchenLogin'
import AdminHome from './pages/AdminHome'
import KitchenHome from './pages/KitchenHome'
import RestaurantVerification from './pages/RestaurantVerification'
import { AuthProvider } from './context/AuthContext'
import { RestaurantProvider } from './context/RestaurantContext'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <RestaurantProvider>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/" element={<LoginSelection />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/kitchen/login" element={<KitchenLogin />} />
              
              {/* New URL structure: /:slug?code=QS1234/admin */}
              <Route path="/:restaurantSlug" element={<RestaurantVerification />} />
              
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute role="admin">
                    <AdminHome />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/kitchen/dashboard"
                element={
                  <ProtectedRoute role="kitchen">
                    <KitchenHome />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster position="top-right" richColors />
          </div>
        </RestaurantProvider>
      </Router>
    </AuthProvider>
  )
}

export default App
