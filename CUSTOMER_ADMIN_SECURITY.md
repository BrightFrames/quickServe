# Customer & Admin Security Configuration

## Overview
Your application now has proper separation between customer and admin areas with multiple layers of security to prevent unauthorized access.

---

## Security Layers Implemented

### 1. Frontend Route Protection

#### **CustomerProtectedRoute Component**
Location: `frontend/src/customer/components/CustomerProtectedRoute.tsx`

**Protects Against:**
- ✅ Customers accessing `/admin/*` routes
- ✅ Customers accessing `/kitchen/*` routes  
- ✅ Menu access without valid table number
- ✅ Access without restaurant slug

**How It Works:**
```tsx
// Wraps all customer routes
<CustomerProtectedRoute>
  <Routes>
    <Route path="menu/table/:tableNumber" element={<MenuPage />} />
    {/* Other customer routes */}
  </Routes>
</CustomerProtectedRoute>
```

**Security Rules:**
1. Blocks any path containing `/admin` or `/kitchen`
2. Redirects unauthorized access back to customer menu
3. Validates restaurant slug is present
4. Ensures table number is provided for menu access
5. Logs all unauthorized access attempts

#### **Enhanced Admin ProtectedRoute**
Location: `frontend/src/admin/components/ProtectedRoute.tsx`

**Improvements:**
- ✅ Logs unauthorized access attempts
- ✅ Better role-based redirects
- ✅ Security warnings in console
- ✅ Prevents customers from accessing admin panel

---

### 2. Backend Security Middleware

#### **Customer Security Middleware**
Location: `backend/middleware/customerSecurity.js`

**Features:**

##### A. Rate Limiting (`rateLimitCustomer`)
```javascript
// Applied to order creation endpoint
router.post("/", rateLimitCustomer, ...)
```
- Limits: 100 requests per minute per IP
- Prevents DDoS attacks
- Protects against abuse

##### B. Input Sanitization (`sanitizeCustomerInput`)
```javascript
// Sanitizes customer data
router.post("/", sanitizeCustomerInput, ...)
```
- Removes script tags (XSS protection)
- Trims and limits field lengths
- Sanitizes phone numbers and emails
- Prevents SQL injection

##### C. Table Validation (`validateTableAccess`)
```javascript
// Validates table number format
if (!/^[a-zA-Z0-9\-_]+$/.test(tableNumber)) {
  return res.status(400).json({ error: 'Invalid table number' });
}
```
- Validates table number format (alphanumeric only)
- Logs table access for analytics
- Prevents malicious table IDs

---

### 3. URL Structure & Access Control

#### **Customer URLs**
```
Format: /{restaurantSlug}/customer/menu/table/{tableNumber}
Example: /restaurant-name/customer/menu/table/t1
```

**Security:**
- ✅ Restaurant slug required (validates restaurant exists)
- ✅ Table number required (validates table access)
- ✅ Cannot navigate to admin/kitchen from customer pages
- ✅ All requests scoped to specific table

#### **Admin URLs**
```
Format: /{restaurantSlug}/admin/login
        /admin/dashboard
```

**Security:**
- ✅ Requires authentication (JWT token)
- ✅ Role validation (admin vs kitchen)
- ✅ Blocked from customer sessions

#### **Kitchen URLs**
```
Format: /{restaurantSlug}/kitchen/login
        /kitchen/dashboard
```

**Security:**
- ✅ Requires authentication
- ✅ Separate from admin access
- ✅ Kitchen staff cannot access admin features

---

## QR Code Security

### How QR Codes Work

1. **QR Code Generation** (Admin Panel)
   - Admin creates table in Tables Management
   - System generates unique QR code
   - Format: `quickserve.com/{slug}/customer/menu/table/{tableId}`

2. **Customer Scans QR Code**
   - URL contains: Restaurant slug + Table number
   - Customer directed to specific table's menu
   - Cannot access other tables or admin areas

3. **Order Placement**
   - Order tied to specific table number
   - Restaurant ID validated
   - Table existence verified

### QR Code Validation Flow
```
Customer Scans QR
      ↓
Extract Restaurant Slug & Table Number
      ↓
Validate Restaurant Exists (Frontend)
      ↓
Display Menu for That Table
      ↓
Customer Places Order
      ↓
Backend Validates:
  - Restaurant ID exists
  - Table number format valid
  - Items belong to restaurant
  - Rate limit not exceeded
      ↓
Order Created & Sent to Kitchen
```

---

## Security Checklist

### ✅ **Frontend Protection**
- [x] CustomerProtectedRoute blocks admin/kitchen access
- [x] ProtectedRoute requires authentication for admin
- [x] Role-based access control (admin vs kitchen)
- [x] Table number validation in URL
- [x] Restaurant slug validation

### ✅ **Backend Protection**
- [x] Rate limiting on order creation (100/min per IP)
- [x] Input sanitization (XSS & injection prevention)
- [x] Table number format validation
- [x] Restaurant ID validation
- [x] JWT authentication for admin endpoints
- [x] Restaurant data isolation (restaurantId filtering)

### ✅ **Data Isolation**
- [x] Each restaurant's menu isolated
- [x] Orders scoped to restaurant
- [x] Tables unique per restaurant
- [x] Admin panel shows only own restaurant data

---

## Testing Security

### Test 1: Customer Cannot Access Admin
```
1. Scan QR code: /restaurant/customer/menu/table/t1
2. Try to navigate to: /restaurant/admin/dashboard
   ✅ Should redirect back to customer menu
   ✅ Should log security warning in console
```

