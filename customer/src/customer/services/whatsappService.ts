class WhatsAppService {
  async sendOrderUpdate(phoneNumber: string, orderId: string, status: string): Promise<void> {
    // Simulate API call to send WhatsApp message
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log(`Sending WhatsApp update to ${phoneNumber} for order ${orderId}: ${status}`);
        
        // Simulate 90% success rate
        if (Math.random() > 0.1) {
          resolve();
        } else {
          reject(new Error('Failed to send WhatsApp message'));
        }
      }, 1000);
    });
  }

  async subscribeToOrderUpdates(phoneNumber: string, orderId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log(`Subscribing ${phoneNumber} to updates for order ${orderId}`);
        
        if (Math.random() > 0.05) {
          resolve();
        } else {
          reject(new Error('Failed to subscribe to WhatsApp updates'));
        }
      }, 800);
    });
  }

  formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present (assuming +1 for demo)
    if (!cleaned.startsWith('1') && cleaned.length === 10) {
      return `1${cleaned}`;
    }
    
    return cleaned;
  }
}

export const whatsappService = new WhatsAppService();
