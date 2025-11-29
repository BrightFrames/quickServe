# Cashfree Payment Integration - Migration Complete

## Overview
Successfully migrated from PhonePe to **Cashfree Payments** with marketplace split settlements and 1% platform commission.

---

## ✅ Changes Made

### 1. **New Files Created**
- ✅ `/backend/utils/cashfree.js` - Cashfree SDK utility with marketplace methods
- ✅ `/backend/controllers/paymentController.js` - Payment logic with split settlements
- ✅ `/backend/routes/paymentRoutes.js` - Clean Cashfree API endpoints

### 2. **Files Modified**
- ✅ `/backend/models/Restaurant.js` - Added `cashfreeVendorId` field
- ✅ `/backend/server.js` - Replaced PhonePe routes with Cashfree routes

### 3. **Files Removed**
- ✅ `/backend/services/phonePeService.js` - DELETED
- ✅ PhonePe route registrations - REMOVED from server.js

---

## 📋 Environment Variables Required

Add these to your `.env` file:

```env
# Cashfree Credentials
CASHFREE_CLIENT_ID=your_client_id_here
CASHFREE_CLIENT_SECRET=your_client_secret_here
CASHFREE_ENVIRONMENT=sandbox  # or 'production'

# Cashfree Webhook URLs (update with your actual URLs)
CASHFREE_RETURN_URL=https://your-frontend.com/payment/callback
CASHFREE_WEBHOOK_URL=https://your-backend.com/api/payment/cashfree/webhook

# Frontend/Backend URLs (if not already set)
FRONTEND_URL=http://localhost:8080
BACKEND_URL=http://localhost:3000
```

---

## 🚀 API Endpoints

### **Vendor Management**

#### Create Vendor Account
```http
POST /api/payment/cashfree/vendor/create
Content-Type: application/json

{
  "restaurantId": 1
}
```

Response:
```json
{
  "success": true,
  "vendorId": "VENDOR_1",
  "message": "Vendor account created successfully"
}
```

#### Get Vendor Settlements
```http
GET /api/payment/cashfree/vendor/:restaurantId/settlements?limit=10
```

Response:
```json
{
  "success": true,
  "vendorId": "VENDOR_1",
  "settlements": [...]
}
```

---

### **Payment Operations**

#### Initiate Payment
```http
POST /api/payment/cashfree/initiate
Content-Type: application/json

{
  "orderId": 123,
  "amount": 500,
  "restaurantId": 1,
  "customerPhone": "9876543210",
  "customerName": "John Doe",
  "customerEmail": "john@example.com"
}
```

Response:
```json
{
  "success": true,
  "orderId": "CF_ORD_123_1234567890",
  "sessionId": "session_abc123",
  "paymentLink": "https://payments.cashfree.com/...",
  "amount": 500,
  "platformCommission": 5,
  "vendorAmount": 495,
  "message": "Payment initiated successfully"
}
```

#### Check Payment Status
```http
GET /api/payment/cashfree/status/CF_ORD_123_1234567890
```

Response:
```json
{
  "success": true,
  "status": "PAID",
  "orderId": "CF_ORD_123_1234567890",
  "amount": 500,
  "paymentMethod": "UPI",
  "transactionId": "12345"
}
```

#### Initiate Refund
```http
POST /api/payment/cashfree/refund
Content-Type: application/json

{
  "orderId": 123,
  "amount": 500,
  "reason": "Customer request"
}
```

Response:
```json
{
  "success": true,
  "refundId": "REFUND_123_1234567890",
  "status": "PENDING",
  "message": "Refund initiated successfully"
}
```

---

### **Webhooks**

#### Webhook Endpoint
```http
POST /api/payment/cashfree/webhook
x-webhook-signature: <signature>
Content-Type: application/json

{
  "type": "PAYMENT_SUCCESS_WEBHOOK",
  "data": {
    "order": {
      "order_id": "CF_ORD_123_1234567890",
      "payment_amount": 500,
      "cf_payment_id": "12345",
      "payment_method": "UPI"
    }
  }
}
```

**Webhook Events Handled:**
- ✅ `PAYMENT_SUCCESS_WEBHOOK` - Payment completed
- ✅ `PAYMENT_FAILED_WEBHOOK` - Payment failed
- ✅ `SETTLEMENT_PROCESSED` - Settlement completed
- ✅ `VENDOR_PAYOUT_UPDATE` - Payout status update

**⚠️ Important:** Configure this webhook URL in your Cashfree dashboard:
```
https://your-backend.com/api/payment/cashfree/webhook
```

---

## 💰 Settlement Flow

### **How It Works**

1. **Customer makes payment:** ₹500
2. **Automatic split:**
   - Platform (QuickServe): ₹5 (1%)
   - Vendor (Restaurant): ₹495 (99%)

3. **Settlement timing:**
   - **Normal (T+1):** Money transferred to vendor's bank next day
   - **Instant:** Money transferred immediately (if enabled in Cashfree dashboard)

4. **No manual intervention needed** - Cashfree handles everything automatically!

### **Settlement Schedule Options**