### Test 2: Admin Cannot Access Without Auth
```
1. Clear localStorage/cookies
2. Navigate to: /admin/dashboard
   ✅ Should redirect to /login
   ✅ Should show "Authentication required"
```

### Test 3: Kitchen Staff Cannot Access Admin
```
1. Login as kitchen user
2. Try to access: /admin/dashboard
   ✅ Should redirect to /kitchen/dashboard
   ✅ Should show role mismatch warning
```

### Test 4: Rate Limiting Works
```
1. Make 101 order requests in 1 minute
   ✅ Request #101 should return 429 (Too Many Requests)
   ✅ Should show "Please slow down" message
```

### Test 5: Table Validation
```
1. Try to create order with table: "t1'; DROP TABLE--"
   ✅ Should return 400 (Invalid table format)
   ✅ Should block malicious SQL
```

### Test 6: Input Sanitization
```
1. Try to order with name: "<script>alert('XSS')</script>"
   ✅ Script tags should be removed
   ✅ Order should process safely
```

---

## Common Attack Vectors & Prevention

### 1. **Path Traversal**
**Attack:** Customer tries `/../../admin/dashboard`
**Prevention:** React Router normalizes paths, CustomerProtectedRoute blocks admin paths

### 2. **SQL Injection**
**Attack:** Table number: `t1'; DROP TABLE orders--`
**Prevention:** Input validation regex, sanitization middleware, Sequelize parameterized queries

### 3. **XSS (Cross-Site Scripting)**
**Attack:** Special instructions: `<script>steal_data()</script>`
**Prevention:** `sanitizeCustomerInput` removes script tags

### 4. **CSRF (Cross-Site Request Forgery)**
**Attack:** Malicious site submits orders
**Prevention:** CORS configured, JWT tokens required for admin, rate limiting

### 5. **DDoS (Denial of Service)**
**Attack:** Spam order creation
**Prevention:** Rate limiting (100 requests/min per IP)

### 6. **Session Hijacking**
**Attack:** Steal admin JWT token
**Prevention:** Tokens expire (30 days restaurant, 24h kitchen), HTTPS only in production

---

## Best Practices for Customers

### What Customers CAN Do:
✅ Scan QR code and view menu for their table
✅ Add items to cart
✅ Place orders for their table
✅ View order status
✅ Provide feedback

### What Customers CANNOT Do:
❌ Access admin dashboard
❌ Access kitchen dashboard  
❌ View other restaurants' menus
❌ Modify menu items or prices
❌ Access other tables' orders
❌ Bypass rate limits

---

## Production Security Recommendations

### Before Going Live:

1. **Enable HTTPS**
   - All communications encrypted
   - Prevents token interception
   - Required for production

2. **Environment Variables**
   ```env
   JWT_SECRET=strong-random-secret-here
   NODE_ENV=production
   SAVE_ORDERS=true
   ALLOWED_ORIGINS=https://yourdomain.com
   ```

3. **Rate Limiting**
   - Consider Redis for distributed rate limiting
   - Adjust limits based on traffic patterns
   - Monitor for abuse

4. **Logging & Monitoring**
   - Log all unauthorized access attempts
   - Monitor for unusual patterns
   - Set up alerts for security events

5. **Database Security**
   - Use read-only database user for customer queries
   - Enable query logging
   - Regular backups

6. **CORS Configuration**
   - Whitelist only your domains
   - Remove localhost from production
   - Test thoroughly

---

## Security Monitoring

### What Gets Logged:

**Frontend:**
```
[SECURITY] Blocked unauthorized access attempt: /admin/dashboard
[SECURITY] No restaurant slug found
[SECURITY] Menu access without table number
```

**Backend:**
```
[ORDER] Restaurant 1, Table: t1
[RATE LIMIT] IP 192.168.1.1 exceeded rate limit
[SECURITY] Invalid table number format: t1'; DROP--
[SANITIZATION] Removed script tags from input
```

### How to Monitor:
1. Check browser console for frontend warnings
2. Check server logs for backend security events
3. Monitor database for suspicious queries
4. Track failed authentication attempts

---

## Emergency Response

### If You Detect Attack:

1. **Immediate Actions:**
   - Review server logs
   - Check for unauthorized data access
   - Verify JWT tokens not compromised
   - Check rate limit effectiveness

2. **Mitigation:**
   - Block attacker's IP
   - Revoke compromised tokens
   - Rotate JWT_SECRET if needed
   - Notify affected users

3. **Investigation:**
   - Review access logs
   - Check database for tampering
   - Verify order integrity
   - Document incident

---

## Summary

Your application now has **comprehensive security** across:

✅ **Frontend:** Route protection, role validation, input validation
✅ **Backend:** Rate limiting, sanitization, authentication, authorization
✅ **Database:** Restaurant isolation, parameterized queries, validation
✅ **QR Codes:** Table-specific access, validated restaurant context

**Key Points:**
1. Customers can ONLY access their table's menu via QR code
2. Admin/kitchen areas require proper authentication
3. All inputs are validated and sanitized
4. Rate limiting prevents abuse
5. Every restaurant's data is completely isolated

**Security is Multi-Layered:**
- Frontend blocks UI navigation
- Backend validates every request
- Database enforces data isolation
- Logging tracks all access attempts

🔒 **Your restaurant customers and admin areas are now properly secured!**
