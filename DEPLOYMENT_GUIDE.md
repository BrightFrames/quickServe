# QuickServe Deployment Guide

This guide will help you deploy QuickServe to production and ensure QR codes work correctly.

## 🚀 Deployment Steps

### 1. Deploy Customer Frontend (Vercel/Netlify)

The customer frontend is where users scan QR codes and place orders.

#### Option A: Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Click "New Project" and import your repository
4. Select the `customer` folder as root directory
5. Configure build settings:
   ```
   Framework Preset: Vite
   Root Directory: customer
   Build Command: npm run build
   Output Directory: dist
   ```
6. Add environment variables:
   ```
   VITE_API_URL=https://your-backend-api.com
   ```
7. Deploy!

**Your customer app URL will be:** `https://your-app.vercel.app`

#### Option B: Deploy to Netlify

1. Go to [Netlify](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Configure:
   ```
   Base directory: customer
   Build command: npm run build
   Publish directory: customer/dist
   ```
5. Add environment variables:
   ```
   VITE_API_URL=https://your-backend-api.com
   ```
6. Deploy!

**Your customer app URL will be:** `https://your-app.netlify.app`

### 2. Deploy Backend (Render/Railway/Heroku)

#### Option A: Deploy to Render

1. Go to [Render](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your repository
4. Configure:
   ```
   Name: quickserve-backend
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```
5. Add environment variables (copy from `.env`):
   ```
   DATABASE_URL=postgresql://...
   PORT=3000
   JWT_SECRET=your_secret
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin123
   SAVE_ORDERS=true
   UPI_ID=yourbusiness@upi
   BUSINESS_NAME=QuickServe
   CALLMEBOT_API_KEY=your_api_key
   CUSTOMER_APP_URL=https://your-customer-app.vercel.app  ← IMPORTANT!
   ALLOWED_ORIGINS=https://your-customer-app.vercel.app,https://your-admin-app.vercel.app
   ```
6. Deploy!

**Your backend API URL will be:** `https://quickserve-backend.onrender.com`

#### Option B: Deploy to Railway

1. Go to [Railway](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add environment variables (same as above)
5. Deploy!

### 3. Deploy Admin Frontend (Vercel/Netlify)

Same process as customer frontend, but use the `admin` folder:

```
Root Directory: admin
Build Command: npm run build
Output Directory: dist
Environment Variables:
  VITE_API_URL=https://your-backend-api.com
```

### 4. Update Backend Environment Variable

**THIS IS THE KEY STEP FOR QR CODES TO WORK!**

After deploying the customer frontend, update your backend's `CUSTOMER_APP_URL`:

```env
CUSTOMER_APP_URL=https://your-customer-app.vercel.app
```

Or whatever URL your customer app is deployed at.

### 5. Regenerate QR Codes

After updating the `CUSTOMER_APP_URL`:

1. Log in to the admin panel
2. Go to "Table Management"
3. For each table, click the regenerate button (🔄)
4. Download and print the new QR codes

**The QR codes will now point to your production URL!**

## 🔧 Environment Variables Reference

### Backend (.env)

```env
# Database (Required)
DATABASE_URL=postgresql://...

# Server (Required)
PORT=3000
JWT_SECRET=your_secret_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Customer App URL (CRITICAL FOR QR CODES)
# Change this to your production customer app URL
CUSTOMER_APP_URL=https://your-customer-app.vercel.app

# CORS (Required)
ALLOWED_ORIGINS=https://your-customer-app.vercel.app,https://your-admin-app.vercel.app

# Features (Optional)
SAVE_ORDERS=true

# Payment (Optional)
UPI_ID=yourbusiness@upi
BUSINESS_NAME=QuickServe

# WhatsApp Invoices (Optional)
CALLMEBOT_API_KEY=your_api_key
```

### Customer Frontend (.env)

```env
VITE_API_URL=https://your-backend-api.onrender.com
```

### Admin Frontend (.env)

```env
VITE_API_URL=https://your-backend-api.onrender.com
```

## 📱 QR Code URL Structure

When you create a table with ID `T1` in a restaurant with slug `my-restaurant`:

**Localhost:**
```
http://localhost:8080/my-restaurant?table=T1
```

**Production:**
```
https://your-app.vercel.app/my-restaurant?table=T1
```

The QR code automatically uses the `CUSTOMER_APP_URL` from your backend environment.

## ✅ Testing Checklist

After deployment:

- [ ] Backend API is accessible
- [ ] Admin panel loads and can log in
- [ ] Customer app loads
- [ ] Create a new table in admin panel
- [ ] Download the QR code
- [ ] Scan QR code with phone - should open production URL
- [ ] Verify QR code URL contains your production domain
- [ ] Place a test order through QR code
- [ ] Check if invoice is sent via WhatsApp (if configured)

## 🐛 Troubleshooting

### QR Codes Still Point to Localhost

**Solution:**
1. Check backend `CUSTOMER_APP_URL` environment variable
2. Restart backend service after updating env vars
3. Regenerate all QR codes from admin panel
4. Download new QR codes

### QR Code Shows 404 Error

**Solution:**
1. Verify customer app is deployed and accessible
2. Check if restaurant slug exists in URL
3. Verify routing is working in customer app

### CORS Errors in Browser

**Solution:**
1. Add frontend URLs to `ALLOWED_ORIGINS` in backend
2. Format: `https://app1.vercel.app,https://app2.netlify.app`
3. No trailing slashes!
4. Restart backend after updating

### Orders Not Saving

**Solution:**
1. Check `SAVE_ORDERS=true` in backend environment
2. Verify database connection (`DATABASE_URL`)
3. Check backend logs for errors

### WhatsApp Invoices Not Sending

**Solution:**
1. Verify `CALLMEBOT_API_KEY` is set
2. Complete CallMeBot setup (see CALLMEBOT_SETUP.md)
3. Check phone number format (+91XXXXXXXXXX)
4. Check backend logs for invoice errors

## 🔄 Updating After Deployment

### Adding New Restaurant

1. Restaurant owner signs up on landing page
2. Note the restaurant slug
3. Admin logs in with restaurant code
4. Create tables in admin panel
5. QR codes automatically use production URL

### Changing Customer App URL

1. Update backend `CUSTOMER_APP_URL`
2. Restart backend
3. Regenerate all QR codes for all restaurants
4. Redistribute new QR codes to tables

### Updating Frontend

1. Push changes to GitHub
2. Vercel/Netlify will auto-deploy
3. No need to regenerate QR codes (unless routing changed)

### Updating Backend

1. Push changes to GitHub
2. Render/Railway will auto-deploy
3. Check if env vars need updating
4. Test QR codes after deployment

## 🌐 Custom Domain Setup

### For Customer App (Vercel)

1. Go to Project Settings → Domains
2. Add your custom domain: `orders.yourdomain.com`
3. Configure DNS records as shown
4. Update backend `CUSTOMER_APP_URL=https://orders.yourdomain.com`
5. Regenerate all QR codes

### For Backend (Render)

1. Go to Settings → Custom Domain
2. Add: `api.yourdomain.com`
3. Configure DNS records
4. Update frontend `VITE_API_URL=https://api.yourdomain.com`

## 💡 Best Practices

1. **Always use HTTPS in production** - QR codes should use secure URLs
2. **Use environment variables** - Never hardcode URLs
3. **Regenerate QR codes after URL changes** - Old codes won't work
4. **Test QR codes** - Scan with phone before printing
5. **Keep restaurant slug consistent** - Changing it breaks QR codes
6. **Backup .env files** - Store them securely (not in Git!)
7. **Monitor backend logs** - Check for errors after deployment
8. **Use CDN for images** - QR codes are base64, keep them optimized

## 📞 Support

If you encounter issues:

1. Check backend logs (Render/Railway dashboard)
2. Check browser console for frontend errors
3. Verify all environment variables are set
4. Test with a fresh QR code
5. Check CORS settings if API calls fail

---

**Last Updated:** December 2024  
**QuickServe Version:** 1.0.0
