import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignup }) => {
  const { login, isLoading, restaurant } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    const result = await login(formData.email, formData.password);
    if (!result.success) {
      setError(result.message || 'Invalid email or password');
    } else {
      // Login successful - need to wait a moment for restaurant state to update
      setTimeout(() => {
        const restaurantData = JSON.parse(localStorage.getItem('restaurant_data') || '{}');
        if (restaurantData.slug) {
          navigate(`/${restaurantData.slug}/dashboard`);
        }
      }, 100);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-2xl rounded-3xl border-gray-100 bg-white/80 backdrop-blur-sm">
      <CardHeader className="space-y-3 pt-8">
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <Lock className="w-6 h-6 text-blue-900" />
          </div>
        </div>
        <CardTitle className="text-3xl font-bold text-center text-gray-900">Welcome Back</CardTitle>
        <CardDescription className="text-center text-gray-600 text-base">
          Sign in to access your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 px-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-900 font-medium">Email Address</Label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-hover:text-blue-900 transition-colors" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="restaurant@example.com"
                value={formData.email}
                onChange={handleInputChange}
                className="pl-10 h-11 border-gray-200 focus:border-blue-900 focus:ring-blue-900/20 focus-visible:ring-blue-900 rounded-xl transition-all"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-900 font-medium">Password</Label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-hover:text-blue-900 transition-colors" />
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                className="pl-10 pr-10 h-11 border-gray-200 focus:border-blue-900 focus:ring-blue-900/20 focus-visible:ring-blue-900 rounded-xl transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-blue-900 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 border border-red-100 rounded-lg p-3 font-medium">
              {error}
            </div>
          )}
          <Button
            type="submit"
            className="w-full bg-blue-900 hover:bg-blue-800 text-white shadow-lg hover:shadow-blue-900/40 transition-all duration-300 h-12 text-lg font-bold rounded-xl"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center pb-8">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToSignup}
            className="text-blue-900 hover:text-blue-700 font-bold hover:underline transition-all"
          >
            Create Account
          </button>
        </p>
      </CardFooter>
    </Card>
  );
};

export default LoginForm;