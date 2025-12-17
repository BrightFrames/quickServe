import { useState, useEffect, ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ShieldAlert, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { motion } from 'framer-motion';

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

  const handleSignOut = () => {
    // Clear all auth data
    sessionStorage.clear();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.info('Signed out successfully');
    // Force hard redirect to landing page to ensure clean state
    window.location.href = '/';
  };

  // Show loading while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-ping"></div>
          <div className="absolute inset-2 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  // Show password prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
        {/* Rich animated background - Blue Theme */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-gray-50 to-white -z-20"></div>
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-blue-100/50 to-transparent -z-10"></div>

        {/* Decorative Blobs */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -right-20 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl -z-10"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-32 -left-20 w-80 h-80 bg-indigo-300/30 rounded-full blur-3xl -z-10"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md px-4"
        >
          <Card className="shadow-2xl rounded-3xl border-gray-100 bg-white/90 backdrop-blur-xl overflow-hidden relative">

            <CardHeader className="text-center space-y-4 pt-10 pb-2">
              <div className="mx-auto w-20 h-20 bg-white rounded-2xl shadow-lg overflow-hidden mb-2">
                <img
                  src="/logo of quick serve.png"
                  alt="QuickServe"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">Protected Dashboard</CardTitle>
                <CardDescription className="text-gray-500 mt-2">
                  Verify it's you to continue
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="px-8 pb-10 pt-4">
              {/* Security Notice */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3"
              >
                <ShieldAlert className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-bold text-blue-900 mb-1">Security Verification</p>
                  <p className="text-blue-700 leading-relaxed">
                    Please enter the master password set during your restaurant registration.
                  </p>
                </div>
              </motion.div>

              {/* Password Form */}
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                {/* Hidden username field for accessibility */}
                <input
                  type="text"
                  name="username"
                  autoComplete="username"
                  value={restaurantSlug || ''}
                  readOnly
                  style={{ display: 'none' }}
                  aria-hidden="true"
                />

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 ml-1">
                    Master Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-blue-600 focus:ring-blue-600/20 focus-visible:ring-blue-600 rounded-xl transition-all"
                      disabled={isVerifying || attemptCount >= 5}
                      autoFocus
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-blue-600 transition-colors"
                      disabled={isVerifying}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {attemptCount > 0 && attemptCount < 5 && (
                    <p className="text-xs text-red-500 font-medium ml-1 animate-pulse">
                      {5 - attemptCount} attempts remaining
                    </p>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    onClick={handleCancel}
                    variant="outline"
                    className="flex-1 h-11 rounded-xl border-gray-200 hover:bg-gray-50 hover:text-gray-900 font-medium"
                    disabled={isVerifying}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isVerifying || attemptCount >= 5}
                    className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg hover:shadow-blue-600/25 transition-all"
                  >
                    {isVerifying ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying...</span>
                      </div>
                    ) : 'Unlock Access'}
                  </Button>
                </div>
              </form>

              {/* Help Text & Sign Out */}
              <div className="text-center mt-6 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-xs text-red-500 hover:text-red-600 font-bold hover:underline flex items-center justify-center gap-1 mx-auto transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Sign Out & Return Home
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Authenticated - show dashboard
  return <>{children}</>;
};
