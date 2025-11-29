import React, { createContext, useContext, useState, useEffect } from 'react';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  restaurantCode: string;
  email: string;
  phone: string;
  address: string;
}

interface AuthContextType {
  restaurant: Restaurant | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{success: boolean; message?: string}>;
  signup: (restaurantData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
  }) => Promise<{success: boolean; message?: string}>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on app start
  useEffect(() => {
    const savedToken = localStorage.getItem('restaurant_token');
    const savedRestaurant = localStorage.getItem('restaurant_data');
    
    if (savedToken && savedRestaurant) {
      setToken(savedToken);
      setRestaurant(JSON.parse(savedRestaurant));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{success: boolean; message?: string}> => {
    setIsLoading(true);
    console.log('[AUTH] Starting login for:', email);
    const apiUrl = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://quickserve-51ek.onrender.com');
    
    try {
      const response = await fetch(`${apiUrl}/api/restaurant/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('[AUTH] Response status:', response.status);
      const data = await response.json();
      console.log('[AUTH] Response data:', data);

      if (response.ok && data.token && data.restaurant) {
        console.log('[AUTH] Login successful, setting state');
        setToken(data.token);
        setRestaurant(data.restaurant);
        localStorage.setItem('restaurant_token', data.token);
        localStorage.setItem('restaurant_data', JSON.stringify(data.restaurant));
        console.log('[AUTH] State updated, restaurant:', data.restaurant);
        return { success: true, message: 'Login successful!' };
      } else {
        console.error('[AUTH] Login failed:', data.message);
        return { success: false, message: data.message || 'Invalid email or password' };
      }
    } catch (error) {
      console.error('[AUTH] Login error:', error);
      return { success: false, message: 'Unable to connect to server. Please make sure the backend is running.' };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (restaurantData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
  }): Promise<{success: boolean; message?: string}> => {
    const apiUrl = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://quickserve-51ek.onrender.com');
    setIsLoading(true);
    console.log('[AUTH] Starting signup for:', restaurantData.email);
    try {
      const response = await fetch(`${apiUrl}/api/restaurant/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(restaurantData),
      });

      console.log('[AUTH] Signup response status:', response.status);
      const data = await response.json();
      console.log('[AUTH] Signup response data:', data);

      if (response.ok) {
        console.log('[AUTH] Signup successful');
        // Don't auto-login after signup, just return success
        return { success: true, message: 'Registration successful! Please login with your credentials.' };
      } else {
        console.error('[AUTH] Signup failed:', data.message);
        return { success: false, message: data.message || 'Registration failed. Please try again.' };
      }
    } catch (error) {
      console.error('[AUTH] Signup error:', error);
      return { success: false, message: 'Unable to connect to server. Please make sure the backend is running.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setRestaurant(null);
    localStorage.removeItem('restaurant_token');
    localStorage.removeItem('restaurant_data');
    
    // Redirect to landing page
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{
      restaurant,
      token,
      login,
      signup,
      logout,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};