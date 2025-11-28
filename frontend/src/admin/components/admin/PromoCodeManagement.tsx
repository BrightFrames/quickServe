import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Loader2, Tag, Calendar, Percent, Hash, DollarSign, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/ui/dialog';
import { Badge } from '@/shared/ui/badge';
import { Switch } from '@/shared/ui/switch';

interface PromoCode {
  id: number;
  code: string;
  discountPercentage: number;
  isActive: boolean;
  validFrom: string | null;
  validTo: string | null;
  maxUses: number | null;
  usedCount: number;
  minOrderAmount: number;
  createdAt: string;
}

const PromoCodeManagement = () => {
  const [loading, setLoading] = useState(true);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discountPercentage: 10,
    validFrom: '',
    validTo: '',
    maxUses: '',
    minOrderAmount: 0,
  });

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await axios.get(`${apiUrl}/api/promo-codes`);
      setPromoCodes(response.data);
    } catch (error: any) {
      console.error('Error fetching promo codes:', error);
      setError(error.response?.data?.error || 'Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (promo?: PromoCode) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData({
        code: promo.code,
        discountPercentage: promo.discountPercentage,
        validFrom: promo.validFrom ? new Date(promo.validFrom).toISOString().split('T')[0] : '',
        validTo: promo.validTo ? new Date(promo.validTo).toISOString().split('T')[0] : '',
        maxUses: promo.maxUses?.toString() || '',
        minOrderAmount: promo.minOrderAmount,
      });
    } else {
      setEditingPromo(null);
      setFormData({
        code: '',
        discountPercentage: 10,
        validFrom: '',
        validTo: '',
        maxUses: '',
        minOrderAmount: 0,
      });
    }
    setShowDialog(true);
    setError(null);
  };

  const handleSave = async () => {
    try {
      setError(null);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      const payload = {
        code: formData.code.toUpperCase(),
        discountPercentage: formData.discountPercentage,
        validFrom: formData.validFrom || null,
        validTo: formData.validTo || null,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        minOrderAmount: formData.minOrderAmount,
      };

      if (editingPromo) {
        await axios.put(`${apiUrl}/api/promo-codes/${editingPromo.id}`, payload);
        setSuccess('Promo code updated successfully!');
      } else {
        await axios.post(`${apiUrl}/api/promo-codes`, payload);
        setSuccess('Promo code created successfully!');
      }

      setShowDialog(false);
      fetchPromoCodes();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error saving promo code:', error);
      setError(error.response?.data?.error || 'Failed to save promo code');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await axios.delete(`${apiUrl}/api/promo-codes/${id}`);
      setSuccess('Promo code deleted successfully!');
      fetchPromoCodes();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error deleting promo code:', error);
      setError(error.response?.data?.error || 'Failed to delete promo code');
    }
  };

  const handleToggleActive = async (promo: PromoCode) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await axios.patch(`${apiUrl}/api/promo-codes/${promo.id}/toggle`);
      setSuccess(`Promo code ${promo.isActive ? 'deactivated' : 'activated'} successfully!`);
      fetchPromoCodes();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error toggling promo code:', error);
      setError(error.response?.data?.error || 'Failed to toggle promo code');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Promo Code Management</h2>
        <Button onClick={() => handleOpenDialog()} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Promo Code
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Promo Codes</CardTitle>
        </CardHeader>
        <CardContent>
          {promoCodes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No promo codes yet. Create one to get started!</p>
          ) : (
            <div className="space-y-4">
              {promoCodes.map((promo) => (
                <div
                  key={promo.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <code className="text-lg font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded">
                          {promo.code}
                        </code>
                        <Badge variant={promo.isActive ? 'default' : 'secondary'}>
                          {promo.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-lg font-semibold text-green-600">
                          {promo.discountPercentage}% OFF
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {promo.validFrom && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>From: {new Date(promo.validFrom).toLocaleDateString()}</span>
                          </div>
                        )}
                        {promo.validTo && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>To: {new Date(promo.validTo).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-600">
                          <Hash className="w-4 h-4" />
                          <span>
                            Used: {promo.usedCount}
                            {promo.maxUses && ` / ${promo.maxUses}`}
                          </span>
                        </div>
                        {promo.minOrderAmount > 0 && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <DollarSign className="w-4 h-4" />
                            <span>Min: ₹{promo.minOrderAmount}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleActive(promo)}
                        title={promo.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {promo.isActive ? (
                          <ToggleRight className="w-5 h-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDialog(promo)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(promo.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPromo ? 'Edit Promo Code' : 'Create Promo Code'}
            </DialogTitle>
            <DialogDescription>
              {editingPromo
                ? 'Update the promo code details below.'
                : 'Fill in the details to create a new promo code.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Promo Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., SUMMER20"
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountPercentage">Discount Percentage (%) *</Label>
              <Input
                id="discountPercentage"
                type="number"
                min="0"
                max="100"
                value={formData.discountPercentage}
                onChange={(e) => setFormData({ ...formData, discountPercentage: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validFrom">Valid From</Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validTo">Valid To</Label>
                <Input
                  id="validTo"
                  type="date"
                  value={formData.validTo}
                  onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxUses">Maximum Uses</Label>
              <Input
                id="maxUses"
                type="number"
                min="1"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                placeholder="Leave empty for unlimited"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minOrderAmount">Minimum Order Amount (₹)</Label>
              <Input
                id="minOrderAmount"
                type="number"
                min="0"
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingPromo ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromoCodeManagement;
