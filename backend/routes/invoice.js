import express from 'express';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import { sendInvoiceViaWhatsApp, generateHTMLInvoice } from '../services/invoiceService.js';

const router = express.Router();

// Send invoice via WhatsApp
router.post('/send-whatsapp/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.customerPhone) {
      return res.status(400).json({ message: 'Customer phone number not available' });
    }

    const orderDetails = {
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      items: order.items,
      subtotal: parseFloat(order.totalAmount) / 1.09, // Reverse calculate
      tax: parseFloat(order.totalAmount) * 0.09,
      discount: 0,
      total: parseFloat(order.totalAmount),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
    };

    const result = await sendInvoiceViaWhatsApp(
      order.customerPhone,
      orderDetails,
      order.restaurantId
    );

    if (result.success) {
      res.json({ message: 'Invoice sent successfully via WhatsApp' });
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    console.error('[INVOICE] Error sending WhatsApp invoice:', error);
    res.status(500).json({ message: 'Failed to send invoice' });
  }
});

// Get HTML invoice
router.get('/view/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).send('<h1>Invoice not found</h1>');
    }

    const restaurant = await Restaurant.findByPk(order.restaurantId);
    if (!restaurant) {
      return res.status(404).send('<h1>Restaurant not found</h1>');
    }

    const orderDetails = {
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      items: order.items,
      subtotal: parseFloat(order.totalAmount) / 1.09,
      tax: parseFloat(order.totalAmount) * 0.09,
      discount: 0,
      total: parseFloat(order.totalAmount),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
    };

    const restaurantInfo = {
      name: restaurant.name,
      address: restaurant.address,
      phone: restaurant.phone,
      gstNumber: restaurant.gstNumber,
    };

    const html = generateHTMLInvoice(orderDetails, restaurantInfo);
    res.send(html);
  } catch (error) {
    console.error('[INVOICE] Error generating invoice:', error);
    res.status(500).send('<h1>Error generating invoice</h1>');
  }
});

export default router;
