import axios from "axios";

class PaymentService {
  private baseUrl = import.meta.env.VITE_API_URL || 'https://quickserve-51ek.onrender.com';
  private apiUrl = `${this.baseUrl}/api/payment`;

  /**
   * Initiate UPI payment and get deep link
   */
  async initiateUpiPayment(orderId: string, amount: number) {
    try {
      const response = await axios.post(`${this.apiUrl}/upi/initiate`, {
        orderId,
        amount,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error initiating UPI payment:", error);
      throw new Error(
        error.response?.data?.message || "Failed to initiate UPI payment"
      );
    }
  }

  /**
   * Update payment status after payment completion
   */
  async updatePaymentStatus(
    orderId: string,
    paymentMethod: "cash" | "card" | "upi",
    paymentStatus: "pending" | "paid" | "failed",
    transactionId?: string
  ) {
    try {
      const response = await axios.post(`${this.apiUrl}/status`, {
        orderId,
        paymentMethod,
        paymentStatus,
        transactionId,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error updating payment status:", error);
      throw new Error(
        error.response?.data?.message || "Failed to update payment status"
      );
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(orderId: string) {
    try {
      const response = await axios.get(`${this.apiUrl}/verify/${orderId}`);
      return response.data;
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      throw new Error(
        error.response?.data?.message || "Failed to verify payment"
      );
    }
  }

  /**
   * Open UPI app with payment details
   */
  openUpiApp(upiLink: string) {
    // For mobile devices, directly open the UPI link
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.location.href = upiLink;
    } else {
      // For desktop, show QR code or copy link
      return upiLink;
    }
  }
}

export const paymentService = new PaymentService();
