# 🔧 Kitchen & Captain Authentication - Complete Fix

## ✅ Issues Fixed

### 1. **User Creation**
- ✅ Added public endpoints for creating kitchen/captain users
- ✅ Automatic restaurantId resolution from identifier (name/email/phone/slug/code)
- ✅ Password auto-hashing via Sequelize hooks (no double-hashing)
- ✅ Proper role assignment ('kitchen' or 'captain')
- ✅ Validation of username uniqueness per restaurant

### 2. **Login System**
- ✅ Username-based authentication (already working)
- ✅ Restaurant resolution from identifier
- ✅ Role-based access control (kitchen/captain/cook)
- ✅ Tenant isolation enforced
- ✅ JWT includes { id, role, restaurantId }

### 3. **Security**
- ✅ Passwords hashed with bcrypt (salt rounds: 10)
- ✅ Generic error messages (no information disclosure)
- ✅ Multi-tenant isolation (users tied to restaurantId)
- ✅ Role validation at login

---

## 📝 API Endpoints

### **1. Create Kitchen User (PUBLIC)**

**Endpoint:** `POST /api/users/create-kitchen`

**Request Body:**
```json
{
  "username": "kitchen_john",
  "password": "securePass123",
  "restaurantIdentifier": "pizza-palace"
}
```

**restaurantIdentifier** can be:
- Restaurant **slug**: `"pizza-palace"`
- Restaurant **name**: `"Pizza Palace"`
- Restaurant **email**: `"contact@pizzapalace.com"`
- Restaurant **phone**: `"+1234567890"`
- Restaurant **code**: `"PPL123"`

**Success Response (201):**
```json
{
  "message": "Kitchen user created successfully",
  "user": {
    "id": 42,
    "username": "kitchen_john",
    "role": "kitchen",
    "restaurantId": 5,
    "restaurantName": "Pizza Palace",
    "restaurantSlug": "pizza-palace"
  }
}
```

**Error Responses:**
```json
// 400 - Missing fields
{
  "message": "Username, password, and restaurant identifier are required"
}

// 400 - Password too short
{
  "message": "Password must be at least 6 characters long"
}

// 404 - Restaurant not found
{
  "message": "Restaurant not found. Please check the restaurant identifier."
}

// 400 - Username exists
{
  "message": "Username already exists for this restaurant"
}
```

---

### **2. Create Captain User (PUBLIC)**

**Endpoint:** `POST /api/users/create-captain`

**Request Body:**
```json
{
  "username": "captain_sarah",
  "password": "securePass456",
  "restaurantIdentifier": "burger-king"
}
```

**Success Response (201):**
```json
{
  "message": "Captain user created successfully",
  "user": {
    "id": 43,
    "username": "captain_sarah",
    "role": "captain",
    "restaurantId": 3,
    "restaurantName": "Burger King Restaurant",
    "restaurantSlug": "burger-king"
  }
}
```

**Error Responses:** (Same as kitchen user creation)

---

### **3. Kitchen/Cook Login**

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "username": "kitchen_john",
  "password": "securePass123",
  "role": "kitchen",
  "restaurantIdentifier": "pizza-palace"
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": 42,
    "username": "kitchen_john",
    "role": "kitchen",
    "restaurantId": 5
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**JWT Payload:**
```json
{
  "id": 42,
  "username": "kitchen_john",
  "role": "kitchen",
  "restaurantId": 5,
  "iat": 1670000000,
  "exp": 1670086400
}
```

**Error Responses:**
```json
// 400 - Missing fields
{
  "message": "Username, password, and role are required"
}

// 400 - Missing restaurantIdentifier
{
  "message": "Restaurant identifier is required (restaurant name, email, or phone)"
}

// 401 - Invalid credentials (restaurant not found OR user not found OR wrong password)
{
  "message": "Invalid credentials"
}
```

---

### **4. Captain Login**

**Endpoint:** `POST /api/auth/captain/login`

