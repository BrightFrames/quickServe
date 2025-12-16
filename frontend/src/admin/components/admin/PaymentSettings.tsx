import { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, Wallet, Building2, Phone, Loader2, Save, AlertCircle, Banknote, Percent } from 'lucide-react';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { toast } from 'sonner';
import { Switch } from '@/shared/ui/switch';

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
  cashfree?: {
    appId: string;
    secretKey: string;
  };
  platformFee?: {
    enabled: boolean;
    percentage: number;
  };
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
    cashfree: { appId: '', secretKey: '' },
    platformFee: { enabled: false, percentage: 0 },
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
          cashfree: restaurant.paymentAccounts.cashfree || { appId: '', secretKey: '' },
          platformFee: restaurant.paymentAccounts.platformFee || { enabled: false, percentage: 0 },
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
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between pb-6 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Payment Configuration</h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure gateways, fees, and settlement details.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 transition-colors"
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
        </button>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Platform Fee Configuration (Requested Feature) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Percent className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Platform Fee Configuration</h3>
                <p className="text-xs text-gray-500">Configure additional fees charged to customers</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={paymentAccounts.platformFee?.enabled}
                onCheckedChange={(checked) => setPaymentAccounts({
                  ...paymentAccounts,
                  platformFee: { ...paymentAccounts.platformFee!, enabled: checked }
                })}
              />
              <span className="text-sm font-medium text-gray-700">
                {paymentAccounts.platformFee?.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          {paymentAccounts.platformFee?.enabled && (
            <div className="p-6 bg-green-50/30">
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Platform Fee Percentage (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="1.00"
                      value={paymentAccounts.platformFee?.percentage || ''}
                      onChange={(e) => setPaymentAccounts({
                        ...paymentAccounts,
                        platformFee: { ...paymentAccounts.platformFee!, percentage: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none transition-all pl-10"
                    />
                    <Percent className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-xs text-slate-600 font-medium flex items-start gap-1.5 mt-2">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                    <span>
                      <strong>Note:</strong> Cashfree gateway deducts 1% per transaction.
                      Set this fee accordingly (e.g. 1.5% or 2%) if you wish to cover that deduction and generate profit.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cashfree Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Banknote className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Cashfree Gateway</h3>
              <p className="text-xs text-gray-500">API Credentials for Cashfree</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">App ID</label>
              <input
                placeholder="Enter Cashfree App ID"
                value={paymentAccounts.cashfree?.appId || ''}
                onChange={(e) =>
                  setPaymentAccounts({
                    ...paymentAccounts,
                    cashfree: { ...paymentAccounts.cashfree!, appId: e.target.value }
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Secret Key</label>
              <input
                type="password"
                placeholder="Enter Cashfree Secret Key"
                value={paymentAccounts.cashfree?.secretKey || ''}
                onChange={(e) =>
                  setPaymentAccounts({
                    ...paymentAccounts,
                    cashfree: { ...paymentAccounts.cashfree!, secretKey: e.target.value }
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all font-mono"
              />
            </div>
          </div>
        </div>

        {/* UPI Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Wallet className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">UPI Payments</h3>
              <p className="text-xs text-gray-500">Direct UPI transfers</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="upiId" className="text-sm font-medium text-gray-700">UPI ID</label>
              <input
                id="upiId"
                placeholder="restaurant@upi"
                value={paymentAccounts.upiId}
                onChange={(e) =>
                  setPaymentAccounts({ ...paymentAccounts, upiId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* PhonePe Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Phone className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-900">PhonePe Integration</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="phonePeMerchantId" className="text-sm font-medium text-gray-700">PhonePe Merchant ID</label>
              <input
                id="phonePeMerchantId"
                placeholder="MERCHANTUAT"
                value={paymentAccounts.phonePeMerchantId}
                onChange={(e) =>
                  setPaymentAccounts({ ...paymentAccounts, phonePeMerchantId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Other Gateways */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <CreditCard className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Other Gateways</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="paytmMerchantId" className="text-sm font-medium text-gray-700">Paytm Merchant ID</label>
              <input
                id="paytmMerchantId"
                placeholder="Enter Merchant ID"
                value={paymentAccounts.paytmMerchantId}
                onChange={(e) =>
                  setPaymentAccounts({ ...paymentAccounts, paytmMerchantId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="razorpayKeyId" className="text-sm font-medium text-gray-700">Razorpay Key ID</label>
              <input
                id="razorpayKeyId"
                placeholder="rzp_live_..."
                value={paymentAccounts.razorpayKeyId}
                onChange={(e) =>
                  setPaymentAccounts({ ...paymentAccounts, razorpayKeyId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Bank Account Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Bank Settlement Details</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="accountHolderName" className="text-sm font-medium text-gray-700">Account Holder Name</label>
              <input
                id="accountHolderName"
                placeholder="Restaurant Business Name"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="bankName" className="text-sm font-medium text-gray-700">Bank Name</label>
              <input
                id="bankName"
                placeholder="HDFC Bank"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="accountNumber" className="text-sm font-medium text-gray-700">Account Number</label>
              <input
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all font-mono"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="ifscCode" className="text-sm font-medium text-gray-700">IFSC Code</label>
              <input
                id="ifscCode"
                placeholder="HDFC0001234"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all font-mono"
              />
            </div>
            <p className="text-xs text-gray-500 col-span-2">
              Active payments will be settled to this bank account according to the payout schedule.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PaymentSettings;
