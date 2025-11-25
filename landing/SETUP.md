# QuickServe Landing Page Setup

## Overview
This is the landing page for the QuickServe restaurant management system. It provides login and signup functionality for restaurant owners.

## Current Status
✅ Landing page is running on: **http://localhost:3001**
❌ Backend server needs PostgreSQL to be running

## Features
- **Landing Page**: Modern landing page with restaurant branding
- **Restaurant Signup**: Register new restaurants with name, email, password, phone, and address
- **Restaurant Login**: Login with email and password
- **Dashboard**: After login, access both Customer and Admin panels

## Required Services

### 1. PostgreSQL Database
**Status**: ⚠️ REQUIRED but not currently running

PostgreSQL must be running for the backend to work. You have two options:

#### Option A: Start PostgreSQL Service (if installed)
```powershell
# Check if PostgreSQL is installed
Get-Service -Name "*postgresql*"

# Start the service
Start-Service -Name "postgresql-x64-16"  # Adjust version number
```

#### Option B: Install PostgreSQL
1. Download from: https://www.postgresql.org/download/windows/
2. Install with password: `sourabh` (as configured in .env)
3. Start the service

### 2. Backend Server
**Port**: 3000
**Location**: `c:\Desktop\quickServe\backend`

```powershell
cd c:\Desktop\quickServe\backend
npm start
```

**Note**: Backend will not start until PostgreSQL is running!

### 3. Landing Page (Current App)
**Port**: 3001 (default 3000 was in use)
**Location**: `c:\Desktop\quickServe\landing`

```powershell
cd c:\Desktop\quickServe\landing
npm run dev
```

### 4. Admin Panel
**Port**: 5174
**Location**: `c:\Desktop\quickServe\admin`

```powershell
cd c:\Desktop\quickServe\admin
npm run dev
```

### 5. Customer App
**Port**: 8080
**Location**: `c:\Desktop\quickServe\customer`

```powershell
cd c:\Desktop\quickServe\customer
npm run dev
```

## User Flow

### Signup Flow
1. Open http://localhost:3001
2. Click "Get Started" or "Sign Up"
3. Fill in restaurant details:
   - Restaurant Name
   - Email
   - Password (min 6 characters)
   - Confirm Password
   - Phone
   - Address
4. Click "Create Account"
5. **Success**: You'll see a green success message and be redirected to login after 2 seconds
6. **Error**: Red error message will show what went wrong

### Login Flow
1. Open http://localhost:3001 or click "Sign in" from signup page
2. Enter your email and password
3. Click "Sign In"
4. **Success**: Redirected to Dashboard
5. **Error**: Red error message will show

### Dashboard
After successful login, you'll see:
- **Restaurant Information**: Your restaurant details
- **Quick Actions**:
  - 🔧 **Admin Panel**: Manage menu, orders, tables, kitchen staff
  - 👥 **Customer App**: View the customer-facing ordering interface
  - 📊 **Analytics**: Coming soon
  - ⚙️ **Settings**: Coming soon

## API Endpoints

### Signup
```
POST http://localhost:3000/api/restaurant/signup
Content-Type: application/json

{
  "name": "My Restaurant",
  "email": "restaurant@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "address": "123 Main St, City, Country"
}
```

### Login
```
POST http://localhost:3000/api/restaurant/login
Content-Type: application/json

{
  "email": "restaurant@example.com",
  "password": "password123"
}
```

## Common Issues

### ❌ "Unable to connect to server"
**Problem**: Backend is not running or PostgreSQL is not running
**Solution**: 
1. Start PostgreSQL service
2. Start backend server: `cd backend && npm start`

### ❌ "Registration failed"
**Problem**: Could be validation error or duplicate email
**Solution**: Check the error message. If email exists, use login instead

### ❌ "Invalid email or password"
**Problem**: Wrong credentials or account doesn't exist
**Solution**: Double-check credentials or create a new account

## Development

### Install Dependencies
```powershell
cd c:\Desktop\quickServe\landing
npm install
```

### Run Development Server
```powershell
npm run dev
```

### Build for Production
```powershell
npm run build
```

## Tech Stack
- **React 18** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Radix UI** components
- **Lucide React** icons
- **Vite** for build tooling

## Next Steps
1. ✅ Start PostgreSQL
2. ✅ Start Backend Server
3. ✅ Test Signup
4. ✅ Test Login
5. ✅ Access Dashboard
6. ✅ Navigate to Admin Panel
7. ✅ Navigate to Customer App

## Support
If you encounter any issues:
1. Check that all services are running
2. Check the browser console for errors (F12)
3. Check backend logs in the terminal
4. Verify PostgreSQL is accessible with credentials in `.env`
