import { useState, useEffect } from 'react';
import axios from 'axios';
import { Building, Phone, Mail, MapPin, FileText, Loader2, Info, Edit, Save, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
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
      const token = localStorage.getItem('token') || localStorage.getItem('restaurantToken');
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
      fetchRestaurantInfo();
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
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Restaurant Profile</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your business details, address, and taxation info.</p>
        </div>

        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="flex items-center justify-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center justify-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Changes</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Building className="w-5 h-5 text-slate-900" />
            </div>
            <h3 className="font-semibold text-slate-900">General Information</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-sm text-gray-500">Restaurant Name</span>
                <p className="font-medium text-slate-900">{restaurantData.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-gray-500">Restaurant Code</span>
                <p className="font-mono text-sm bg-slate-50 px-2 py-1 rounded w-fit text-slate-700 border border-slate-100">{restaurantData.restaurantCode}</p>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-sm text-gray-500 flex items-center gap-2"> <Mail className="w-3.5 h-3.5" /> Email Address </span>
              <p className="font-medium text-slate-900">{restaurantData.email}</p>
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Info className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Subscription Status</h3>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-gray-500">Current Plan</p>
                <p className="text-xl font-bold text-slate-900 capitalize mt-1">{restaurantData.subscription.plan}</p>
              </div>
              <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wide">
                Active
              </div>
            </div>

            {(restaurantData.subscription.startDate || restaurantData.subscription.endDate) && (
              <div className="flex gap-6 pt-4 border-t border-gray-100">
                {restaurantData.subscription.startDate && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Start Date</p>
                    <p className="text-sm font-medium">{new Date(restaurantData.subscription.startDate).toLocaleDateString()}</p>
                  </div>
                )}
                {restaurantData.subscription.endDate && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Renews On</p>
                    <p className="text-sm font-medium">{new Date(restaurantData.subscription.endDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Contact & Address */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden lg:col-span-2">
          <div className="p-5 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Location & Contact</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {!isEditing ? (
                <>
                  <div className="space-y-1">
                    <span className="text-sm text-gray-500 flex items-center gap-2 mb-1"><Phone className="w-3.5 h-3.5" /> Phone</span>
                    <p className="font-medium text-slate-900">{restaurantData.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-gray-500 flex items-center gap-2 mb-1"><MapPin className="w-3.5 h-3.5" /> Address</span>
                    <p className="font-medium text-slate-900">{restaurantData.address}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="focus:ring-slate-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="focus:ring-slate-900"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Taxation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden lg:col-span-2">
          <div className="p-5 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Tax & Registration</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {!isEditing ? (
                <>
                  <div className="space-y-1">
                    <span className="text-sm text-gray-500 mb-1 block">GST Number</span>
                    <p className="font-medium text-slate-900 font-mono tracking-wide">{restaurantData.gstNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-gray-500 mb-1 block">Tax Percentage</span>
                    <p className="font-bold text-slate-900 text-lg">{restaurantData.taxPercentage}%</p>
                    <p className="text-xs text-gray-400">Applied to all orders</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="gstNumber">GST Number</Label>
                    <Input
                      id="gstNumber"
                      value={editForm.gstNumber}
                      onChange={(e) => setEditForm({ ...editForm, gstNumber: e.target.value.toUpperCase() })}
                      className="focus:ring-slate-900 font-mono"
                      maxLength={15}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxPercentage">Tax Percentage (%)</Label>
                    <Input
                      id="taxPercentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={editForm.taxPercentage}
                      onChange={(e) => setEditForm({ ...editForm, taxPercentage: parseFloat(e.target.value) || 0 })}
                      className="focus:ring-slate-900"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RestaurantInfo;
