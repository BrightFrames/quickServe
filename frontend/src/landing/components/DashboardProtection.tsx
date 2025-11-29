import { useState, useEffect, ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface DashboardProtectionProps {
  children: ReactNode;
}

export const DashboardProtection = ({ children }: DashboardProtectionProps) => {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Check if already authenticated in this session
  useEffect(() => {
    const dashboardAuth = sessionStorage.getItem('dashboardAuth');
    const authSlug = sessionStorage.getItem('dashboardAuthSlug');
    const authTime = sessionStorage.getItem('dashboardAuthTime');
    
    if (dashboardAuth === 'true' && authSlug === restaurantSlug && authTime) {
      const elapsed = Date.now() - parseInt(authTime);
      const expiryTime = 60 * 60 * 1000; // 1 hour
      
      if (elapsed < expiryTime) {
        setIsAuthenticated(true);
      } else {
        // Session expired
        sessionStorage.removeItem('dashboardAuth');
        sessionStorage.removeItem('dashboardAuthSlug');
        sessionStorage.removeItem('dashboardAuthTime');
      }
    }
    setIsCheckingSession(false);
  }, [restaurantSlug]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast.error('Please enter the restaurant password');
      return;
    }

    if (attemptCount >= 5) {
      toast.error('Too many failed attempts. Please try again later.');
      setTimeout(() => {
        navigate('/');
      }, 2000);
      return;
    }

    setIsVerifying(true);

    try {
      const response = await axios.post(
        `${apiUrl}/api/restaurant/verify-admin-password`,
        {
          slug: restaurantSlug,
          password: password,
        }
      );

      if (response.data.success) {
        // Mark session as authenticated
        sessionStorage.setItem('dashboardAuth', 'true');
        sessionStorage.setItem('dashboardAuthSlug', restaurantSlug || '');
        sessionStorage.setItem('dashboardAuthTime', Date.now().toString());
        
        setIsAuthenticated(true);
        toast.success('Access granted');
      }
    } catch (error: any) {
      const newAttemptCount = attemptCount + 1;
      setAttemptCount(newAttemptCount);
      
      if (newAttemptCount >= 5) {
        toast.error('Too many failed attempts. Redirecting...');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        toast.error(error.response?.data?.message || 'Incorrect password');
      }
      
      setPassword('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  // Show loading while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show password prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto bg-blue-100 p-4 rounded-full w-fit">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Restaurant Dashboard</CardTitle>
            <CardDescription className="text-base">
              This dashboard is protected. Please enter your restaurant password to continue.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Security Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-900 mb-1">Security Notice</p>
                  <p className="text-amber-800">
                    Enter the password you used during restaurant registration.
                  </p>
                </div>
              </div>
            </div>

            {/* Password Form */}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pr-12"
                    disabled={isVerifying || attemptCount >= 5}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={isVerifying}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {attemptCount > 0 && attemptCount < 5 && (
                  <p className="text-sm text-red-600 mt-2">
                    Failed attempts: {attemptCount}/5
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1"
                  disabled={isVerifying}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isVerifying || attemptCount >= 5}
                  className="flex-1"
                >
                  {isVerifying ? 'Verifying...' : 'Access Dashboard'}
                </Button>
              </div>
            </form>

            {/* Help Text */}
            <p className="text-xs text-gray-500 text-center mt-6">
              Forgot your password? Contact support or reset it from the registration page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated - show dashboard
  return <>{children}</>;
};
