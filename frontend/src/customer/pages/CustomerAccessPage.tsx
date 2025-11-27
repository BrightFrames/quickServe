import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Lock, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface RestaurantInfo {
  name: string;
  slug: string;
}

export default function CustomerAccessPage() {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Redirect path - where user was trying to go
  const from = location.state?.from || `/${restaurantSlug}/customer/menu`;

  // Check if authentication is required
  useEffect(() => {
    const checkAuthRequired = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/customer-auth/check-auth/${restaurantSlug}`
        );
        const data = await response.json();

        if (!data.requiresAuth) {
          // No authentication required, redirect to destination
          navigate(from, { replace: true });
        } else {
          setRestaurantInfo(data.restaurant);
        }
      } catch (err) {
        console.error('Failed to check auth:', err);
        setError('Failed to connect to restaurant. Please try again.');
      } finally {
        setCheckingAuth(false);
      }
    };

    // Check if already verified in session
    const verifiedSlug = sessionStorage.getItem(`customer_verified_${restaurantSlug}`);
    if (verifiedSlug === 'true') {
      navigate(from, { replace: true });
      return;
    }

    checkAuthRequired();
  }, [restaurantSlug, from, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!accessCode.trim()) {
      setError('Please enter the access code');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/customer-auth/verify-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: restaurantSlug,
          accessCode: accessCode.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store verification in session
        sessionStorage.setItem(`customer_verified_${restaurantSlug}`, 'true');
        
        // Redirect to intended destination
        navigate(from, { replace: true });
      } else {
        setError(data.message || 'Invalid access code');
        setAccessCode('');
      }
    } catch (err) {
      console.error('Verification failed:', err);
      setError('Failed to verify access code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-2">
            <Lock className="w-8 h-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {restaurantInfo?.name || 'Restaurant'}
          </CardTitle>
          <CardDescription className="text-base">
            This restaurant requires an access code to view the menu
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="accessCode" className="text-sm font-medium text-gray-700">
                Enter Access Code
              </label>
              <Input
                id="accessCode"
                type="text"
                placeholder="Enter code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                disabled={isLoading}
                className="text-center text-lg tracking-wider"
                maxLength={10}
                autoFocus
              />
              <p className="text-xs text-gray-500 text-center">
                Ask the restaurant staff for the access code
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Verifying...
                </span>
              ) : (
                'Continue to Menu'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
