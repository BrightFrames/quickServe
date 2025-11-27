import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface User {
  id: string
  username: string
  role: 'admin' | 'kitchen'
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string, role: 'admin' | 'kitchen', restaurantCode?: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (storedUser && token) {
      setUser(JSON.parse(storedUser))
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  }, [])

  const login = async (username: string, password: string, role: 'admin' | 'kitchen', restaurantCode?: string) => {
    try {
      const payload: any = {
        username,
        password,
        role,
      };
      
      // Add restaurantCode for admin/kitchen login
      if (restaurantCode) {
        payload.restaurantCode = restaurantCode;
      }
      
      const response = await axios.post(`${apiUrl}/api/auth/login`, payload)
      
      const { user, token } = response.data
      setUser(user)
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
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
