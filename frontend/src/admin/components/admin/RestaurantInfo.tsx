import { useState, useEffect } from 'react';
import axios from 'axios';
import { Building, Phone, Mail, MapPin, FileText, Loader2, Info, Edit, Save, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { GlowCard } from '../ui/spotlight-card';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Button } from '@/shared/ui/button';
import { toast } from 'sonner';

const RestaurantInfo = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [restaurantData, setRestaurantData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    gstNumber: '',
    restaurantCode: '',
    taxPercentage: 5.00,
    subscription: { plan: 'Free', startDate: null, endDate: null },
  });
  
  const [editForm, setEditForm] = useState({
    phone: '',
    address: '',
    gstNumber: '',
    taxPercentage: 5.00,
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
      const response = await axios.get(`${apiUrl}/api/restaurant/info/code/${restaurantCode}`);
      
      const { restaurant } = response.data;
      setRestaurantData({
        name: restaurant.name || '',
        email: restaurant.email || '',
        phone: restaurant.phone || 'Not provided',
        address: restaurant.address || 'Not provided',
        gstNumber: restaurant.gstNumber || 'Not registered',
        restaurantCode: restaurant.restaurantCode || '',
        taxPercentage: restaurant.taxPercentage || 5.00,
        subscription: restaurant.subscription || { plan: 'free', startDate: null, endDate: null },
      });
      
      // Initialize edit form with current data
      setEditForm({
        phone: restaurant.phone || '',
        address: restaurant.address || '',
        gstNumber: restaurant.gstNumber || '',
        taxPercentage: restaurant.taxPercentage || 5.00,
      });
    } catch (error: any) {
      console.error('Error fetching restaurant info:', error);
      setError(error.response?.data?.message || 'Failed to load restaurant information');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Reset form to original data
    setEditForm({
      phone: restaurantData.phone === 'Not provided' ? '' : restaurantData.phone,
      address: restaurantData.address === 'Not provided' ? '' : restaurantData.address,
      gstNumber: restaurantData.gstNumber === 'Not registered' ? '' : restaurantData.gstNumber,
      taxPercentage: restaurantData.taxPercentage || 5.00,
    });
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('restaurantToken');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      if (!token) {
        toast.error('Authentication required. Please login again.');
        return;
      }
      
      await axios.put(`${apiUrl}/api/restaurant/profile`, {
        phone: editForm.phone || null,
        address: editForm.address || null,
        gstNumber: editForm.gstNumber || null,
        taxPercentage: parseFloat(editForm.taxPercentage.toString()) || 5.00,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      toast.success('Restaurant information updated successfully!');
      setIsEditing(false);
      fetchRestaurantInfo(); // Refresh data
    } catch (error: any) {
      console.error('Error updating restaurant info:', error);
      toast.error(error.response?.data?.message || 'Failed to update restaurant information');
    } finally {
      setSaving(false);
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
      <div className="flex items-center justify-between">
        <Alert className="flex-1">
          <Info className="h-4 w-4" />
          <AlertDescription>
            {isEditing 
              ? 'Edit your restaurant information below and click Save to update.'
              : 'You can edit your restaurant information by clicking the Edit button.'}
          </AlertDescription>
        </Alert>
        
        {!isEditing ? (
          <Button onClick={handleEdit} className="ml-4 bg-orange-600 hover:bg-orange-700">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2 ml-4">
            <Button onClick={handleSave} disabled={saving} className="bg-orange-600 hover:bg-orange-700">
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save
            </Button>
            <Button onClick={handleCancel} variant="outline" disabled={saving}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Basic Information */}
      <GlowCard glowColor="orange" customSize className="w-full h-auto">
        <Card className="border-0 bg-white/80 shadow-none">
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
      </GlowCard>

      {/* Contact & Address */}
      <GlowCard glowColor="orange" customSize className="w-full h-auto">
        <Card className="border-0 bg-white/80 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Contact & Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEditing ? (
            <>
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
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Address
                </Label>
                <Input
                  id="address"
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="Enter restaurant address"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
      </GlowCard>

      {/* GST Information */}
      <GlowCard glowColor="orange" customSize className="w-full h-auto">
        <Card className="border-0 bg-white/80 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            GST & Tax Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEditing ? (
            <>
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
                    Add GST number for invoice generation
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span className="font-medium">Tax Percentage</span>
                </div>
                <p className="text-base">
                  <span className="font-semibold text-lg">{restaurantData.taxPercentage}%</span>
                </p>
                <p className="text-xs text-gray-500">
                  This tax rate will be applied to all orders
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="gstNumber" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  GST Number
                </Label>
                <Input
                  id="gstNumber"
                  type="text"
                  value={editForm.gstNumber}
                  onChange={(e) => setEditForm({ ...editForm, gstNumber: e.target.value.toUpperCase() })}
                  placeholder="Enter GST number (e.g., 22AAAAA0000A1Z5)"
                  maxLength={15}
                />
                <p className="text-xs text-gray-500">
                  GST number should be 15 characters (optional)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="taxPercentage" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Tax Percentage (%)
                </Label>
                <Input
                  id="taxPercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={editForm.taxPercentage}
                  onChange={(e) => setEditForm({ ...editForm, taxPercentage: parseFloat(e.target.value) || 0 })}
                  placeholder="Enter tax percentage (e.g., 5.00)"
                />
                <p className="text-xs text-gray-500">
                  Tax percentage will be applied to all orders (0-100%)
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      </GlowCard>

      {/* Subscription */}
      <GlowCard glowColor="orange" customSize className="w-full h-auto">
        <Card className="border-0 bg-white/80 shadow-none">
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
      </GlowCard>
    </div>
  );
};

export default RestaurantInfo;
