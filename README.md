# QuickServe - Restaurant Management Platform

##  Quick Start Guide

This project includes a complete restaurant management platform with:
1. **Landing Page** - Restaurant registration and login
2. **Admin Panel** - Restaurant management interface  
3. **Customer App** - Customer ordering interface
4. **Backend API** - Server with database integration

## 📋 Prerequisites

- Node.js 18+
- Supabase
- Git

## 🛠️ Setup Instructions

### 1. Environment Setup

Create a `.env` file in the `backend` folder:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/quickserve
# or use MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/quickserve

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-here

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Server Port
PORT=5000

# CORS Origins (add your production URLs here)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080,http://localhost:5174
```

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install

# Landing Page
cd ../landing
npm install

# Admin Panel (if needed)
cd ../admin
npm install

# Customer App (if needed)
cd ../customer
npm install
```

### 3. Start Services

#### Option A: Start Everything at Once

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Landing Page:**
```bash
cd landing
npm run dev
```

**Terminal 3 - Admin Panel (Optional):**
```bash
cd admin
npm run dev
```

**Terminal 4 - Customer App (Optional):**
```bash
cd customer
npm run dev
```

#### Option B: PowerShell Script (Windows)

Create a `start-all.ps1` script:

```powershell
# Start all QuickServe services

Write-Host "Starting QuickServe services..." -ForegroundColor Green

# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start" -WindowStyle Normal

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start Landing Page
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd landing; npm run dev" -WindowStyle Normal

# Start Admin Panel
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd admin; npm run dev" -WindowStyle Normal

# Start Customer App
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd customer; npm run dev" -WindowStyle Normal

Write-Host "All services starting..." -ForegroundColor Yellow
Write-Host "Landing Page: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Admin Panel: http://localhost:5174" -ForegroundColor Cyan
Write-Host "Customer App: http://localhost:8080" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:5000" -ForegroundColor Cyan
```

## 🌐 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Landing Page | http://localhost:3000 | Restaurant signup/login |
| Backend API | http://localhost:5000 | REST API server |
| Admin Panel | http://localhost:5174 | Restaurant management |
| Customer App | http://localhost:8080 | Customer ordering |

## 🔐 Default Credentials

### Admin User (for existing admin panel)
- Username: `admin`
- Password: `admin123`

### Test Restaurant (create via signup form)
- You can register a new restaurant through the landing page
- Use any valid email and password (min 6 characters)

## 🧪 Testing the Flow

### 1. Restaurant Registration
1. Go to http://localhost:3000
2. Click "Get Started" or "Sign Up"
3. Fill in restaurant details:
   - Name: "Test Restaurant"
   - Email: "test@restaurant.com"
   - Phone: "+1 (555) 123-4567"
   - Address: "123 Main St, City, State"
   - Password: "password123"

### 2. Login and Dashboard
1. After registration, you'll be logged in automatically
2. Or login manually with email/password
3. Access the dashboard to see restaurant info
4. Use the buttons to open Admin Panel and Customer App

### 3. Admin Panel Features
- Menu management
- Order tracking
- User management
- Analytics

### 4. Customer App Features
- Browse menu
- Place orders
- Track order status

## 🚨 Troubleshooting

### Common Issues

**Backend not connecting to MongoDB:**
- Make sure MongoDB is running locally, or
- Update `MONGODB_URI` in `.env` with your MongoDB Atlas connection string

**CORS errors:**
- Check that all URLs are added to `ALLOWED_ORIGINS` in backend `.env`
- Restart backend after changing CORS settings

**Port conflicts:**
- Backend: 5000
- Landing: 3000  
- Admin: 5174
- Customer: 8080
- Make sure these ports are available

### Reset Database
```bash
cd backend
node clearMenu.js  # Clear menu items
node seedTables.js # Add sample tables
node seed.js       # Add sample data
```

## 📁 Project Structure

```
quickServe/
├── backend/          # Express.js API server
│   ├── models/       # Database models
│   ├── routes/       # API routes
│   └── server.js     # Main server file
├── landing/          # Restaurant auth & dashboard
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── context/
│   └── package.json
├── admin/            # Restaurant management UI
└── customer/         # Customer ordering UI
```

## 🔄 Development Workflow

1. **Start with Landing Page**: Register/login restaurants
2. **Backend Integration**: All auth flows work with real database
3. **Dashboard Navigation**: Jump between admin and customer apps
4. **Real-time Features**: Orders sync across all interfaces

## 🚀 Production Deployment

### Backend (Node.js)
- Deploy to Heroku, Railway, or AWS
- Set production MongoDB URI
- Configure production CORS origins

### Frontend (React Apps)
- Build: `npm run build`
- Deploy to Netlify, Vercel, or AWS S3
- Update API URLs to production backend

## 📝 API Endpoints

### Restaurant Authentication
- `POST /api/restaurant/signup` - Register new restaurant
- `POST /api/restaurant/login` - Login restaurant
- `GET /api/restaurant/profile` - Get restaurant profile
- `POST /api/restaurant/logout` - Logout restaurant

### Existing Endpoints
- `POST /api/auth/login` - Staff login (admin/kitchen)
- `GET /api/menu` - Menu items
- `GET/POST /api/orders` - Orders
- `GET /api/tables` - Tables
- And more...

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

---

**Happy Coding! 🎉**