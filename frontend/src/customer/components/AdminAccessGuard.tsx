import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Lock, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AdminAccessGuard = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const navigate = useNavigate();
  const { restaurantSlug, tableNumber } = useParams();

  // Block back button
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, '', window.location.href);
      toast.error('Access denied. Please use the provided navigation.');
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Block page reload and URL editing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast.error('Please enter the restaurant password');
      return;
    }

    if (attemptCount >= 3) {
      toast.error('Too many attempts. Redirecting to customer menu...');
      setTimeout(() => {
        navigate(`/${restaurantSlug}/customer/menu/table/${tableNumber || 't1'}`, { replace: true });
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
        // Mark this session as admin-verified
        sessionStorage.setItem('adminVerified', 'true');
        sessionStorage.setItem('adminVerifiedAt', Date.now().toString());
        
        toast.success('Access granted');
        
        // Allow navigation to admin area
        window.location.href = `/${restaurantSlug}/admin/login`;
      }
    } catch (error: any) {
      const newAttemptCount = attemptCount + 1;
      setAttemptCount(newAttemptCount);
      
      if (newAttemptCount >= 3) {
        toast.error('Access denied. Too many failed attempts.');
        setTimeout(() => {
          navigate(`/${restaurantSlug}/customer/menu/table/${tableNumber || 't1'}`, { replace: true });
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
    navigate(`/${restaurantSlug}/customer/menu/table/${tableNumber || 't1'}`, { replace: true });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="bg-red-100 p-3 rounded-full">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">
                Restricted Area
              </h3>
              <p className="text-sm text-yellow-800">
                This area is restricted to restaurant administrators only. 
                Please enter the restaurant account password to continue.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restaurant Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter restaurant password"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                disabled={isVerifying || attemptCount >= 3}
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
            {attemptCount > 0 && attemptCount < 3 && (
              <p className="text-sm text-red-600 mt-2">
                Failed attempts: {attemptCount}/3
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={isVerifying}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying || attemptCount >= 3}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>

        {/* Info */}
        <p className="text-xs text-gray-500 text-center mt-4">
          This is a security measure to protect restaurant management access.
        </p>
      </div>
    </div>
  );
};
