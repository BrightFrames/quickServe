# QR Code Implementation Guide

## Overview
The QuickServe app now supports automatic table detection via URL patterns, making QR code integration seamless.

## URL Pattern

### Direct Table Access
```
http://localhost:5173/customer/menu/table/4
http://localhost:5173/customer/menu/table/12
```

### Query Parameter (Alternative)
```
http://localhost:5173/customer/menu?table=4
```

## How It Works

1. **Customer scans QR code** with table number encoded in URL
2. **App automatically extracts** table number from URL path (`/table/:tableNumber`)
3. **Table number is stored** in CartContext and localStorage
4. **Orders are linked** to the table automatically
5. **Table badge appears** in menu header showing current table

## Implementation Details

### URL Priority (from highest to lowest)
1. URL path parameter: `/customer/menu/table/4`
2. Query parameter: `?table=4`
3. localStorage (previous session)

### Technical Flow
```
QR Code URL → MenuPage → useParams() → setTableNumber() → CartContext → CheckoutPage → Order
```

### Benefits
- ✅ No manual table selection needed
- ✅ Prevents wrong table assignment
- ✅ Works with any QR code generator
- ✅ Table number persists across navigation
- ✅ Visible confirmation in UI

## Generating QR Codes

### For Physical Tables
Generate QR codes with these URLs:
```
Table 1: http://your-domain.com/customer/menu/table/1
Table 2: http://your-domain.com/customer/menu/table/2
Table 3: http://your-domain.com/customer/menu/table/3
...
```

### Recommended QR Code Generators
- **Online**: qr-code-generator.com, qrcode-monkey.com
- **CLI**: `qrencode -o table1.png "http://localhost:5173/customer/menu/table/1"`
- **Node.js**: Use `qrcode` npm package (already in backend)

### Example: Generate All Table QR Codes (Node.js)
```javascript
const QRCode = require('qrcode');
const fs = require('fs');

const BASE_URL = 'http://your-domain.com/customer/menu/table';
const NUM_TABLES = 20;

for (let i = 1; i <= NUM_TABLES; i++) {
  const url = `${BASE_URL}/${i}`;
  QRCode.toFile(`./qr-codes/table-${i}.png`, url, {
    width: 300,
    margin: 2,
  });
}
```

## Testing

### Local Development
1. Start customer app: `cd customer && npm run dev`
2. Visit: `http://localhost:5173/customer/menu/table/4`
3. Verify table badge shows "Table 4"
4. Add items to cart and proceed to checkout
5. Confirm table number is included in order

### Production
1. Replace `localhost:5173` with your production domain
2. Generate QR codes with production URLs
3. Print and place QR codes on tables

## Database Integration

The table number is automatically included in orders:
```javascript
{
  items: [...],
  tableNumber: "4",  // Extracted from URL
  total: 450.50,
  // ... other order fields
}
```

## Admin Features (Future Enhancement)

Potential features to add:
- View orders by table number
- Table status (occupied/free)
- Call waiter from table
- Table turnover analytics
- QR code regeneration tool in admin panel

## Troubleshooting

### Table number not showing?
- Check URL format: `/customer/menu/table/4`
- Clear localStorage: `localStorage.clear()`
- Check browser console for errors

### QR code not scanning?
- Ensure QR code has sufficient contrast
- Test with multiple QR readers
- Verify URL is accessible

### Orders missing table number?
- Verify CartContext is providing tableNumber
- Check CheckoutPage is using `const { tableNumber } = useCart()`
- Inspect order payload in Network tab

## Security Considerations

- ✅ Table numbers are validated (string type)
- ✅ No sensitive data in QR code
- ⚠️ Consider rate limiting for order placement
- ⚠️ Validate table numbers against database

## Next Steps

1. ✅ URL routing implemented
2. ✅ Table number extraction working
3. ✅ CartContext integration complete
4. 🔲 Generate QR codes for all tables
5. 🔲 Print and laminate QR codes
6. 🔲 Place QR codes on tables
7. 🔲 Test end-to-end flow
8. 🔲 Add admin table management
