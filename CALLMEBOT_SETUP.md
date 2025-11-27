# CallMeBot WhatsApp API Setup Guide

This guide explains how to set up CallMeBot for sending WhatsApp invoices to customers.

## What is CallMeBot?

CallMeBot is a **completely FREE** WhatsApp API service that requires no registration. It's perfect for sending automated messages like invoices, notifications, and alerts.

## Setup Instructions (One-Time Setup)

### Step 1: Get Your API Key

1. **Open WhatsApp** on your phone
2. **Add this phone number** to your contacts: `+34 644 51 89 45`
3. **Send this exact message** to that number:
   ```
   I allow callmebot to send me messages
   ```
4. **You will receive an API key** in the reply (looks like: `123456`)
5. **Save this API key** - you'll need it for configuration

### Step 2: Configure Your Environment

1. Open your `.env` file in the backend folder
2. Find the `CALLMEBOT_API_KEY` line
3. Replace `your_api_key_here` with your actual API key:
   ```env
   CALLMEBOT_API_KEY=123456
   ```

### Step 3: Restart Your Server

```bash
cd backend
npm start
```

## How It Works

### Automatic Invoice Sending

When a customer places an order and provides their phone number:

1. ✅ Order is created in the system
2. ✅ Invoice is automatically generated with:
   - Restaurant name, address, and GST number
   - Itemized list of ordered items
   - CGST (9%) and SGST (9%) breakdown
   - Total amount
3. ✅ Invoice is sent to customer's WhatsApp number

### Invoice Format

```
📄 INVOICE - RestaurantName

Order #: ORD00001
Date: 25 Dec 2024, 02:30 PM
Table: 5

━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Restaurant Address
123 Main Street, City - 400001

GST No: 22AAAAA0000A1Z5

━━━━━━━━━━━━━━━━━━━━━━━━━━

ITEMS:
1. Pizza Margherita
   ₹299.00 × 2 = ₹598.00

2. Coke
   ₹50.00 × 1 = ₹50.00

━━━━━━━━━━━━━━━━━━━━━━━━━━

Subtotal:        ₹648.00
CGST (9%):       ₹58.32
SGST (9%):       ₹58.32
━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:           ₹764.64

Thank you for your order! 🙏
```

## Managing GST Number

Restaurant owners can add their GST number through the **Restaurant Profile** section:

### For Restaurant Owners (Landing Page Login):

1. Log in to your restaurant account
2. Go to **Restaurant Profile**
3. Enter your 15-digit GST number (format: `22AAAAA0000A1Z5`)
4. Click **Save Profile**

### For Admin Users:

1. Log in to the admin panel
2. Go to **Restaurant Info** tab
3. View current GST number status
4. Contact restaurant owner to update if needed

## Testing Invoice Delivery

### Test Without Setting Up CallMeBot:

You can still test order placement. Invoices won't be sent, but the system will log:
```
[INVOICE] Failed to send invoice: No API key configured
```

### Test With CallMeBot Setup:

1. Complete the CallMeBot setup above
2. Place a test order with your WhatsApp number
3. Check your WhatsApp for the invoice message

### View Invoice in Browser:

Visit: `http://localhost:3000/api/invoice/view/:orderId`

Replace `:orderId` with your actual order ID to see the HTML invoice.

## Troubleshooting

### "Invalid API Key" Error

- ✅ Check you sent the exact message: `I allow callmebot to send me messages`
- ✅ Make sure you're using the correct phone number format (with country code)
- ✅ Verify your API key in `.env` is correct
- ✅ Restart your backend server after changing `.env`

### "Failed to send message" Error

- ✅ Check customer phone number has country code (e.g., `+919876543210`)
- ✅ Verify CallMeBot service is online (check their status)
- ✅ Make sure message isn't too long (max ~1000 characters)

### Invoice Not Showing Restaurant Details

- ✅ Restaurant owner needs to add phone, address, GST in Profile
- ✅ Check database has restaurant information saved
- ✅ Verify restaurantId is correctly associated with orders

### Phone Number Format

CallMeBot requires international format:
- ✅ Correct: `+919876543210` (India)
- ❌ Wrong: `9876543210` (missing country code)
- ❌ Wrong: `+91 98765 43210` (spaces not allowed)

The system automatically converts `10-digit` → `+91 + 10-digit` for Indian numbers.

## API Endpoints

### Send Invoice via WhatsApp
```
POST /api/invoice/send-whatsapp/:orderId
```

### View Invoice in Browser
```
GET /api/invoice/view/:orderId
```

## Cost & Limits

- **Cost**: 100% FREE forever
- **Limits**: None (reasonable use expected)
- **Registration**: Not required
- **Messages**: Unlimited
- **Reliability**: High (99%+ uptime)

## Privacy & Security

- CallMeBot doesn't store messages
- No customer data is shared
- Messages are sent directly via WhatsApp API
- API key is stored securely in `.env` file

## Alternative Solutions

If you need more features, consider:

1. **Twilio** - Paid, very reliable, $0.005 per message
2. **MSG91** - Indian provider, $0.002 per message
3. **WhatsApp Business API** - Official, requires Meta approval
4. **Email** - Free alternative, less immediate

For most restaurants, CallMeBot is perfect! 🎉

## Need Help?

1. Check server logs for detailed error messages
2. Verify `.env` configuration
3. Test with your own WhatsApp number first
4. Check CallMeBot status at their website

---

**Last Updated**: December 2024
**QuickServe Version**: 1.0.0
