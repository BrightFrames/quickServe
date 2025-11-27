import axios from 'axios';
import Restaurant from '../models/Restaurant.js';

/**
 * Generate invoice message for WhatsApp
 */
export const generateInvoiceMessage = (orderDetails, restaurantInfo) => {
  const itemsList = orderDetails.items
    .map(item => `${item.quantity}x ${item.name} - ₹${(item.price * item.quantity).toFixed(2)}`)
    .join('\n');

  const message = `
╔═══════════════════════════════╗
     📋 *TAX INVOICE*
╚═══════════════════════════════╝

🏪 *${restaurantInfo.name}*
${restaurantInfo.address}
${restaurantInfo.gstNumber ? `GST: ${restaurantInfo.gstNumber}` : ''}
Phone: ${restaurantInfo.phone}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 *Invoice Details*
Invoice No: ${orderDetails.orderNumber}
Date: ${new Date(orderDetails.createdAt).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}
Table: ${orderDetails.tableNumber}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛒 *ITEMS*
${itemsList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 *BILL SUMMARY*
Subtotal      : ₹${orderDetails.subtotal.toFixed(2)}
${orderDetails.discount > 0 ? `Discount      : -₹${orderDetails.discount.toFixed(2)}\n` : ''}CGST (4.5%)   : ₹${(orderDetails.tax / 2).toFixed(2)}
SGST (4.5%)   : ₹${(orderDetails.tax / 2).toFixed(2)}
────────────────────────────────
*TOTAL         : ₹${orderDetails.total.toFixed(2)}*

💳 Payment: ${orderDetails.paymentMethod.toUpperCase()}
Status: ${orderDetails.paymentStatus === 'paid' ? '✅ PAID' : '⏳ PENDING'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thank you for your order! 🙏
Visit again soon! 😊

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Powered by QuickServe
  `.trim();

  return message;
};

/**
 * Send invoice via WhatsApp using CallMeBot API (FREE)
 * Setup: Send "I allow callmebot to send me messages" to +34 644 51 89 45 on WhatsApp
 */
export const sendInvoiceViaWhatsApp = async (phoneNumber, orderDetails, restaurantId) => {
  try {
    // Get restaurant details
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    const restaurantInfo = {
      name: restaurant.name,
      address: restaurant.address,
      phone: restaurant.phone,
      gstNumber: restaurant.gstNumber || null,
    };

    // Generate invoice message
    const message = generateInvoiceMessage(orderDetails, restaurantInfo);

    // CallMeBot API endpoint (FREE)
    const apiKey = process.env.CALLMEBOT_API_KEY;
    
    if (!apiKey) {
      console.warn('CallMeBot API key not configured. Skipping WhatsApp invoice.');
      return { success: false, message: 'WhatsApp not configured' };
    }

    // Format phone number (remove +91 if present)
    const formattedPhone = phoneNumber.replace(/^\+?91/, '');
    const fullPhone = `91${formattedPhone}`; // Add country code

    const apiUrl = `https://api.callmebot.com/whatsapp.php`;
    
    const response = await axios.get(apiUrl, {
      params: {
        phone: fullPhone,
        text: message,
        apikey: apiKey,
      },
      timeout: 10000, // 10 second timeout
    });

    console.log(`[INVOICE] WhatsApp invoice sent to ${fullPhone}`);
    return { success: true, message: 'Invoice sent successfully' };

  } catch (error) {
    console.error('[INVOICE] Failed to send WhatsApp invoice:', error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Generate HTML invoice for web view
 */
export const generateHTMLInvoice = (orderDetails, restaurantInfo) => {
  const itemsHTML = orderDetails.items
    .map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `)
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${orderDetails.orderNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .invoice-header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
        .restaurant-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .invoice-details { display: flex; justify-content: space-between; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background-color: #f5f5f5; padding: 10px; text-align: left; }
        .totals { text-align: right; }
        .total-row { font-size: 18px; font-weight: bold; padding-top: 10px; border-top: 2px solid #333; }
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      <div class="invoice-header">
        <div class="restaurant-name">${restaurantInfo.name}</div>
        <div>${restaurantInfo.address}</div>
        ${restaurantInfo.gstNumber ? `<div><strong>GSTIN:</strong> ${restaurantInfo.gstNumber}</div>` : ''}
        <div>Phone: ${restaurantInfo.phone}</div>
      </div>

      <div class="invoice-details">
        <div>
          <strong>Invoice No:</strong> ${orderDetails.orderNumber}<br>
          <strong>Table:</strong> ${orderDetails.tableNumber}<br>
          <strong>Date:</strong> ${new Date(orderDetails.createdAt).toLocaleString('en-IN')}
        </div>
        <div style="text-align: right;">
          <strong>Payment:</strong> ${orderDetails.paymentMethod.toUpperCase()}<br>
          <strong>Status:</strong> ${orderDetails.paymentStatus === 'paid' ? 'PAID' : 'PENDING'}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Rate</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div class="totals">
        <div>Subtotal: ₹${orderDetails.subtotal.toFixed(2)}</div>
        ${orderDetails.discount > 0 ? `<div style="color: green;">Discount: -₹${orderDetails.discount.toFixed(2)}</div>` : ''}
        <div>CGST (4.5%): ₹${(orderDetails.tax / 2).toFixed(2)}</div>
        <div>SGST (4.5%): ₹${(orderDetails.tax / 2).toFixed(2)}</div>
        <div class="total-row">Total: ₹${orderDetails.total.toFixed(2)}</div>
      </div>

      <div style="text-align: center; margin-top: 40px; color: #666;">
        <p>Thank you for your order!</p>
        <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">Print Invoice</button>
      </div>
    </body>
    </html>
  `;
};

export default {
  sendInvoiceViaWhatsApp,
  generateHTMLInvoice,
  generateInvoiceMessage,
};
