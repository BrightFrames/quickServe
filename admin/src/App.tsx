import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import LoginSelection from './pages/LoginSelection'
import AdminLogin from './pages/AdminLogin'
import KitchenLogin from './pages/KitchenLogin'
import AdminHome from './pages/AdminHome'
import KitchenHome from './pages/KitchenHome'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<LoginSelection />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/kitchen/login" element={<KitchenLogin />} />
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
      </Router>
    </AuthProvider>
  )
}

export default App
