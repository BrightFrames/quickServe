import { useState, useEffect } from 'react';
import axios from 'axios';
import { Building, Phone, Mail, MapPin, FileText, Save, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Separator } from '@/shared/ui/separator';
import { toast } from 'sonner';

const RestaurantProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    gstNumber: '',
    restaurantCode: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('restaurant_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await axios.get(`${apiUrl}/api/restaurant/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProfileData({
        name: response.data.restaurant.name || '',
        email: response.data.restaurant.email || '',
        phone: response.data.restaurant.phone || '',
        address: response.data.restaurant.address || '',
        gstNumber: response.data.restaurant.gstNumber || '',
        restaurantCode: response.data.restaurant.restaurantCode || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateGST = (gst: string) => {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gst === '' || gstRegex.test(gst.toUpperCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate GST if provided
    if (profileData.gstNumber && !validateGST(profileData.gstNumber)) {
      toast.error('Invalid GST number format. Format: 22AAAAA0000A1Z5');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('restaurant_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await axios.put(`${apiUrl}/api/restaurant/profile`, {
        phone: profileData.phone,
        address: profileData.address,
        gstNumber: profileData.gstNumber.toUpperCase() || null,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Profile updated successfully!');
      
      // Update local storage if needed
      const savedData = JSON.parse(localStorage.getItem('restaurant_data') || '{}');
      savedData.phone = response.data.restaurant.phone;
      savedData.address = response.data.restaurant.address;
      savedData.gstNumber = response.data.restaurant.gstNumber;
      localStorage.setItem('restaurant_data', JSON.stringify(savedData));
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Restaurant Profile</h1>
        <p className="text-gray-600 mt-2">
          Manage your restaurant information and GST details
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Restaurant Name
                  </div>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={profileData.name}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">Cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="restaurantCode">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Restaurant Code
                  </div>
                </Label>
                <Input
                  id="restaurantCode"
                  name="restaurantCode"
                  value={profileData.restaurantCode}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">Unique code for admin access</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </div>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={profileData.email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">Cannot be changed</p>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Contact & Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number *
                </div>
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={profileData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Address *
                </div>
              </Label>
              <Input
                id="address"
                name="address"
                value={profileData.address}
                onChange={handleChange}
                placeholder="Enter full address"
                required
              />
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
              <Label htmlFor="gstNumber">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  GST Number (Optional)
                </div>
              </Label>
              <Input
                id="gstNumber"
                name="gstNumber"
                value={profileData.gstNumber}
                onChange={handleChange}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
                className="uppercase"
              />
              <p className="text-xs text-gray-500">
                15-digit GST number. Format: 22AAAAA0000A1Z5
              </p>
              {profileData.gstNumber && !validateGST(profileData.gstNumber) && (
                <p className="text-xs text-red-500">Invalid GST format</p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-sm text-blue-900 mb-2">
                Why add GST number?
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Required for tax invoices</li>
                <li>✓ Shows on customer invoices sent via WhatsApp</li>
                <li>✓ Maintains legal compliance</li>
                <li>✓ Builds customer trust</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={fetchProfile}
            disabled={saving}
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={saving || (profileData.gstNumber && !validateGST(profileData.gstNumber))}
            className="min-w-[120px]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RestaurantProfile;
