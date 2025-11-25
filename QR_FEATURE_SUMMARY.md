# QuickServe - QR Code Table Ordering Feature ✅

## What Was Updated

### 1. **Customer App Routing** (`customer/src/customer/CustomerApp.tsx`)
- ✅ Added new route: `/customer/menu/table/:tableNumber`
- Now supports URLs like: `http://localhost:5173/customer/menu/table/4`

### 2. **Cart Context** (`customer/src/customer/context/CartContext.tsx`)
- ✅ Added `tableNumber` state to global context
- ✅ Added `setTableNumber()` method
- ✅ Automatically persists table number to localStorage
- ✅ Includes table number in order details

### 3. **Menu Page** (`customer/src/customer/pages/MenuPage.tsx`)
- ✅ Extracts table number from URL path (`useParams()`)
- ✅ Falls back to query parameter (`?table=4`)
- ✅ Displays table badge in header
- ✅ Table number is shared across the app via CartContext

### 4. **Checkout Page** (`customer/src/customer/pages/CheckoutPage.tsx`)
- ✅ Uses table number from CartContext (no more localStorage.getItem)
- ✅ Automatically includes table number in orders

### 5. **QR Code Generator** (`backend/generateQRCodes.js`)
- ✅ New script to generate QR codes for all tables
- ✅ Creates PNG images for each table
- ✅ Generates HTML preview page
- ✅ Configurable via environment variables

### 6. **Package Scripts** (`backend/package.json`)
- ✅ Added `npm run generate-qr` command
- ✅ Added `npm run create-db` command

## How It Works

```
┌─────────────┐
│  QR Code    │  Contains: http://localhost:5173/customer/menu/table/4
│  on Table 4 │
└──────┬──────┘
       │ Customer scans
       ↓
┌─────────────┐
│  Menu Page  │  Extracts "4" from URL → setTableNumber("4")
└──────┬──────┘
       │ Table number saved to CartContext + localStorage
       ↓
┌─────────────┐
│  Add Items  │  Table badge shows "Table 4"
│  to Cart    │
└──────┬──────┘
       │ Customer proceeds to checkout
       ↓
┌─────────────┐
│  Checkout   │  Uses tableNumber from CartContext
└──────┬──────┘
       │ Place order
       ↓
┌─────────────┐
│  Backend    │  Order saved with tableNumber: "4"
│  Database   │
└─────────────┘
```

## Usage Instructions

### For Developers

#### 1. Generate QR Codes
```bash
cd backend
npm run generate-qr
```

This creates:
- `qr-codes/table-1.png` through `table-20.png`
- `qr-codes/preview.html` (view all QR codes in browser)

#### 2. Customize Settings
```bash
# .env or command line
CUSTOMER_APP_URL=http://your-domain.com/customer/menu/table npm run generate-qr
NUM_TABLES=50 npm run generate-qr
```

#### 3. Test Locally
```bash
# Start customer app
cd customer
npm run dev

# Visit in browser
http://localhost:5173/customer/menu/table/4
```

### For Restaurant Staff

#### 1. Print QR Codes
- Open `backend/qr-codes/preview.html` in browser
- Click "Print All QR Codes" button
- Print on cardstock or photo paper

#### 2. Laminate
- Laminate QR codes for durability
- Protects against spills and damage

#### 3. Place on Tables
- Attach QR codes to tables (stands, stickers, or frames)
- Ensure they're visible and easy to scan

#### 4. Customers Scan
- Customer opens camera app
- Points at QR code
- Taps notification to open menu
- Menu automatically knows which table they're at

## Benefits

✅ **No Manual Input** - Customers don't need to enter table numbers
✅ **Error Prevention** - No wrong table assignments
✅ **Fast Ordering** - One scan and they're ready to order
✅ **Order Tracking** - Kitchen knows which table to deliver to
✅ **Simple Setup** - Works with any QR code scanner app
✅ **Persistent** - Table number remembered across pages

## URL Examples

| Table | QR Code URL |
|-------|-------------|
| Table 1 | `http://localhost:5173/customer/menu/table/1` |
| Table 5 | `http://localhost:5173/customer/menu/table/5` |
| Table 12 | `http://localhost:5173/customer/menu/table/12` |

## Testing Checklist

- [ ] Generate QR codes: `npm run generate-qr`
- [ ] Open preview.html and verify all tables appear
- [ ] Test scanning QR code with phone
- [ ] Verify "Table X" badge appears in menu
- [ ] Add items to cart
- [ ] Proceed to checkout
- [ ] Confirm order includes table number
- [ ] Check order in admin panel shows correct table

## Production Deployment

1. Update `CUSTOMER_APP_URL` in production:
   ```bash
   CUSTOMER_APP_URL=https://quickserve.com/customer/menu/table npm run generate-qr
   ```

2. Generate QR codes with production URL

3. Print and deploy to tables

4. Test end-to-end flow in production

## Technical Notes

### URL Priority
1. **URL Path** (highest): `/customer/menu/table/4`
2. **Query Param**: `?table=4`
3. **localStorage** (lowest): Previous session

### State Management
- Table number stored in **CartContext** (global state)
- Persisted to **localStorage** (survives page refresh)
- Automatically included in **order payload**

### Compatibility
- ✅ Works with iPhone Camera app
- ✅ Works with Android Camera app
- ✅ Works with third-party QR scanner apps
- ✅ No app installation required

## Future Enhancements

Potential features to add:
- [ ] Admin panel to view orders by table
- [ ] Table status (occupied/available)
- [ ] Call waiter button from table
- [ ] Table reservation system
- [ ] QR code regeneration in admin panel
- [ ] Table analytics (turnover rate, average order value)

## Troubleshooting

### QR code doesn't scan
- Ensure good lighting
- Clean QR code surface
- Try different scanner app
- Verify URL is accessible

### Table number not showing
- Check URL format is correct
- Clear browser cache: `localStorage.clear()`
- Check browser console for errors

### Wrong table number
- Verify QR code was generated correctly
- Check URL in QR code matches table number
- Test scanning fresh QR code

## Files Changed

```
✅ customer/src/customer/CustomerApp.tsx
✅ customer/src/customer/context/CartContext.tsx
✅ customer/src/customer/pages/MenuPage.tsx
✅ customer/src/customer/pages/CheckoutPage.tsx
✅ backend/generateQRCodes.js (NEW)
✅ backend/package.json
✅ QR_CODE_GUIDE.md (NEW)
✅ QR_FEATURE_SUMMARY.md (NEW - this file)
```

---

**Status**: ✅ Feature Complete and Ready for Testing!
