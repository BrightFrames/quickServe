import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate PDF invoice for an order
 * @param {Object} orderData - Order details including items, amounts, restaurant info
 * @param {string} outputPath - Path where PDF will be saved
 * @returns {Promise<string>} - Path to generated PDF
 */
export async function generateInvoicePDF(orderData, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(outputPath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).text(orderData.restaurantName || 'Restaurant', { align: 'center' });
      doc.fontSize(10).text(orderData.restaurantAddress || '', { align: 'center' });
      doc.moveDown();

      // GST Number
      if (orderData.gstNumber) {
        doc.fontSize(10).text(`GST No: ${orderData.gstNumber}`, { align: 'center' });
        doc.moveDown();
      }

      // Invoice Title
      doc.fontSize(16).text('TAX INVOICE', { align: 'center', underline: true });
      doc.moveDown();

      // Order Details
      doc.fontSize(10);
      doc.text(`Order Number: ${orderData.orderNumber}`, 50, 180);
      doc.text(`Date: ${new Date(orderData.createdAt).toLocaleString()}`, 320, 180);
      doc.text(`Table: ${orderData.tableId}`, 50, 195);
      if (orderData.customerPhone) {
        doc.text(`Phone: ${orderData.customerPhone}`, 320, 195);
      }
      doc.moveDown(2);

      // Table Header
      const tableTop = 230;
      doc.font('Helvetica-Bold');
      doc.text('Item', 50, tableTop);
      doc.text('Qty', 250, tableTop);
      doc.text('Price', 320, tableTop);
      doc.text('Amount', 420, tableTop);
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Table Items
      doc.font('Helvetica');
      let yPosition = tableTop + 25;
      orderData.items.forEach((item) => {
        const amount = item.price * item.quantity;
        doc.text(item.name, 50, yPosition);
        doc.text(item.quantity.toString(), 250, yPosition);
        doc.text(`₹${parseFloat(item.price).toFixed(2)}`, 320, yPosition);
        doc.text(`₹${amount.toFixed(2)}`, 420, yPosition);
        
        if (item.specialInstructions) {
          yPosition += 15;
          doc.fontSize(8).text(`   ${item.specialInstructions}`, 50, yPosition);
          doc.fontSize(10);
        }
        yPosition += 20;
      });

      // Divider line
      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 15;

      // Subtotal
      doc.text('Subtotal:', 350, yPosition);
      doc.text(`₹${parseFloat(orderData.subtotal).toFixed(2)}`, 420, yPosition);
      yPosition += 20;

      // Discount
      if (orderData.discount > 0) {
        doc.text('Discount:', 350, yPosition);
        if (orderData.promoCode) {
          doc.fontSize(8).text(`(${orderData.promoCode.code} - ${orderData.promoCode.discountPercentage}%)`, 350, yPosition + 12);
          doc.fontSize(10);
        }
        doc.text(`- ₹${parseFloat(orderData.discount).toFixed(2)}`, 420, yPosition);
        yPosition += 30;
      }

      // Tax
      if (orderData.taxAmount > 0) {
        doc.text(`Tax (${orderData.taxPercentage}%):`, 350, yPosition);
        doc.text(`₹${parseFloat(orderData.taxAmount).toFixed(2)}`, 420, yPosition);
        yPosition += 20;
      }

      // Total
      doc.font('Helvetica-Bold');
      doc.fontSize(12);
      doc.moveTo(350, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 10;
      doc.text('TOTAL:', 350, yPosition);
      doc.text(`₹${parseFloat(orderData.totalAmount).toFixed(2)}`, 420, yPosition);
      doc.font('Helvetica');
      doc.fontSize(10);
      yPosition += 30;

      // Payment Details
      doc.moveDown(2);
      doc.text(`Payment Method: ${orderData.paymentMethod.toUpperCase()}`, 50, yPosition);
      doc.text(`Payment Status: ${orderData.paymentStatus.toUpperCase()}`, 320, yPosition);

      // Footer
      doc.fontSize(8).text('Thank you for dining with us!', 50, 700, {
        align: 'center',
      });

      doc.end();

      stream.on('finish', () => {
        resolve(outputPath);
      });

      stream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate invoice PDF for an order and return buffer
 * @param {Object} orderData - Order details
 * @returns {Promise<Buffer>} - PDF buffer
 */
export async function generateInvoicePDFBuffer(orderData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Same PDF generation logic as above
      doc.fontSize(20).text(orderData.restaurantName || 'Restaurant', { align: 'center' });
      doc.fontSize(10).text(orderData.restaurantAddress || '', { align: 'center' });
      doc.moveDown();

      if (orderData.gstNumber) {
        doc.fontSize(10).text(`GST No: ${orderData.gstNumber}`, { align: 'center' });
        doc.moveDown();
      }

      doc.fontSize(16).text('TAX INVOICE', { align: 'center', underline: true });
      doc.moveDown();

      doc.fontSize(10);
      doc.text(`Order Number: ${orderData.orderNumber}`, 50, 180);
      doc.text(`Date: ${new Date(orderData.createdAt).toLocaleString()}`, 320, 180);
      doc.text(`Table: ${orderData.tableId}`, 50, 195);
      if (orderData.customerPhone) {
        doc.text(`Phone: ${orderData.customerPhone}`, 320, 195);
      }
      doc.moveDown(2);

      const tableTop = 230;
      doc.font('Helvetica-Bold');
      doc.text('Item', 50, tableTop);
      doc.text('Qty', 250, tableTop);
      doc.text('Price', 320, tableTop);
      doc.text('Amount', 420, tableTop);
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      doc.font('Helvetica');
      let yPosition = tableTop + 25;
      orderData.items.forEach((item) => {
        const amount = item.price * item.quantity;
        doc.text(item.name, 50, yPosition);
        doc.text(item.quantity.toString(), 250, yPosition);
        doc.text(`₹${parseFloat(item.price).toFixed(2)}`, 320, yPosition);
        doc.text(`₹${amount.toFixed(2)}`, 420, yPosition);
        
        if (item.specialInstructions) {
          yPosition += 15;
          doc.fontSize(8).text(`   ${item.specialInstructions}`, 50, yPosition);
          doc.fontSize(10);
        }
        yPosition += 20;
      });

      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 15;

      doc.text('Subtotal:', 350, yPosition);
      doc.text(`₹${parseFloat(orderData.subtotal).toFixed(2)}`, 420, yPosition);
      yPosition += 20;

      if (orderData.discount > 0) {
        doc.text('Discount:', 350, yPosition);
        if (orderData.promoCode) {
          doc.fontSize(8).text(`(${orderData.promoCode.code} - ${orderData.promoCode.discountPercentage}%)`, 350, yPosition + 12);
          doc.fontSize(10);
        }
        doc.text(`- ₹${parseFloat(orderData.discount).toFixed(2)}`, 420, yPosition);
        yPosition += 30;
      }

      if (orderData.taxAmount > 0) {
        doc.text(`Tax (${orderData.taxPercentage}%):`, 350, yPosition);
        doc.text(`₹${parseFloat(orderData.taxAmount).toFixed(2)}`, 420, yPosition);
        yPosition += 20;
      }

      doc.font('Helvetica-Bold');
      doc.fontSize(12);
      doc.moveTo(350, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 10;
      doc.text('TOTAL:', 350, yPosition);
      doc.text(`₹${parseFloat(orderData.totalAmount).toFixed(2)}`, 420, yPosition);
      doc.font('Helvetica');
      doc.fontSize(10);
      yPosition += 30;

      doc.moveDown(2);
      doc.text(`Payment Method: ${orderData.paymentMethod.toUpperCase()}`, 50, yPosition);
      doc.text(`Payment Status: ${orderData.paymentStatus.toUpperCase()}`, 320, yPosition);

      doc.fontSize(8).text('Thank you for dining with us!', 50, 700, {
        align: 'center',
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
