import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'

const apiUrl = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://quickserve-51ek.onrender.com');

interface User {
  id: string
  username: string
  role: 'admin' | 'kitchen' | 'captain' | 'reception'
  restaurantId?: number
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string, role: 'admin' | 'kitchen' | 'captain' | 'reception', restaurantIdentifier?: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // SECURITY FIX: Setup axios interceptor to handle 401 responses globally
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Check if this is a token authentication error (not just a bad request)
          const isAuthError = error.response?.data?.error?.includes('token') || 
                             error.response?.data?.message?.includes('Authentication') ||
                             error.response?.data?.message?.includes('Token');
          
          if (isAuthError) {
            console.log('[AUTH] 401 Unauthorized - Token expired or invalid:', error.response?.data?.message)
            
            // Clear session and redirect to login
            setUser(null)
            localStorage.removeItem('user')
            localStorage.removeItem('token')
            localStorage.removeItem('restaurantToken')
            localStorage.removeItem('captainToken')
            localStorage.removeItem('receptionToken')
            delete axios.defaults.headers.common['Authorization']
            
            // Only redirect if not already on login page
            if (!window.location.pathname.includes('/login')) {
              console.log('[AUTH] Redirecting to login due to expired token')
              window.location.href = '/login'
            }
          } else {
            console.log('[AUTH] 401 error but not token-related:', error.response?.data?.message)
          }
        }
        return Promise.reject(error)
      }
    )

    // Cleanup interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor)
    }
  }, [])

  useEffect(() => {
    // SECURITY FIX: Validate token on mount before restoring session
    const validateSession = async () => {
      try {
        const storedUser = localStorage.getItem('user')
        const token = localStorage.getItem('token') || localStorage.getItem('restaurantToken')
        
        if (!storedUser || !token) {
          console.log('[AUTH] No stored session found')
          setIsLoading(false)
          return
        }

        // Verify token is still valid by making a test request
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        // Make a lightweight validation request
        try {
          await axios.get(`${apiUrl}/api/restaurant/profile`)
          
          // Token is valid, restore session
          const parsedUser = JSON.parse(storedUser)
          console.log('[AUTH] ✓ Session validated, restoring user:', parsedUser)
          setUser(parsedUser)
        } catch (validationError: any) {
          // Token is invalid or expired
          console.log('[AUTH] ✗ Token validation failed:', validationError.response?.status)
          
          if (validationError.response?.status === 401 || validationError.response?.status === 403) {
            // Clear invalid session
            console.log('[AUTH] Clearing invalid session')
            localStorage.removeItem('user')
            localStorage.removeItem('token')
            localStorage.removeItem('restaurantToken')
            localStorage.removeItem('captainToken')
            localStorage.removeItem('receptionToken')
            delete axios.defaults.headers.common['Authorization']
          }
        }
      } catch (error) {
        console.error('[AUTH] Session validation error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    validateSession()
  }, [])

  const login = async (username: string, password: string, role: 'admin' | 'kitchen' | 'captain', restaurantIdentifier?: string) => {
    try {
      // CRITICAL FIX: Clear any existing session before new login
      // This prevents old restaurantId from being used
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('restaurantToken');
      localStorage.removeItem('captainToken');
      localStorage.removeItem('receptionToken');
      delete axios.defaults.headers.common['Authorization'];
      console.log('[AUTH] Cleared old session data before new login');
      
      // For admin role, use restaurant login endpoint
      if (role === 'admin') {
        // Use username as email (admin login now asks for email)
        const email = username;
        
        console.log('[AUTH] Attempting restaurant login with email:', email);
        
        // Login as restaurant to get restaurant token
        const response = await axios.post(`${apiUrl}/api/restaurant/login`, {
          email: email,
          password: password
        });
        
        const { restaurant, token } = response.data;
        
        console.log('[AUTH] Login successful, got restaurant token');
        
        // Store as admin user with restaurant info
        const adminUser = {
          id: restaurant.id,
          username: restaurant.name,
          role: 'admin' as const,
          email: restaurant.email,
          restaurantId: restaurant.id
        };
        
        setUser(adminUser);
        localStorage.setItem('user', JSON.stringify(adminUser));
        localStorage.setItem('token', token);
        localStorage.setItem('restaurantToken', token);
        localStorage.setItem('restaurantEmail', restaurant.email);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        console.log('[AUTH] Token set in axios headers');
      } else if (role === 'captain') {
        // Captain login using dedicated endpoint
        console.log('[AUTH] Attempting captain login with identifier:', restaurantIdentifier);
        
        const response = await axios.post(`${apiUrl}/api/auth/captain/login`, {
          username,
          password,
          restaurantIdentifier: restaurantIdentifier,
        });
        
        const { user, token } = response.data;
        console.log('[AUTH] Captain response data:', response.data);
        console.log('[AUTH] Captain user:', user);
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        localStorage.setItem('captainToken', token);
        localStorage.setItem('captainUser', JSON.stringify(user));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        console.log('[AUTH] Captain login successful');
        return response.data; // Return for redirect with slug
      } else if (role === 'reception') {
        // Reception login
        const response = await axios.post(`${apiUrl}/api/auth/reception/login`, {
          username,
          password,
        });
        
        const { user, token } = response.data;
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        localStorage.setItem('receptionToken', token);
        localStorage.setItem('receptionUser', JSON.stringify(user));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        console.log('[AUTH] Reception login successful');
      } else {
        // Kitchen staff login
        console.log('[AUTH] Attempting kitchen login with identifier:', restaurantIdentifier);
        
        const payload: any = {
          username,
          password,
          role,
        };
        
        if (restaurantIdentifier) {
          payload.restaurantIdentifier = restaurantIdentifier;
        }
        
        const response = await axios.post(`${apiUrl}/api/auth/login`, payload);
        
        const { user, token } = response.data;
        console.log('[AUTH] Kitchen login response:', { user, token: token.substring(0, 20) + '...' })
        console.log('[AUTH] Kitchen user restaurantId:', user.restaurantId)
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    } catch (error: any) {
      console.error('[AUTH] Login error:', error.response?.data || error.message);
      throw error;
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    localStorage.removeItem('restaurantToken')
    localStorage.removeItem('restaurantEmail')
    localStorage.removeItem('restaurantSlug')
    localStorage.removeItem('restaurantCode')
    localStorage.removeItem('restaurantName')
    delete axios.defaults.headers.common['Authorization']
    
    // Redirect to login selection page
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
