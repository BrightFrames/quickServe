import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  role: 'admin' | 'kitchen' | 'captain' | 'reception'
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()

  // Security: Log unauthorized access attempts
  useEffect(() => {
    if (!isAuthenticated) {
      console.warn('[SECURITY] Unauthorized access attempt to:', location.pathname)
    }
  }, [isAuthenticated, location.pathname])

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.warn('[SECURITY] Blocked unauthenticated access to:', location.pathname)
    return <Navigate to="/login" replace />
  }

  // Redirect if user role doesn't match required role
  if (user?.role !== role) {
    console.warn('[SECURITY] Role mismatch. Required:', role, 'Got:', user?.role)
    
    // Redirect to appropriate dashboard based on user's actual role
    if (user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />
    } else if (user?.role === 'kitchen') {
      return <Navigate to="/kitchen/dashboard" replace />
    } else if (user?.role === 'captain') {
      return <Navigate to="/captain/dashboard" replace />
    } else if (user?.role === 'reception') {
      return <Navigate to="/reception/dashboard" replace />
    }
    
    // If no valid role, redirect to login
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