**Request Body:**
```json
{
  "username": "captain_sarah",
  "password": "securePass456",
  "restaurantIdentifier": "burger-king"
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": 43,
    "username": "captain_sarah",
    "role": "captain",
    "restaurantId": 3,
    "restaurantSlug": "burger-king",
    "restaurantName": "Burger King Restaurant"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:** (Same as kitchen login)

---

## 🧪 Testing Guide

### **Test 1: Create Kitchen User**

```bash
# Create kitchen user for Pizza Palace
curl -X POST http://localhost:3000/api/users/create-kitchen \
  -H "Content-Type: application/json" \
  -d '{
    "username": "kitchen_mike",
    "password": "testpass123",
    "restaurantIdentifier": "pizza-palace"
  }'
```

**Expected:** Status 201, user created successfully

---

### **Test 2: Create Captain User**

```bash
# Create captain user for Burger King
curl -X POST http://localhost:3000/api/users/create-captain \
  -H "Content-Type: application/json" \
  -d '{
    "username": "captain_lisa",
    "password": "testpass456",
    "restaurantIdentifier": "burger-king"
  }'
```

**Expected:** Status 201, user created successfully

---

### **Test 3: Kitchen Login**

```bash
# Login as kitchen user
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "kitchen_mike",
    "password": "testpass123",
    "role": "kitchen",
    "restaurantIdentifier": "pizza-palace"
  }'
```

**Expected:** Status 200, JWT token returned

---

### **Test 4: Captain Login**

```bash
# Login as captain user
curl -X POST http://localhost:3000/api/auth/captain/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "captain_lisa",
    "password": "testpass456",
    "restaurantIdentifier": "burger-king"
  }'
```

**Expected:** Status 200, JWT token returned

---

### **Test 5: Cross-Tenant Login Prevention**

```bash
# Try to login kitchen user from Pizza Palace using Burger King identifier
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "kitchen_mike",
    "password": "testpass123",
    "role": "kitchen",
    "restaurantIdentifier": "burger-king"
  }'
```

**Expected:** Status 401, "Invalid credentials" (user not found in Burger King)

---

### **Test 6: Wrong Password**

```bash
# Try login with wrong password
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "kitchen_mike",
    "password": "wrongpassword",
    "role": "kitchen",
    "restaurantIdentifier": "pizza-palace"
  }'
```

**Expected:** Status 401, "Invalid credentials"

---

## 🔍 How It Works

### **User Creation Flow**

```
1. Frontend sends: { username, password, restaurantIdentifier }
   ↓
2. Backend resolves restaurant using Op.or query:
   - Restaurant.findOne({ where: { name/email/phone/slug/code } })
   ↓
3. Check if username already exists for that restaurant
   - User.findOne({ where: { username, restaurantId } })
   ↓
4. Create user with auto-hashed password:
   - User.create({ username, password, role, restaurantId })
   - Sequelize beforeCreate hook hashes password
   ↓
5. Return user data (without password)
```

### **Login Flow**

```
1. Frontend sends: { username, password, role, restaurantIdentifier }
   ↓
2. Backend resolves restaurant using Op.or query
   ↓
3. Find user by username AND restaurantId AND role:
   - User.findOne({ where: { username, restaurantId, role } })
   ↓
4. Validate password using bcrypt.compare
   ↓
5. Generate JWT with { id, role, restaurantId }
   ↓
6. Return { user, token }
```

### **Security Features**

✅ **Password Security**
- Hashed using bcrypt with salt rounds = 10
- Sequelize hooks prevent double-hashing
- Passwords never returned in responses

✅ **Tenant Isolation**
- Every user tied to restaurantId
- Login validates username + restaurantId + role
- JWT contains restaurantId for all requests
- Middleware blocks cross-tenant access

✅ **Role-Based Access**
- Kitchen route: Requires role = 'kitchen' or 'cook'
- Captain route: Requires role = 'captain'
- Role mismatch returns 401

✅ **Error Handling**
- Generic "Invalid credentials" (no info disclosure)
- Detailed logging for debugging (server-side only)

---

## 🐛 Common Issues & Solutions

### **Issue 1: "Restaurant not found"**

**Cause:** Invalid restaurantIdentifier

**Solution:** Verify restaurant exists in database:
```sql
SELECT id, name, email, phone, slug, restaurantCode 
FROM "Restaurants" 
WHERE slug = 'pizza-palace';
```

---

### **Issue 2: "Username already exists"**

**Cause:** Username already taken for that restaurant

**Solution:** 
- Use a different username
- OR delete existing user:
```sql
DELETE FROM users 
WHERE username = 'kitchen_mike' AND "restaurantId" = 5;
```

---

### **Issue 3: "Invalid credentials" after user creation**

**Possible Causes:**
1. Wrong password
2. Wrong restaurantIdentifier
3. Wrong role
4. User created with different restaurantId

**Debug Steps:**
```sql
-- Check if user exists
SELECT id, username, role, "restaurantId" 
FROM users 
WHERE username = 'kitchen_mike';

