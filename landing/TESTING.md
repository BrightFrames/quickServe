# QuickServe - Testing Guide

## ✅ Services Running

1. **Backend**: http://localhost:3000 (SQLite database)
2. **Landing Page**: http://localhost:3001

## 📝 Test Flow

### Step 1: Sign Up
1. Open: http://localhost:3001
2. Click "Get Started" or "Sign Up" button
3. Fill in the form:
   - Restaurant Name: `Test Restaurant`
   - Email: `test@restaurant.com`
   - Password: `test123`
   - Confirm Password: `test123`
   - Phone: `+1234567890`
   - Address: `123 Main St, City`
4. Click "Create Account"
5. **Expected**: Green success message → Automatically redirects to login page after 2 seconds

### Step 2: Log In
1. You should now be on the login page (or click "Sign In")
2. Enter the credentials you just created:
   - Email: `test@restaurant.com`
   - Password: `test123`
3. Click "Sign In"
4. **Expected**: Redirected to Dashboard

### Step 3: Dashboard
You should now see:
- Your restaurant name in the header
- Restaurant information card with email, phone, address
- Two main action buttons:
  - **🔧 Admin Panel**: Click to open http://localhost:5174 (needs to be started separately)
  - **👥 Customer App**: Click to open http://localhost:8080 (needs to be started separately)

### Step 4: Start Other Services (Optional)

#### Start Admin Panel:
```powershell
cd C:\Desktop\quickServe\admin
npm run dev
```
Then click "Admin Panel" button from dashboard

#### Start Customer App:
```powershell
cd C:\Desktop\quickServe\customer
npm run dev
```
Then click "Customer App" button from dashboard

## 🔍 Check Browser Console

Press F12 to open Developer Tools and check the Console tab. You should see logs like:
```
[AUTH] Starting signup for: test@restaurant.com
[AUTH] Signup response status: 201
[AUTH] Signup successful
[AUTH] Starting login for: test@restaurant.com
[AUTH] Response status: 200
[AUTH] Login successful, setting state
[APP] Restaurant state: {id: 1, name: "Test Restaurant", ...}
```

## ❌ Troubleshooting

### "Unable to connect to server"
- Make sure backend is running: `cd backend && npm start`
- Check backend terminal for errors

### Signup works but login doesn't redirect
- Check browser console (F12) for errors
- Check if backend returned token and restaurant data
- Try logging out and logging in again

### Dashboard doesn't show after login
- Clear localStorage: F12 → Application → Local Storage → Clear
- Try again

## 🎯 Success Criteria

✅ Signup shows success message and redirects to login
✅ Login redirects to dashboard
✅ Dashboard shows restaurant name
✅ Dashboard shows Admin Panel and Customer App buttons
✅ Sign Out button works and returns to landing page
