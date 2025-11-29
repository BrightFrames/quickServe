import { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, Wallet, Building2, Phone, Loader2, Save, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { GlowCard } from '../ui/spotlight-card';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { toast } from 'sonner';

interface PaymentAccounts {
  upiId: string;
  phonePeMerchantId: string;
  bankAccount: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    bankName: string;
  };
  paytmMerchantId: string;
  razorpayKeyId: string;
}

const PaymentSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccounts>({
    upiId: '',
    phonePeMerchantId: '',
    bankAccount: {
      accountNumber: '',
      ifscCode: '',
      accountHolderName: '',
      bankName: '',
    },
    paytmMerchantId: '',
    razorpayKeyId: '',
  });

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
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
      if (restaurant.paymentAccounts) {
        setPaymentAccounts({
          upiId: restaurant.paymentAccounts.upiId || '',
          phonePeMerchantId: restaurant.paymentAccounts.phonePeMerchantId || '',
          bankAccount: {
            accountNumber: restaurant.paymentAccounts.bankAccount?.accountNumber || '',
            ifscCode: restaurant.paymentAccounts.bankAccount?.ifscCode || '',
            accountHolderName: restaurant.paymentAccounts.bankAccount?.accountHolderName || '',
            bankName: restaurant.paymentAccounts.bankAccount?.bankName || '',
          },
          paytmMerchantId: restaurant.paymentAccounts.paytmMerchantId || '',
          razorpayKeyId: restaurant.paymentAccounts.razorpayKeyId || '',
        });
      }
    } catch (error: any) {
      console.error('Error fetching payment settings:', error);
      setError(error.response?.data?.message || 'Failed to load payment settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const restaurantCode = localStorage.getItem('restaurantCode');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      await axios.put(`${apiUrl}/api/restaurant/payment-accounts/${restaurantCode}`, {
        paymentAccounts,
      });

      toast.success('Payment settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving payment settings:', error);
      toast.error(error.response?.data?.message || 'Failed to save payment settings');
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

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">Payment Settings</h2>
        <p className="text-gray-600 mt-1">
          Configure where you want to receive payments from customers
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* UPI Settings */}
      <GlowCard glowColor="orange" customSize className="w-full h-auto">
        <Card className="border-0 bg-white/80 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            UPI Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="upiId">UPI ID</Label>
            <Input
              id="upiId"
              placeholder="yourname@upi"
              value={paymentAccounts.upiId}
              onChange={(e) =>
                setPaymentAccounts({ ...paymentAccounts, upiId: e.target.value })
              }
            />
            <p className="text-xs text-gray-500">
              Your UPI ID where you want to receive customer payments (e.g., 9876543210@paytm)
            </p>
          </div>
        </CardContent>
      </Card>
      </GlowCard>

      {/* PhonePe Settings */}
      <GlowCard glowColor="orange" customSize className="w-full h-auto">
        <Card className="border-0 bg-white/80 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            PhonePe Merchant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phonePeMerchantId">PhonePe Merchant ID</Label>
            <Input
              id="phonePeMerchantId"
              placeholder="MERCHANTUAT or your merchant ID"
              value={paymentAccounts.phonePeMerchantId}
              onChange={(e) =>
                setPaymentAccounts({ ...paymentAccounts, phonePeMerchantId: e.target.value })
              }
            />
            <p className="text-xs text-gray-500">
              Your PhonePe merchant ID for accepting payments
            </p>
          </div>
        </CardContent>
      </Card>
      </GlowCard>

      {/* Bank Account Settings */}
      <GlowCard glowColor="orange" customSize className="w-full h-auto">
        <Card className="border-0 bg-white/80 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Bank Account Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountHolderName">Account Holder Name</Label>
              <Input
                id="accountHolderName"
                placeholder="John Doe"
                value={paymentAccounts.bankAccount.accountHolderName}
                onChange={(e) =>
                  setPaymentAccounts({
                    ...paymentAccounts,
                    bankAccount: {
                      ...paymentAccounts.bankAccount,
                      accountHolderName: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                placeholder="State Bank of India"
                value={paymentAccounts.bankAccount.bankName}
                onChange={(e) =>
                  setPaymentAccounts({
                    ...paymentAccounts,
                    bankAccount: {
                      ...paymentAccounts.bankAccount,
                      bankName: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                type="password"
                placeholder="••••••••••"
                value={paymentAccounts.bankAccount.accountNumber}
                onChange={(e) =>
                  setPaymentAccounts({
                    ...paymentAccounts,
                    bankAccount: {
                      ...paymentAccounts.bankAccount,
                      accountNumber: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ifscCode">IFSC Code</Label>
              <Input
                id="ifscCode"
                placeholder="SBIN0001234"
                value={paymentAccounts.bankAccount.ifscCode}
                onChange={(e) =>
                  setPaymentAccounts({
                    ...paymentAccounts,
                    bankAccount: {
                      ...paymentAccounts.bankAccount,
                      ifscCode: e.target.value.toUpperCase(),
                    },
                  })
                }
              />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Bank details for manual transfers or settlement of online payments
          </p>
        </CardContent>
      </Card>
      </GlowCard>

      {/* Other Payment Gateways */}
      <GlowCard glowColor="orange" customSize className="w-full h-auto">
        <Card className="border-0 bg-white/80 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Other Payment Gateways
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paytmMerchantId">Paytm Merchant ID</Label>
            <Input
              id="paytmMerchantId"
              placeholder="Your Paytm merchant ID"
              value={paymentAccounts.paytmMerchantId}
              onChange={(e) =>
                setPaymentAccounts({ ...paymentAccounts, paytmMerchantId: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="razorpayKeyId">Razorpay Key ID</Label>
            <Input
              id="razorpayKeyId"
              placeholder="rzp_live_xxxxxxxxxxxxxxxx"
              value={paymentAccounts.razorpayKeyId}
              onChange={(e) =>
                setPaymentAccounts({ ...paymentAccounts, razorpayKeyId: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>
      </GlowCard>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg" className="bg-orange-600 hover:bg-orange-700">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Payment Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PaymentSettings;