-- Check restaurant
SELECT id, name, slug 
FROM "Restaurants" 
WHERE slug = 'pizza-palace';

-- Verify restaurantId matches
SELECT u.username, u.role, u."restaurantId", r.name, r.slug
FROM users u
JOIN "Restaurants" r ON u."restaurantId" = r.id
WHERE u.username = 'kitchen_mike';
```

**Solution:** Recreate user with correct restaurantIdentifier

---

### **Issue 4: Password not working**

**Cause:** Password hash corruption or mismatch

**Solution:** Reset password:
```javascript
// In Node.js REPL or script
const bcrypt = require('bcryptjs');
const newPassword = 'newpass123';
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(newPassword, salt);

// Update in database
UPDATE users 
SET password = '<hashedPassword>' 
WHERE username = 'kitchen_mike';
```

---

## 📊 Database Schema

### **users Table**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  "restaurantId" INTEGER REFERENCES "Restaurants"(id) ON DELETE CASCADE,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'kitchen', 'cook', 'captain', 'reception')),
  "isOnline" BOOLEAN DEFAULT FALSE,
  "lastActive" TIMESTAMP DEFAULT NOW(),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("restaurantId", username)
);
```

### **Key Constraints**
- `UNIQUE(restaurantId, username)`: Same username allowed across different restaurants
- `FOREIGN KEY restaurantId REFERENCES Restaurants(id)`: Enforces referential integrity
- `ON DELETE CASCADE`: Deleting restaurant deletes all users

---

## 🚀 Production Checklist

- [x] ✅ Password hashing enabled (Sequelize hooks)
- [x] ✅ Tenant isolation enforced (restaurantId validation)
- [x] ✅ Role-based access control
- [x] ✅ JWT token includes restaurantId
- [x] ✅ Generic error messages (security)
- [x] ✅ Input validation (username, password, identifier)
- [x] ✅ Username uniqueness per restaurant
- [x] ✅ Logging for debugging
- [x] ✅ Public creation endpoints (no auth required)
- [x] ✅ Protected management endpoints (admin only)

---

## 📁 Modified Files

1. **backend/routes/users.js**
   - Added `POST /create-kitchen` (public)
   - Added `POST /create-captain` (public)
   - Fixed password hashing (no double-hash)
   - Restaurant resolution with Op.or query

2. **backend/routes/auth.js**
   - Kitchen/captain login already working
   - Restaurant identifier resolution
   - Role validation
   - JWT generation

3. **backend/models/User.js**
   - Password hashing hooks (already working)
   - comparePassword method (already working)

---

## 💡 Frontend Integration Example

```typescript
// Create kitchen user
async function createKitchenUser(restaurantSlug: string) {
  const response = await fetch('/api/users/create-kitchen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'kitchen_john',
      password: 'securepass123',
      restaurantIdentifier: restaurantSlug
    })
  });
  
  const data = await response.json();
  console.log('Kitchen user created:', data.user);
}

// Login as kitchen user
async function loginKitchen(restaurantSlug: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'kitchen_john',
      password: 'securepass123',
      role: 'kitchen',
      restaurantIdentifier: restaurantSlug
    })
  });
  
  const data = await response.json();
  localStorage.setItem('token', data.token);
  localStorage.setItem('restaurantId', data.user.restaurantId);
}
```

---

## 📞 Support

**Server Logs:**
```bash
# Watch authentication logs
grep "\[AUTH\]" logs/combined.log

# Watch user creation logs
grep "\[USERS\]" logs/combined.log
```

**Database Queries:**
```sql
-- List all kitchen/captain users
SELECT u.id, u.username, u.role, r.name as restaurant
FROM users u
JOIN "Restaurants" r ON u."restaurantId" = r.id
WHERE u.role IN ('kitchen', 'captain')
ORDER BY r.name, u.username;
```
