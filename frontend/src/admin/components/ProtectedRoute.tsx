import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect } from 'react'
import LoadingScreen from './LoadingScreen'

interface ProtectedRouteProps {
  children: React.ReactNode
  role: 'admin' | 'kitchen' | 'captain' | 'reception'
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Security: Log unauthorized access attempts
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      console.warn('[SECURITY] Unauthorized access attempt to:', location.pathname)
    }
  }, [isAuthenticated, isLoading, location.pathname])

  // Show loading screen while validating token
  if (isLoading) {
    return <LoadingScreen />
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.warn('[SECURITY] Blocked unauthenticated access to:', location.pathname)
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // Redirect if user role doesn't match required role
  if (user?.role !== role) {
    console.warn('[SECURITY] Role mismatch. Required:', role, 'Got:', user?.role)
    
    // Get restaurant slug for redirect
    const restaurantSlug = (user as any)?.restaurantSlug || '';
    const slugPrefix = restaurantSlug ? `/${restaurantSlug}` : '';
    
    // Redirect to appropriate dashboard based on user's actual role
    if (user?.role === 'admin') {
      return <Navigate to={`${slugPrefix}/admin/dashboard`} replace />
    } else if (user?.role === 'kitchen') {
      return <Navigate to={`${slugPrefix}/kitchen/dashboard`} replace />
    } else if (user?.role === 'captain') {
      return <Navigate to={`${slugPrefix}/captain/dashboard`} replace />
    } else if (user?.role === 'reception') {
      return <Navigate to={`${slugPrefix}/reception/dashboard`} replace />
    }
    
    // If no valid role, redirect to login
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
