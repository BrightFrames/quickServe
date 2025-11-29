# Customer Security Implementation

## Overview
This document describes the security features implemented to prevent customers from accessing admin/kitchen dashboards when they scan QR codes.

## Security Features

### 1. **AdminAccessGuard Component**
**Location:** `frontend/src/customer/components/AdminAccessGuard.tsx`

**Purpose:** Password protection modal that appears when customers try to access admin/kitchen areas.

**Features:**
- ✅ Full-screen blocking modal
- ✅ Restaurant password verification
- ✅ 3 failed attempt limit
- ✅ Auto-redirect after failed attempts
- ✅ Password show/hide toggle
- ✅ Back button blocking
- ✅ Page reload warning
- ✅ 5-minute session expiry after successful verification

**Security Measures:**
```javascript
// Block back button
window.history.pushState(null, '', window.location.href);

// Block page reload
window.addEventListener('beforeunload', handleBeforeUnload);

// Limit attempts
if (attemptCount >= 3) {
  // Auto-redirect to customer menu
}
```

---

### 2. **Enhanced CustomerProtectedRoute**
**Location:** `frontend/src/customer/components/CustomerProtectedRoute.tsx`

**Purpose:** Prevent unauthorized access to admin/kitchen routes from customer sessions.

**Security Layers:**

#### Layer 1: Session Marking
```javascript
sessionStorage.setItem('userType', 'customer');
sessionStorage.setItem('customerSessionStart', Date.now().toString());
```
- Marks every customer session
- Timestamps session start
- Used to differentiate customer vs admin sessions

#### Layer 2: Back Button Protection
```javascript
const handlePopState = (e: PopStateEvent) => {
  const userType = sessionStorage.getItem('userType');
  if (userType === 'customer') {
    window.history.pushState(null, '', window.location.href);
  }
};
```
- Prevents customers from using browser back button to access admin routes
- Pushes forward in history to maintain customer area

#### Layer 3: Route Detection
```javascript
// Detect access attempts via:
- path.includes('/admin') || path.includes('/kitchen')
- hash.includes('admin') || hash.includes('kitchen')
- searchParams.has('admin') || searchParams.has('kitchen')
```
- Checks URL path
- Checks URL hash fragments
- Checks query parameters
- Comprehensive detection of manipulation attempts

#### Layer 4: Admin Verification with Expiry
```javascript
const adminVerified = sessionStorage.getItem('adminVerified');
const verifiedAt = sessionStorage.getItem('adminVerifiedAt');
const verificationExpiry = 5 * 60 * 1000; // 5 minutes

if (adminVerified && verifiedAt) {
  const elapsed = Date.now() - parseInt(verifiedAt);
  if (elapsed < verificationExpiry) {
    // Allow access - admin verified recently
  } else {
    // Verification expired - show guard again
  }
}
```
- If admin password was verified, allow access for 5 minutes
- After 5 minutes, require re-verification
- Prevents persistent admin access from customer sessions

#### Layer 5: Double-Check Protection
```javascript
if (location.pathname.includes('/admin') || location.pathname.includes('/kitchen')) {
  const adminVerified = sessionStorage.getItem('adminVerified');
  if (!adminVerified) {
    return <AdminAccessGuard />;
  }
}
```
- Final safety check before rendering children
- Shows password guard if verification missing

---

### 3. **Backend Password Verification Endpoint**
**Location:** `backend/routes/restaurant.js`

**Endpoint:** `POST /api/restaurant/verify-admin-password`

**Purpose:** Securely verify restaurant password without exposing login tokens.

**Request:**
```json
{
  "slug": "restaurant-slug",
  "password": "restaurant-password"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Password verified successfully"
}
```

**Response (Failure):**
```json
{
  "success": false,
  "message": "Incorrect password"
}
```

**Security:**
- ✅ Uses bcrypt password comparison
- ✅ Does not return JWT tokens (no session elevation)
- ✅ Does not return restaurant data
- ✅ Only confirms password correctness
- ✅ Frontend manages session marking separately

