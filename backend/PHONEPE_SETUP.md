# PhonePe Payment Gateway - Multi-Restaurant Setup Guide

## Overview
This integration uses PhonePe's Payment Gateway API with Split Payment feature to enable multiple restaurants to receive payments through a single integration.

## Prerequisites
1. PhonePe Merchant Account (Register at: https://www.phonepe.com/business-solutions/)
2. Each restaurant needs a PhonePe Business Account with UPI ID or Bank Account
3. KYC verification completed for all merchants
4. Merchant IDs for each restaurant

## API Credentials Setup

### 1. Primary Merchant (Platform)
- Merchant ID: `MERCHANTUAT` (UAT) / Your Production Merchant ID
- Salt Key: Provided by PhonePe
- Salt Index: Provided by PhonePe
- API Environment: UAT (https://api-preprod.phonepe.com/apis/pg-sandbox) or Production

### 2. Restaurant Sub-Merchants
Each restaurant must:
- Complete PhonePe Business KYC
- Get their Merchant ID
- Provide UPI ID or Bank Account for settlements

## Environment Variables (.env)

```env
# PhonePe Configuration
PHONEPE_MERCHANT_ID=MERCHANTUAT
PHONEPE_SALT_KEY=your_salt_key_here
PHONEPE_SALT_INDEX=1
PHONEPE_API_URL=https://api-preprod.phonepe.com/apis/pg-sandbox
PHONEPE_REDIRECT_URL=http://localhost:8080/payment/callback
PHONEPE_CALLBACK_URL=http://localhost:3000/api/payment/phonepe/callback

# Mode: UAT or PRODUCTION
PHONEPE_MODE=UAT
```

## Integration Architecture

### Flow:
1. Customer places order at Restaurant A
2. Platform initiates payment with Restaurant A's merchant details
3. PhonePe processes payment
4. Split payment: Platform fee (if any) + Restaurant settlement
5. Webhook confirms payment status
6. Order status updated

## Installation

```bash
npm install crypto axios
```

## Features Implemented

✅ Multi-merchant support (each restaurant receives direct payment)
✅ Secure payment link generation with SHA256 hash
✅ Payment status verification
✅ Webhook callback handling
✅ Refund support
✅ Transaction tracking per restaurant
✅ UAT (sandbox) and Production modes
✅ QR code payment support
✅ UPI intent for mobile apps

## Testing

### UAT Test Cards:
- Card Number: 4111 1111 1111 1111
- CVV: Any 3 digits
- Expiry: Any future date
- OTP: 123456

### UAT Test UPI:
- UPI ID: success@ybl (Success)
- UPI ID: failure@ybl (Failure)

### Test Flow:
1. Start backend: `npm start`
2. Place test order
3. Complete payment in PhonePe UAT
4. Verify webhook callback
5. Check order status update

## Production Checklist

- [ ] Replace UAT credentials with Production
- [ ] Update PHONEPE_API_URL to production
- [ ] Configure production webhook URL (must be HTTPS)
- [ ] Add all restaurant merchant IDs
- [ ] Test with real UPI/Card
- [ ] Setup SSL certificate for callback URL
- [ ] Enable webhook signature verification
- [ ] Setup payment monitoring and alerts
- [ ] Configure refund policies

## Security Notes

⚠️ **IMPORTANT:**
- Never commit Salt Key to Git
- Always use environment variables
- Verify webhook signatures
- Use HTTPS in production
- Implement rate limiting
- Log all transactions securely
- Validate all payment amounts server-side

## Support

PhonePe Merchant Support:
- Email: merchantsupport@phonepe.com
- Phone: 080-68727374
- Developer Docs: https://developer.phonepe.com/

## Common Issues

### Issue: Payment fails immediately
Solution: Check Merchant ID and Salt Key are correct

### Issue: Webhook not received
Solution: Ensure callback URL is publicly accessible (use ngrok for local testing)

### Issue: Hash mismatch error
Solution: Verify Salt Key and ensure proper base64 encoding

### Issue: Sub-merchant payment fails
Solution: Verify sub-merchant KYC is completed and merchant ID is active
