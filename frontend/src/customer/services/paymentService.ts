import axios from "axios";

class PaymentService {
  private getBaseUrl() {
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    if (window.location.hostname.includes('vercel.app')) {
      return 'https://quickserve-51ek.onrender.com';
    }
    return 'http://localhost:3000';
  }

  private get apiUrl() {
    return `${this.getBaseUrl()}/api/payment`;
  }

  private getHeaders() {
    const token = localStorage.getItem('token') || localStorage.getItem('restaurantToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Initiate UPI payment and get deep link
   */
  async initiateUpiPayment(orderId: string, amount: number) {
    try {
      const response = await axios.post(`${this.apiUrl}/upi/initiate`, {
        orderId,
        amount,
      }, {
        headers: this.getHeaders()
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
      }, {
        headers: this.getHeaders()
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
      const response = await axios.get(`${this.apiUrl}/verify/${orderId}`, {
        headers: this.getHeaders()
      });
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