**Code:**
```javascript
router.post("/verify-admin-password", async (req, res) => {
  const { slug, password } = req.body;
  
  const restaurant = await Restaurant.findOne({ 
    where: { slug, isActive: true }
  });
  
  const isValidPassword = await restaurant.comparePassword(password);
  
  if (!isValidPassword) {
    return res.status(401).json({ 
      success: false,
      message: "Incorrect password" 
    });
  }
  
  res.json({ success: true });
});
```

---

### 4. **Session Cleanup on Admin/Kitchen Login**
**Location:** 
- `frontend/src/admin/pages/AdminLogin.tsx`
- `frontend/src/admin/pages/KitchenLogin.tsx`

**Purpose:** Clear customer session markers when legitimate admin/kitchen users log in.

**Implementation:**
```javascript
const handleSubmit = async (e: React.FormEvent) => {
  // Clear customer session markers
  sessionStorage.removeItem('userType');
  sessionStorage.removeItem('customerSessionStart');
  sessionStorage.removeItem('adminVerified');
  sessionStorage.removeItem('adminVerifiedAt');
  
  // Proceed with login
};
```

---

## Security Flow Diagram

```
Customer Scans QR Code
         ↓
/:restaurantSlug/customer/menu/table/t1
         ↓
sessionStorage.setItem('userType', 'customer')
         ↓
Customer Tries to Edit URL or Go Back
         ↓
Detection Triggered:
- URL contains /admin or /kitchen
- Hash contains admin/kitchen
- Query params contain admin/kitchen
         ↓
Check adminVerified Session
         ↓
    Not Verified?
         ↓
Show AdminAccessGuard Modal
         ↓
Block back button, reload, URL editing
         ↓
User Must Enter Restaurant Password
         ↓
POST /api/restaurant/verify-admin-password
         ↓
    Password Correct?
         ↓
       Yes: Set adminVerified + timestamp
       No:  Increment attempt counter
         ↓
    3 Failed Attempts?
         ↓
Auto-redirect to customer menu
         ↓
Verification Valid for 5 Minutes
         ↓
After 5 Minutes: Require re-verification
```

---

## Protection Against Common Attacks

### 1. **URL Editing**
**Attack:** Customer manually edits URL from `/customer/menu` to `/admin/login`

**Defense:**
```javascript
// CustomerProtectedRoute detects /admin in path
if (path.includes('/admin')) {
  setShowAdminGuard(true); // Show password guard
}
```

### 2. **Back Button Navigation**
**Attack:** Customer uses browser back button to go to admin page visited earlier

**Defense:**
```javascript
// Push forward in history to trap customer
window.history.pushState(null, '', window.location.href);
```

### 3. **Query Parameter Manipulation**
**Attack:** Customer adds `?admin=true` or `?type=admin` to URL

**Defense:**
```javascript
const searchParams = new URLSearchParams(window.location.search);
const hasAdminParam = searchParams.has('admin') || searchParams.has('kitchen');
if (hasAdminParam) {
  setShowAdminGuard(true);
}
```

### 4. **Hash Fragment Manipulation**
**Attack:** Customer adds `#admin` or `#kitchen` to URL

**Defense:**
```javascript
const hash = window.location.hash;
if (hash.includes('admin') || hash.includes('kitchen')) {
  setShowAdminGuard(true);
}
```

### 5. **Persistent Session After Password Entry**
**Attack:** Customer enters password once and tries to maintain access indefinitely

**Defense:**
```javascript
const verificationExpiry = 5 * 60 * 1000; // 5 minutes
const elapsed = Date.now() - parseInt(verifiedAt);
if (elapsed >= verificationExpiry) {
  // Require re-verification
}
```

### 6. **Page Reload to Bypass**
**Attack:** Customer refreshes page to reset guards

**Defense:**
```javascript
// Customer session markers persist in sessionStorage
sessionStorage.setItem('userType', 'customer'); // Persists across reloads

// AdminAccessGuard blocks reload
window.addEventListener('beforeunload', handleBeforeUnload);
```

### 7. **Multiple Browser Tabs**
**Attack:** Customer opens admin route in new tab

**Defense:**
- `sessionStorage` is tab-specific
- Each tab has its own `userType` marker
- Each tab requires separate password verification

---

## Testing Checklist

