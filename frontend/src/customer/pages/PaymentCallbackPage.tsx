import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function PaymentCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('Processing your payment...');

  const orderId = searchParams.get('orderId');
  const transactionId = searchParams.get('transactionId');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!transactionId) {
        setStatus('failed');
        setMessage('Transaction ID not found');
        return;
      }

      try {
        // Check payment status from PhonePe
        const response = await fetch(
          `${API_BASE_URL}/api/payment/phonepe/status/${transactionId}`
        );
        const data = await response.json();

        if (data.success && data.status === 'COMPLETED') {
          setStatus('success');
          setMessage('Payment successful! Your order has been confirmed.');
          
          // Redirect to order status after 2 seconds
          setTimeout(() => {
            navigate(`../order-status?orderId=${orderId}`);
          }, 2000);
        } else {
          setStatus('failed');
          setMessage('Payment failed. Please try again.');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('failed');
        setMessage('Unable to verify payment. Please contact support.');
      }
    };

    verifyPayment();
  }, [transactionId, orderId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'loading' && (
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            )}
            {status === 'failed' && (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Processing Payment'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'failed' && 'Payment Failed'}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {message}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {status === 'failed' && (
            <div className="space-y-3">
              <Button
                onClick={() => navigate('../checkout')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Try Again
              </Button>
              <Button
                onClick={() => navigate('../menu')}
                variant="outline"
                className="w-full"
              >
                Back to Menu
              </Button>
            </div>
          )}
          
          {status === 'success' && (
            <div className="text-center text-sm text-gray-600">
              Redirecting to order status...
            </div>
          )}

          {orderId && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-gray-600">Order ID</p>
              <p className="text-sm font-mono font-semibold text-gray-900">#{orderId}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