Configured during vendor account creation:
- `schedule_option: 1` → T+1 settlement (next day)
- `schedule_option: 2` → Instant settlement (if enabled for merchant)

---

## 🔧 Database Migration

Run this SQL to add the vendor ID field:

```sql
ALTER TABLE "Restaurants" 
ADD COLUMN "cashfreeVendorId" VARCHAR(255) DEFAULT NULL
COMMENT 'Cashfree marketplace vendor ID for split settlements';
```

Or use Sequelize migration:
```javascript
await queryInterface.addColumn('Restaurants', 'cashfreeVendorId', {
  type: Sequelize.STRING,
  allowNull: true,
  defaultValue: null,
  comment: 'Cashfree marketplace vendor ID for split settlements'
});
```

---

## 📝 Integration Steps

### **1. Setup Cashfree Account**
- Sign up at https://www.cashfree.com/
- Get API credentials (Client ID & Secret)
- Enable Easy Split/Marketplace feature

### **2. Configure Environment**
- Add Cashfree credentials to `.env`
- Set webhook URL in Cashfree dashboard

### **3. Create Vendor Accounts**
For each restaurant, call:
```javascript
POST /api/payment/cashfree/vendor/create
{ "restaurantId": 1 }
```

### **4. Update Frontend**
Replace PhonePe payment flow with:
```javascript
// Initiate payment
const response = await fetch('/api/payment/cashfree/initiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: 123,
    amount: 500,
    restaurantId: 1,
    customerPhone: '9876543210',
    customerName: 'Customer'
  })
});

const { paymentLink, sessionId } = await response.json();

// Redirect to payment page
window.location.href = paymentLink;
```

### **5. Handle Callback**
Listen for payment completion and poll status:
```javascript
// On payment callback page
const cashfreeOrderId = new URLSearchParams(window.location.search).get('order_id');

// Check status
const status = await fetch(`/api/payment/cashfree/status/${cashfreeOrderId}`);
const { status: paymentStatus } = await status.json();

if (paymentStatus === 'PAID') {
  // Show success
} else {
  // Show failure
}
```

---

## 🧪 Testing

### **Sandbox Testing**
1. Set `CASHFREE_ENVIRONMENT=sandbox`
2. Use Cashfree test credentials
3. Test UPI payments with sandbox UPI IDs

### **Test Flow**
```bash
# 1. Create vendor
curl -X POST http://localhost:3000/api/payment/cashfree/vendor/create \
  -H "Content-Type: application/json" \
  -d '{"restaurantId": 1}'

# 2. Initiate payment
curl -X POST http://localhost:3000/api/payment/cashfree/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 123,
    "amount": 500,
    "restaurantId": 1,
    "customerPhone": "9876543210",
    "customerName": "Test User"
  }'

# 3. Check status
curl http://localhost:3000/api/payment/cashfree/status/CF_ORD_123_1234567890
```

---

## 🔒 Security Features

- ✅ **Webhook signature verification** - Prevents fake webhooks
- ✅ **HTTPS only** in production - Secure data transmission
- ✅ **Split settlement** - Platform commission auto-deducted
- ✅ **Automatic settlements** - No manual transfers needed
- ✅ **Refund support** - Easy refund processing

---

## 📊 Platform Commission

**Current Rate:** 1%

Example:
- Order amount: ₹1000
- Platform commission: ₹10 (1%)
- Restaurant receives: ₹990

To change commission rate, edit `/backend/utils/cashfree.js`:
```javascript
this.platformCommissionRate = 0.01; // Change to desired percentage
```

---

## ⚠️ Important Notes

1. **Vendor accounts** must be created for each restaurant before they can receive payments
2. **Bank details** can be added later via Cashfree dashboard
3. **KYC verification** may be required in production for instant settlements
4. **Webhook URL** must be publicly accessible (use ngrok for local testing)
5. **Settlement timing** depends on Cashfree's schedule and your merchant settings

---

## 🐛 Troubleshooting

### Vendor creation fails
- Check Cashfree credentials
- Ensure marketplace feature is enabled
- Verify phone/email format

### Payment fails
- Check vendor ID exists in Restaurant table
- Verify amount is > 0
- Check customer phone format (10 digits)

### Webhook not received
- Verify webhook URL in Cashfree dashboard
- Check server logs for webhook calls
- Use ngrok to test webhooks locally

### Settlement not received
- Check vendor's schedule_option setting
- Verify bank account details in Cashfree dashboard
- Contact Cashfree support for settlement status

---

## 📚 Resources

- **Cashfree Docs:** https://docs.cashfree.com/
- **Easy Split Guide:** https://docs.cashfree.com/docs/easy-split
- **API Reference:** https://docs.cashfree.com/reference/pg-new-apis-endpoint

---

## ✨ Migration Complete!

All PhonePe code has been removed and replaced with Cashfree marketplace payments.
The system now supports:
- ✅ Automatic split settlements
- ✅ 1% platform commission
- ✅ T+1 or instant settlement
- ✅ UPI payments
- ✅ Refunds
- ✅ Settlement tracking

**No existing functionality has been broken!**