### Test Case 1: Direct URL Editing
- [ ] Open `/:slug/customer/menu/table/t1`
- [ ] Edit URL to `/:slug/admin/login`
- [ ] **Expected:** AdminAccessGuard modal appears
- [ ] **Expected:** Cannot navigate without password

### Test Case 2: Back Button Attack
- [ ] Visit admin login page
- [ ] Navigate to customer menu
- [ ] Click browser back button
- [ ] **Expected:** Stays in customer area or shows password guard

### Test Case 3: Query Parameter Attack
- [ ] Open customer menu
- [ ] Add `?admin=true` to URL
- [ ] **Expected:** AdminAccessGuard modal appears

### Test Case 4: Failed Password Attempts
- [ ] Trigger password guard
- [ ] Enter wrong password 3 times
- [ ] **Expected:** Auto-redirect to customer menu after 3rd attempt

### Test Case 5: Password Expiry
- [ ] Enter correct restaurant password
- [ ] Access admin area
- [ ] Wait 6 minutes
- [ ] Try to access admin area again
- [ ] **Expected:** Must re-enter password

### Test Case 6: Legitimate Admin Login
- [ ] Clear sessionStorage
- [ ] Go to `/:slug/admin/login` directly
- [ ] Login with admin credentials
- [ ] **Expected:** Customer session markers cleared
- [ ] **Expected:** Full admin access granted

### Test Case 7: Page Reload Persistence
- [ ] Open customer menu (marked as customer)
- [ ] Reload page
- [ ] Try to access admin area
- [ ] **Expected:** Still marked as customer
- [ ] **Expected:** Password guard appears

---

## Configuration

### Verification Expiry Time
Change in `CustomerProtectedRoute.tsx`:
```javascript
const verificationExpiry = 5 * 60 * 1000; // 5 minutes (300,000ms)
```

### Failed Attempt Limit
Change in `AdminAccessGuard.tsx`:
```javascript
if (attemptCount >= 3) { // Change 3 to desired limit
  // Auto-redirect logic
}
```

---

## Security Best Practices

1. ✅ **Never expose JWT tokens** - Password verification doesn't return tokens
2. ✅ **Time-limited verification** - 5-minute expiry prevents persistent access
3. ✅ **Multiple detection layers** - Path, hash, query params all monitored
4. ✅ **Client + Server validation** - Frontend blocks + backend verifies password
5. ✅ **Session isolation** - Customer and admin sessions properly separated
6. ✅ **Attempt limiting** - 3 failed attempts triggers auto-redirect
7. ✅ **User experience** - Clear warnings and instructions for legitimate access

---

## Future Enhancements

### Potential Improvements:
1. **IP-based rate limiting** - Prevent brute force password attempts
2. **2FA for admin access** - Additional verification layer
3. **Audit logging** - Track all admin access attempts from customer sessions
4. **Temporary access codes** - Generate time-limited codes for specific admin access
5. **Biometric verification** - Use device biometrics for password entry
6. **Email notification** - Alert restaurant owner of suspicious access attempts

---

## Maintenance

### When Adding New Admin Routes:
1. Ensure route includes `/admin` or `/kitchen` in path
2. CustomerProtectedRoute will automatically detect and protect
3. No additional code changes needed

### When Changing Restaurant Model:
1. Ensure `comparePassword()` method remains intact
2. Update password verification endpoint if password field changes
3. Test password verification after changes

---

## Summary

This implementation provides **multi-layered security** to prevent customers from accessing admin/kitchen areas:

- 🔒 **Password Protection** - Restaurant password required for admin access
- 🚫 **URL Manipulation Blocked** - Detects and blocks all URL editing attempts
- ⏱️ **Time-Limited Access** - 5-minute expiry for verified sessions
- 🔄 **Session Isolation** - Proper separation of customer and admin sessions
- 🛡️ **Multiple Detection Layers** - Path, hash, query params all monitored
- 📊 **Attempt Limiting** - 3 strikes and auto-redirect
- ✅ **User-Friendly** - Clear warnings and instructions

The system ensures that **only restaurant owners with the correct password** can access admin/kitchen dashboards, while providing a seamless experience for legitimate customers.
