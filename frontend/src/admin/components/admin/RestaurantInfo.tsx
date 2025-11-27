import { useState, useEffect } from 'react';
import axios from 'axios';
import { Building, Phone, Mail, MapPin, FileText, Loader2, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Alert, AlertDescription } from '@/shared/ui/alert';

const RestaurantInfo = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restaurantData, setRestaurantData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    gstNumber: '',
    restaurantCode: '',
    subscription: { plan: 'Free', startDate: null, endDate: null },
  });

  useEffect(() => {
    fetchRestaurantInfo();
  }, []);

  const fetchRestaurantInfo = async () => {
    try {
      const restaurantCode = localStorage.getItem('restaurantCode');
      
      if (!restaurantCode) {
        setError('Restaurant code not found. Please log in again.');
        setLoading(false);
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await axios.get(`${apiUrl}/api/restaurant/info/${restaurantCode}`);
      
      const { restaurant } = response.data;
      setRestaurantData({
        name: restaurant.name || '',
        email: restaurant.email || '',
        phone: restaurant.phone || 'Not provided',
        address: restaurant.address || 'Not provided',
        gstNumber: restaurant.gstNumber || 'Not registered',
        restaurantCode: restaurant.restaurantCode || '',
        subscription: restaurant.subscription || { plan: 'free', startDate: null, endDate: null },
      });
    } catch (error: any) {
      console.error('Error fetching restaurant info:', error);
      setError(error.response?.data?.message || 'Failed to load restaurant information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This information is managed by the restaurant owner. Contact them to update details.
        </AlertDescription>
      </Alert>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Restaurant Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building className="w-4 h-4" />
                <span className="font-medium">Restaurant Name</span>
              </div>
              <p className="text-lg font-semibold">{restaurantData.name}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="w-4 h-4" />
                <span className="font-medium">Restaurant Code</span>
              </div>
              <p className="text-lg font-semibold font-mono">{restaurantData.restaurantCode}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4" />
              <span className="font-medium">Email</span>
            </div>
            <p className="text-base">{restaurantData.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Contact & Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Contact & Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4" />
              <span className="font-medium">Phone Number</span>
            </div>
            <p className="text-base">{restaurantData.phone}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">Address</span>
            </div>
            <p className="text-base">{restaurantData.address}</p>
          </div>
        </CardContent>
      </Card>

      {/* GST Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            GST Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="w-4 h-4" />
              <span className="font-medium">GST Number</span>
            </div>
            <p className="text-base font-mono">
              {restaurantData.gstNumber === 'Not registered' ? (
                <span className="text-gray-500 italic">{restaurantData.gstNumber}</span>
              ) : (
                restaurantData.gstNumber
              )}
            </p>
            {restaurantData.gstNumber === 'Not registered' && (
              <p className="text-xs text-gray-500">
                Ask the restaurant owner to add GST number for invoice generation
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Info className="w-4 h-4" />
              <span className="font-medium">Plan</span>
            </div>
            <p className="text-base">
              <span className="font-semibold capitalize">{restaurantData.subscription.plan}</span>
            </p>
          </div>
          
          {restaurantData.subscription.startDate && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Info className="w-4 h-4" />
                <span className="font-medium">Start Date</span>
              </div>
              <p className="text-base">
                {new Date(restaurantData.subscription.startDate).toLocaleDateString()}
              </p>
            </div>
          )}
          
          {restaurantData.subscription.endDate && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Info className="w-4 h-4" />
                <span className="font-medium">End Date</span>
              </div>
              <p className="text-base">
                {new Date(restaurantData.subscription.endDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RestaurantInfo;
