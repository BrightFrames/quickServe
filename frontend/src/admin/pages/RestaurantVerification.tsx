import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const RestaurantVerification = () => {
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying restaurant...');

  useEffect(() => {
    const verifyRestaurant = async () => {
      try {
        // Parse URL: /verify/:slug?code=QS1234&type=admin or /verify/:slug?code=QS1234&type=kitchen
        const searchParams = new URLSearchParams(location.search);
        const restaurantCode = searchParams.get('code');
        const panelType = searchParams.get('type');
        
        // For admin panel, slug is optional - use code only
        if (panelType === 'admin' && restaurantCode) {
          console.log('Admin verification - using code only:', restaurantCode);
          
          // Verify restaurant with backend using code only
          const response = await axios.post(`${apiUrl}/api/restaurant/verify-admin`, {
            code: restaurantCode.toUpperCase()
          });

          if (response.data.verified) {
            setStatus('success');
            setMessage(`Welcome to ${response.data.restaurant.name}!`);
            
            // Store restaurant data for admin login
            localStorage.setItem('restaurantName', response.data.restaurant.name);
            localStorage.setItem('restaurantCode', response.data.restaurant.restaurantCode);
            localStorage.setItem('restaurantSlug', response.data.restaurant.slug);
            localStorage.setItem('restaurantEmail', response.data.restaurant.email || '');
            localStorage.setItem('restaurantId', response.data.restaurant.id);

            // Redirect to admin login
            setTimeout(() => {
              navigate(`/${response.data.restaurant.slug}/admin/login`, { replace: true });
            }, 1000);
          } else {
            setStatus('error');
            setMessage('Restaurant verification failed. Invalid code.');
          }
          return;
        }
        
        // For kitchen/captain/reception, require slug
        if (!restaurantSlug || !restaurantCode || !panelType) {
          setStatus('error');
          setMessage('Invalid URL format. Please use: /verify/:slug?code=QS1234&type=kitchen');
          return;
        }

        console.log('Verifying:', { restaurantSlug, restaurantCode, panelType });

        // Verify restaurant with backend
        const response = await axios.get(
          `${apiUrl}/api/restaurant/verify/${restaurantSlug}/${restaurantCode.toUpperCase()}`
        );

        if (response.data.verified) {
          setStatus('success');
          setMessage(`Welcome to ${response.data.restaurant.name}!`);
          
          // Store restaurant data for admin login
          localStorage.setItem('restaurantName', response.data.restaurant.name);
          localStorage.setItem('restaurantCode', response.data.restaurant.restaurantCode);
          localStorage.setItem('restaurantSlug', response.data.restaurant.slug);
          localStorage.setItem('restaurantEmail', response.data.restaurant.email || '');
          localStorage.setItem('restaurantId', response.data.restaurant.id);

          // Redirect to appropriate login page after 1 second
          setTimeout(() => {
            if (panelType === 'admin') {
              navigate(`/${restaurantSlug}/admin/login`, { replace: true });
            } else if (panelType === 'kitchen') {
              navigate(`/${restaurantSlug}/kitchen/login`, { replace: true });
            }
          }, 1000);
        } else {
          setStatus('error');
          setMessage('Restaurant verification failed. Invalid slug or code.');
        }
      } catch (error: any) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage(
          error.response?.data?.message || 
          'Failed to verify restaurant. Please check the URL and try again.'
        );
      }
    };

    verifyRestaurant();
  }, [restaurantSlug, location.search, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center">
          {status === 'verifying' && (
            <>
              <Loader2 className="w-16 h-16 text-red-600 mx-auto mb-4 animate-spin" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Verifying Restaurant
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Verification Successful!
              </h2>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500 mt-2">Redirecting to login...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Verification Failed
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <button
                onClick={() => navigate('/')}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Go to Home
              </button>
            </>
          )}
        </div>

        {restaurantSlug && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 font-medium mb-1">Restaurant Slug:</p>
            <code className="text-sm text-gray-800">{restaurantSlug}</code>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantVerification;
