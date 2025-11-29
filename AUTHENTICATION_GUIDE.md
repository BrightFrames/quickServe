# Authentication & Authorization Guide

## Overview
Your backend uses JWT (JSON Web Tokens) for authentication. There are **two types** of authentication:

### 1. Restaurant Authentication (Admin/Owner)
- **Login Endpoint**: `POST /api/restaurant/login`
- **Token Type**: `restaurant`
- **Used For**: Admin panel, restaurant management
- **Token Contains**: `{ id: restaurantId, email, type: 'restaurant' }`

### 2. Kitchen User Authentication  
- **Login Endpoint**: `POST /api/auth/login`
- **Token Type**: Kitchen/cook user
- **Used For**: Kitchen dashboard
- **Token Contains**: `{ id: userId, username, role: 'kitchen' }`

---

## How to Fix 403 Forbidden Errors

### Common Causes:

#### 1. **Missing Authorization Header**
```
Error: "Authentication required"
Solution: Include header in your API request:
  Authorization: Bearer <your-token>
```

#### 2. **Wrong Token Type**
```
Error: "Access denied - This endpoint requires restaurant authentication"
Cause: Using kitchen user token for admin endpoints
Solution: Login via /api/restaurant/login to get restaurant token
```

#### 3. **Expired Token**
```
Error: "Token expired"
Solution: Login again to get a new token
Tokens expire after 30 days (restaurant) or 24 hours (kitchen)
```

#### 4. **Invalid Token Format**
```
Error: "Invalid authorization header format"
Solution: Must be: "Bearer <token>" not just "<token>"
```

---

## API Endpoints by Authentication Type

### Public Endpoints (No Auth Required)
- `POST /api/restaurant/signup` - Register new restaurant
- `POST /api/restaurant/login` - Restaurant login
- `POST /api/auth/login` - Kitchen user login
- `POST /api/orders` - Create order (customer facing)
- `POST /api/promo-codes/validate` - Validate promo code
- `GET /api/restaurant/verify/:slug/:code` - Verify restaurant
- `GET /api/health` - Health check

### Restaurant-Authenticated Endpoints (Require Restaurant Token)
All these require `Authorization: Bearer <restaurant-token>`:

- **Menu Management**: All `/api/menu/*` endpoints
- **Promo Codes**: All `/api/promo-codes/*` (except validate)
- **Orders**: `GET /api/orders/*` (list, view, update status)
- **Users**: All `/api/users/*` (kitchen staff management)
- **Tables**: All `/api/tables/*` (table & QR management)
- **Analytics**: All `/api/analytics/*` (reports & stats)
- **Restaurant Profile**: `GET/PUT /api/restaurant/profile`

---

## Testing Your Authentication

### 1. Check if Token is Valid
```bash
GET /api/debug/verify-token
Headers:
  Authorization: Bearer <your-token>

Response:
{
  "valid": true,
  "decoded": {
    "id": 1,
    "email": "restaurant@example.com",
    "type": "restaurant",
    "iat": "2025-11-29T...",
    "exp": "2025-12-29T..."
  }
}
```

### 2. Check Request Headers
```bash
GET /api/debug/check-auth
Headers:
  Authorization: Bearer <your-token>
  x-restaurant-slug: your-restaurant-slug

Response:
{
  "headers": {
    "authorization": "Bearer eyJ...",
    "x-restaurant-slug": "your-slug"
  },
  "help": { ... }
}
```

---

## Frontend Integration

### React Example - Restaurant Login
```javascript
// Login
const loginRestaurant = async (email, password) => {
  const response = await fetch('http://localhost:3000/api/restaurant/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  
  if (response.ok) {
    // Save token to localStorage
    localStorage.setItem('restaurantToken', data.token);
    localStorage.setItem('restaurant', JSON.stringify(data.restaurant));
    return data;
  } else {
    throw new Error(data.message);
  }
};

// Make authenticated request
const getMenu = async () => {
  const token = localStorage.getItem('restaurantToken');
  
  const response = await fetch('http://localhost:3000/api/menu', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (response.status === 401) {
    // Token expired or invalid - redirect to login
    window.location.href = '/login';
    return;
  }
  
  if (response.status === 403) {
    // Wrong token type or permissions
    console.error('Access denied');
    return;
  }
  
  return await response.json();
};
```

### Axios Example
```javascript
import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('restaurantToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401/403 errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('restaurantToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Usage
const getMenu = () => api.get('/menu');
const createMenuItem = (data) => api.post('/menu', data);
```

---

## CORS Configuration

Your backend allows these custom headers:
- `Content-Type`
- `Authorization`
- `X-Requested-With`
- `Accept`
- `x-restaurant-slug` ✅ (newly added)

Allowed methods:
- `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`

Allowed origins (configured in `.env` or defaults):
- `http://localhost:3000` - Backend
- `http://localhost:5173` - Admin dev
- `http://localhost:8080` - Customer dev
- Plus any origins in `ALLOWED_ORIGINS` env variable

---

## Troubleshooting Checklist

- [ ] Check if backend server is running on correct port
- [ ] Verify token is being sent in Authorization header
- [ ] Confirm token format is "Bearer <token>" not just "<token>"
- [ ] Test token validity with `/api/debug/verify-token`
- [ ] Check token type matches endpoint requirements (restaurant vs kitchen)
- [ ] Verify CORS allows your frontend origin
- [ ] Check browser console for CORS errors
- [ ] Confirm `.env` has correct `JWT_SECRET`
- [ ] Test with Postman/curl to isolate frontend vs backend issues

---

## Common Error Messages Explained

| Error Message | Status | Cause | Solution |
|--------------|--------|-------|----------|
| "Authentication required" | 401 | No token provided | Add Authorization header |
| "Invalid authorization header format" | 401 | Token format wrong | Use "Bearer <token>" |
| "Token expired" | 401 | Token expired | Login again |
| "Invalid token" | 401 | Token malformed | Login again |
| "Access denied" | 403 | Wrong token type | Use restaurant token for admin endpoints |
| "Restaurant not found" | 404 | restaurantId invalid | Check restaurant exists in DB |

---

## Quick Command Reference

### Start Backend
```bash
cd backend
npm start
```

### Test Authentication
```bash
# Get restaurant token
curl -X POST http://localhost:3000/api/restaurant/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'

# Test authenticated endpoint
curl http://localhost:3000/api/menu \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Verify token
curl http://localhost:3000/api/debug/verify-token \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Environment Variables Required

```env
JWT_SECRET=your-secret-key-here
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8080
```

---

## Need More Help?

1. Check backend logs for detailed error messages
2. Use `/api/debug/verify-token` to validate your token
3. Test with Postman to eliminate frontend issues
4. Verify restaurant exists in database
5. Check that JWT_SECRET matches between login and verification

