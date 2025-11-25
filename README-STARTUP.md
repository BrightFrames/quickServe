# QuickServe - Startup Guide

## Quick Start (Recommended)

### Start All Services at Once
Right-click on `start-all.ps1` and select **"Run with PowerShell"**

This will automatically start:
- Backend API (port 3000)
- Landing Page (port 3001)
- Admin Panel (port 5174)
- Customer App (port 8080)

### Stop All Services
Right-click on `stop-all.ps1` and select **"Run with PowerShell"**

---

## Manual Startup

If you prefer to start services manually:

### 1. Start Backend
```powershell
cd backend
npm start
```

### 2. Start Landing Page
```powershell
cd landing
npm run dev
```

### 3. Start Admin Panel
```powershell
cd admin
npm run dev
```

### 4. Start Customer App
```powershell
cd customer
npm run dev
```

---

## How to Use

1. **Start all services** using `start-all.ps1`
2. **Open your browser** and go to `http://localhost:3001`
3. **Sign up** as a restaurant
4. **Login** with your credentials
5. **Click on Admin Panel or Customer App** buttons in the dashboard
6. The apps will open **within the same page** (no need for separate tabs)

---

## Services Overview

| Service       | Port | URL                       | Purpose                          |
|---------------|------|---------------------------|----------------------------------|
| Backend       | 3000 | http://localhost:3000     | API server (Supabase PostgreSQL) |
| Landing Page  | 3001 | http://localhost:3001     | Restaurant authentication        |
| Admin Panel   | 5174 | http://localhost:5174     | Restaurant management            |
| Customer App  | 8080 | http://localhost:8080     | Customer ordering interface      |

---

## Troubleshooting

### Port Already in Use
If you get a port error, stop all Node processes:
```powershell
Get-Process node | Stop-Process -Force
```

Then restart using `start-all.ps1`

### Backend Not Connecting
Make sure your `.env` file in the `backend` folder has the correct Supabase credentials:
```
DATABASE_URL=postgresql://postgres:Sourabh@123@db.yjtoccguzdfzxmfhunbh.supabase.co:5432/postgres
```

### CORS Errors
The backend is configured to allow requests from all frontend ports. If you still see CORS errors, restart the backend.
