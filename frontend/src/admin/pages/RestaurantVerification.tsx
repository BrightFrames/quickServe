import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const RestaurantVerification = () => {
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying restaurant...');

  useEffect(() => {
    const verifyRestaurant = async () => {
      try {
        // Parse URL: /:slug?code=QS1234/admin or /:slug?code=QS1234/kitchen
        const searchParams = new URLSearchParams(location.search);
        const fullPath = location.search.slice(1); // Remove the '?'
        
        // Extract code and panel type from the query string
        // Format: code=QS1234/admin or code=QS1234/kitchen
        const match = fullPath.match(/code=([A-Z]{2}\d{4})\/(admin|kitchen)/i);
        
        if (!match) {
          setStatus('error');
          setMessage('Invalid URL format. Please use: /:slug?code=QS1234/admin');
          return;
        }

        const restaurantCode = match[1].toUpperCase();
        const panelType = match[2].toLowerCase();

        console.log('Verifying:', { restaurantSlug, restaurantCode, panelType });

        // Verify restaurant with backend
        const response = await axios.get(
          `/api/restaurant/verify/${restaurantSlug}/${restaurantCode}`
        );

        if (response.data.verified) {
          setStatus('success');
          setMessage(`Welcome to ${response.data.restaurant.name}!`);
          
          // Store restaurant data
          localStorage.setItem('restaurantId', response.data.restaurant.id);
          localStorage.setItem('restaurantName', response.data.restaurant.name);
          localStorage.setItem('restaurantCode', response.data.restaurant.restaurantCode);
          localStorage.setItem('restaurantSlug', response.data.restaurant.slug);

          // Redirect to appropriate login page after 1 second
          setTimeout(() => {
            if (panelType === 'admin') {
              navigate('/admin/login', { replace: true });
            } else if (panelType === 'kitchen') {
              navigate('/kitchen/login', { replace: true });
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

    if (restaurantSlug) {
      verifyRestaurant();
    } else {
      setStatus('error');
      setMessage('Restaurant slug is missing from URL');
    }
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
