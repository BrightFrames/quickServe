import { useState } from 'react';
import { whatsappService } from '../services/whatsappService';

export const useWhatsApp = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validatePhoneNumber = (phoneNumber: string): boolean => {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    // Check if it's a valid length (10-15 digits)
    return cleaned.length >= 10 && cleaned.length <= 15;
  };

  const sendOrderUpdate = async (phoneNumber: string, orderId: string, status: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      if (!validatePhoneNumber(phoneNumber)) {
        throw new Error('Invalid phone number format');
      }

      await whatsappService.sendOrderUpdate(phoneNumber, orderId, status);
      setSuccess(true);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send WhatsApp update';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const subscribeToUpdates = async (phoneNumber: string, orderId: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      if (!validatePhoneNumber(phoneNumber)) {
        throw new Error('Invalid phone number format');
      }

      await whatsappService.subscribeToOrderUpdates(phoneNumber, orderId);
      setSuccess(true);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe to updates';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setError(null);
    setSuccess(false);
  };

  return {
    loading,
    error,
    success,
    validatePhoneNumber,
    sendOrderUpdate,
    subscribeToUpdates,
    resetState,
  };
};
