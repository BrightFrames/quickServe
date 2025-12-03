# 🔧 Vercel Deployment & Authentication Fix Guide

## Issue 1: 404 Errors on Vercel ❌

### Problem
Single Page Application (SPA) routes not working on Vercel - showing 404 when accessing `/dashboard` or any route directly.

### Solution ✅
Created `vercel.json` to handle SPA routing:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Action Required:**
1. Commit and push the new `vercel.json` file
2. Vercel will auto-deploy

```bash
git add frontend/vercel.json
git commit -m "Fix: Add Vercel SPA routing configuration"
git push origin main
```

---

## Issue 2: Wrong Password for Dashboard Login ❌

### Problem
Dashboard login showing "wrong password" even with correct credentials.

### Root Cause Analysis

The authentication system checks credentials in this order:

1. **Admin Login** (role: "admin"):
   - Requires: `restaurantCode` + credentials
   - Default credentials from `.env`:
     ```
     ADMIN_USERNAME=admin
     ADMIN_PASSWORD=admin123
     ```

2. **Staff Login** (kitchen/captain):
   - Uses User table in database
   - Created via signup/admin panel

### Solution Steps ✅

#### Step 1: Verify Render Environment Variables

Your Render backend MUST have these environment variables set:

```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_SECRET=GB3OunhU9vJZZQ0WbuQ6OfUj9Axr2KD7
```

**Check on Render:**
1. Go to https://dashboard.render.com
2. Select your backend service
3. Go to "Environment" tab
4. Verify these variables exist
5. If missing, add them and **Redeploy**

#### Step 2: Test Login Credentials

**For Admin Dashboard:**
```
URL: https://quick-serve-ten.vercel.app/admin/login
Username: admin
Password: admin123
Restaurant Code: QS1234 (or your restaurant's code)
```

**For Kitchen Dashboard:**
```
URL: https://quick-serve-ten.vercel.app/kitchen/login
Username: kitchen1
Password: kitchen123
(These are from User table - check your database)
```

#### Step 3: Check Backend Logs

On Render dashboard:
1. Go to your service
2. Click "Logs" tab
3. Look for:
   ```
   [AUTH] Login request received
   [AUTH] Processing admin login...
   [AUTH] ✓ Admin credentials valid
   ```
   OR
   ```
   [AUTH] ✗ Invalid admin credentials
   ```

#### Step 4: Verify API Connection

Test if frontend can reach backend:

```bash
# From browser console on Vercel site
fetch('https://quickserve-51ek.onrender.com/api/restaurant/info/1')
  .then(r => r.json())
  .then(console.log)
```

Should return restaurant data, not CORS error.

---

## Common Issues & Fixes

### Issue: CORS Error
**Symptom:** Browser console shows "CORS policy" error

**Fix:** Backend's `server.js` already has your Vercel URL in CORS:
```javascript
"https://quick-serve-ten.vercel.app"
```

If still failing, check Render logs for CORS blocks.

### Issue: Backend Sleeping (Render Free Tier)
**Symptom:** First login takes 30-60 seconds

**Fix:** This is normal. Render free tier spins down after inactivity. Keep backend active or upgrade to paid tier.

### Issue: Wrong Restaurant Code
**Symptom:** "Invalid restaurant code"

**Check database:**
```sql
SELECT id, name, "restaurantCode" FROM "Restaurant";
```

Common codes:
- QS1234
- QS5678

### Issue: Environment Variables Not Loading

**On Render:**
1. Environment tab
2. Add variables
3. Click "Save Changes"
4. **Manual Deploy** (important!)

---

## Quick Diagnostic Commands

### 1. Test Backend Health
```bash
curl https://quickserve-51ek.onrender.com/api/restaurant/info/1
```

### 2. Test Admin Login
```bash
curl -X POST https://quickserve-51ek.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "role": "admin",
    "restaurantCode": "QS1234"
  }'
```

Should return:
```json
{
  "user": {...},
  "token": "eyJhbGc..."
}
```

### 3. Check Frontend Environment
On Vercel:
1. Project Settings
2. Environment Variables
3. Verify: `VITE_API_URL=https://quickserve-51ek.onrender.com`

---

## Deployment Checklist

### Before Deploying:

- [x] `vercel.json` created ✅
- [ ] Environment variables set on Render
- [ ] Environment variables set on Vercel
- [ ] Test admin credentials locally first
- [ ] Verify restaurant codes in database

### After Deploying:

- [ ] Test login on Vercel URL
- [ ] Check browser console for errors
- [ ] Check Render logs for authentication attempts
- [ ] Test all routes (don't get 404)

---

## Next Steps

1. **Commit vercel.json:**
   ```bash
   cd frontend
   git add vercel.json
   git commit -m "Fix: Add Vercel routing config"
   git push
   ```

2. **Verify Render Environment:**
   - Dashboard → Environment → Check variables
   - If missing, add and redeploy

3. **Test Login:**
   - https://quick-serve-ten.vercel.app/admin/login
   - Use: admin / admin123 / QS1234

4. **Check Logs:**
   - Render dashboard → Logs
   - Look for auth success/failure messages

---

## Support Info

**Your URLs:**
- Frontend: https://quick-serve-ten.vercel.app
- Backend: https://quickserve-51ek.onrender.com

**Default Credentials:**
- Admin: admin / admin123
- Kitchen: kitchen1 / kitchen123 (if created)

**Restaurant Codes:**
Check database for actual codes (usually QS1234, QS5678, etc.)
