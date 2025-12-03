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
  login: (username: string, password: string, role: 'admin' | 'kitchen' | 'captain' | 'reception', restaurantCode?: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token') || localStorage.getItem('restaurantToken')
    
    if (storedUser && token) {
      const parsedUser = JSON.parse(storedUser)
      console.log('[AUTH] Restoring session for user:', parsedUser)
      console.log('[AUTH] User restaurantId:', parsedUser.restaurantId)
      setUser(parsedUser)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      console.log('[AUTH] Restored session with token')
    }
  }, [])

  const login = async (username: string, password: string, role: 'admin' | 'kitchen' | 'captain', restaurantCode?: string) => {
    try {
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
        console.log('[AUTH] Attempting captain login');
        
        const response = await axios.post(`${apiUrl}/api/auth/captain/login`, {
          username,
          password,
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
        // Kitchen staff login using old endpoint
        const payload: any = {
          username,
          password,
          role,
        };
        
        if (restaurantCode) {
          payload.restaurantCode = restaurantCode;
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
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
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
