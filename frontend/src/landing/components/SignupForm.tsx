import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Eye, EyeOff, Mail, Lock, Building, Phone, MapPin } from 'lucide-react';

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSwitchToLogin }) => {
  const { signup, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate form
    if (!formData.name || !formData.email || !formData.password || !formData.phone || !formData.address) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    const result = await signup({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      address: formData.address,
    });

    if (result.success) {
      setSuccess(result.message || 'Registration successful! Redirecting to login...');
      console.log('[SIGNUP] Success, redirecting to login');
      // Redirect to login after 1.5 seconds
      setTimeout(() => {
        console.log('[SIGNUP] Switching to login now');
        onSwitchToLogin();
      }, 1500);
    } else {
      console.error('[SIGNUP] Failed:', result.message);
      // Show detailed validation errors if available
      setError(result.message || 'Registration failed. Please try again.');
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
            <Building className="w-6 h-6 text-blue-900" />
          </div>
        </div>
        <CardTitle className="text-3xl font-bold text-center text-gray-900">Create Account</CardTitle>
        <CardDescription className="text-center text-gray-600 text-base">
          Register your restaurant with QuickServe
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 px-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-900 font-medium">Restaurant Name</Label>
            <div className="relative group">
              <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-hover:text-blue-900 transition-colors" />
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Your Restaurant Name"
                value={formData.name}
                onChange={handleInputChange}
                className="pl-10 h-11 border-gray-200 focus:border-blue-900 focus:ring-blue-900/20 focus-visible:ring-blue-900 rounded-xl transition-all"
                required
              />
            </div>
          </div>

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
            <Label htmlFor="phone" className="text-gray-900 font-medium">Phone Number</Label>
            <div className="relative group">
              <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-hover:text-blue-900 transition-colors" />
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={handleInputChange}
                className="pl-10 h-11 border-gray-200 focus:border-blue-900 focus:ring-blue-900/20 focus-visible:ring-blue-900 rounded-xl transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-gray-900 font-medium">Address</Label>
            <div className="relative group">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-hover:text-blue-900 transition-colors" />
              <Input
                id="address"
                name="address"
                type="text"
                placeholder="123 Main St (min 5 characters)"
                value={formData.address}
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
                placeholder="Create a password"
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-gray-900 font-medium">Confirm Password</Label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-hover:text-blue-900 transition-colors" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="pl-10 pr-10 h-11 border-gray-200 focus:border-blue-900 focus:ring-blue-900/20 focus-visible:ring-blue-900 rounded-xl transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-blue-900 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-lg p-3 font-medium">
              <div className="whitespace-pre-line">{error}</div>
            </div>
          )}

          {success && (
            <div className="text-green-700 text-sm text-center bg-green-50 border border-green-100 rounded-lg p-3">
              {success}
              <div className="mt-2">
                <button
                  onClick={onSwitchToLogin}
                  className="text-green-800 underline font-bold hover:text-green-900"
                >
                  Go to Login Now
                </button>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-900 hover:bg-blue-800 text-white shadow-lg hover:shadow-blue-900/40 transition-all duration-300 h-12 text-lg font-bold rounded-xl mt-2"
            disabled={isLoading || !!success}
          >
            {isLoading ? 'Creating Account...' : success ? 'Account Created!' : 'Create Account'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center pb-8">
        <p className="text-gray-600">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-blue-900 hover:text-blue-700 font-bold hover:underline transition-all"
          >
            Sign in
          </button>
        </p>
      </CardFooter>
    </Card>
  );
};

export default SignupForm;