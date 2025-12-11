# 🔐 Secure Kitchen & Captain Authentication System

## ✅ Security Architecture

### **CRITICAL: All Staff Creation is Restaurant-Owned**

- ✅ **NO public endpoints** for creating kitchen/captain users
- ✅ **JWT authentication required** - Admin must be logged in
- ✅ **Role-based access control** - Only admins can create staff
- ✅ **Tenant isolation enforced** - Staff tied to admin's restaurantId
- ✅ **Password auto-hashing** - Sequelize hooks handle bcrypt
- ✅ **Username-based authentication** - Not email-based

---

## 📋 Complete Authentication Flow

### **Step 1: Admin Creates Restaurant Account**

**Endpoint:** `POST /api/restaurant/signup`

```json
{
  "name": "Pizza Palace",
  "email": "admin@pizzapalace.com",
  "phone": "+1234567890",
  "password": "adminPass123"
}
```

**Response:**
```json
{
  "restaurant": {
    "id": 5,
    "name": "Pizza Palace",
    "slug": "pizza-palace",
    "restaurantCode": "PPL123"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**JWT Payload:**
```json
{
  "id": 5,
  "email": "admin@pizzapalace.com",
  "type": "restaurant",
  "iat": 1670000000,
  "exp": 1670086400
}
```

---

### **Step 2: Admin Creates Kitchen Staff (AUTHENTICATED)**

**Endpoint:** `POST /api/users/kitchen`

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Request Body:**
```json
{
  "username": "kitchen_john",
  "password": "kitchenPass123"
}
```

**How It Works:**
1. JWT middleware extracts `restaurantId` from token
2. `enforceTenantIsolation` validates tenant access
3. `requireRole(['admin'])` ensures only admins can create
4. User created with `restaurantId` from JWT automatically
5. Password hashed by Sequelize `beforeCreate` hook

**Success Response (201):**
```json
{
  "message": "Kitchen user created successfully",
  "user": {
    "id": 42,
    "username": "kitchen_john",
    "role": "kitchen",
    "restaurantId": 5,
    "isOnline": false,
    "createdAt": "2025-12-11T12:00:00.000Z",
    "updatedAt": "2025-12-11T12:00:00.000Z"
  }
}
```

**Error Responses:**
```json
// 401 - No token or invalid token
{
  "message": "Authentication required"
}

// 403 - Not admin role
{
  "message": "Access denied. Required role: admin"
}

// 400 - Username exists
{
  "message": "Username already exists for this restaurant"
}

// 400 - Password too short
{
  "message": "Password must be at least 6 characters long"
}
```

---

### **Step 3: Admin Creates Captain Staff (AUTHENTICATED)**

**Endpoint:** `POST /api/users/captain`

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Request Body:**
```json
{
  "username": "captain_sarah",
  "password": "captainPass456"
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
    "restaurantId": 5,
    "isOnline": false,
    "createdAt": "2025-12-11T12:05:00.000Z",
    "updatedAt": "2025-12-11T12:05:00.000Z"
  }
}
```

---

### **Step 4: Kitchen Staff Login**

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "username": "kitchen_john",
  "password": "kitchenPass123",
  "role": "kitchen",
  "restaurantIdentifier": "pizza-palace"
}
```

**`restaurantIdentifier` can be:**
- Restaurant **slug**: `"pizza-palace"`
- Restaurant **name**: `"Pizza Palace"`
- Restaurant **email**: `"admin@pizzapalace.com"`
- Restaurant **phone**: `"+1234567890"`
- Restaurant **code**: `"PPL123"`

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

**Login Process:**
1. Backend resolves restaurant using `Op.or` query on name/email/phone/slug/code
2. Finds user by `username` AND `restaurantId` AND `role`
3. Validates password with `user.comparePassword(password)`
4. Generates JWT with `{ id, username, role, restaurantId }`
5. Returns user data and token

**Error Responses:**
```json
// 400 - Missing restaurantIdentifier
{
  "message": "Restaurant identifier is required (restaurant name, email, or phone)"
}

// 401 - Restaurant not found OR user not found OR wrong password
{
  "message": "Invalid credentials"
}
```

---

### **Step 5: Captain Staff Login**

**Endpoint:** `POST /api/auth/captain/login`

**Request Body:**
```json
{
  "username": "captain_sarah",
  "password": "captainPass456",
  "restaurantIdentifier": "pizza-palace"
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": 43,
    "username": "captain_sarah",
    "role": "captain",
    "restaurantId": 5,
    "restaurantSlug": "pizza-palace",
    "restaurantName": "Pizza Palace"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 🔒 Security Features

### **1. Multi-Layer Authentication**

```
Admin Creates Staff:
  ↓
1. JWT Token Validation (authenticateRestaurant)
  ↓
2. Tenant Isolation Check (enforceTenantIsolation)
  ↓
3. Role Authorization (requireRole(['admin']))
  ↓
4. Staff Created with Admin's restaurantId (from JWT)
```

### **2. Staff Login Security**

```
Staff Login Request:
  ↓
1. Restaurant Resolution (name/email/phone/slug/code)
  ↓
2. User Lookup (username + restaurantId + role)
  ↓
3. Password Validation (bcrypt.compare)
  ↓
4. JWT Generation (id + role + restaurantId)
```

### **3. Tenant Isolation**

- Admin's JWT contains `restaurantId`
- Staff creation uses `req.restaurantId` from JWT
- Staff login validates user belongs to resolved restaurant
- All subsequent requests include `restaurantId` in token
- Middleware blocks cross-tenant access

### **4. Password Security**

```javascript
// User model - Sequelize hooks
hooks: {
  beforeCreate: async (user) => {
    if (user.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    }
  },
  beforeUpdate: async (user) => {
    if (user.changed('password')) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    }
  }
}
```

- Passwords auto-hashed on create/update
- Salt rounds: 10
- Never returned in API responses
- Validation via `user.comparePassword()`

---

## 🧪 Complete Testing Flow

### **Test 1: Admin Signup**

```bash
curl -X POST http://localhost:3000/api/restaurant/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pizza Palace",
    "email": "admin@pizzapalace.com",
    "phone": "+1234567890",
    "password": "adminPass123"
  }'
```

**Save the token from response!**

---

### **Test 2: Admin Creates Kitchen User**

```bash
# Use token from Test 1
curl -X POST http://localhost:3000/api/users/kitchen \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "username": "kitchen_mike",
    "password": "kitchenPass123"
  }'
```

**Expected:** Status 201, kitchen user created

---

### **Test 3: Admin Creates Captain User**

```bash
# Use token from Test 1
curl -X POST http://localhost:3000/api/users/captain \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "username": "captain_lisa",
    "password": "captainPass456"
  }'
```

**Expected:** Status 201, captain user created

---

### **Test 4: Kitchen User Login**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "kitchen_mike",
    "password": "kitchenPass123",
    "role": "kitchen",
    "restaurantIdentifier": "pizza-palace"
  }'
```

**Expected:** Status 200, JWT token returned

---

### **Test 5: Captain User Login**

```bash
curl -X POST http://localhost:3000/api/auth/captain/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "captain_lisa",
    "password": "captainPass456",
    "restaurantIdentifier": "pizza-palace"
  }'
```

**Expected:** Status 200, JWT token returned

---

### **Test 6: Unauthorized Staff Creation (No Token)**

```bash
curl -X POST http://localhost:3000/api/users/kitchen \
  -H "Content-Type: application/json" \
  -d '{
    "username": "hacker_attempt",
    "password": "password123"
  }'
```

**Expected:** Status 401, authentication required

---

### **Test 7: Cross-Tenant Login Prevention**

```bash
# Create second restaurant
curl -X POST http://localhost:3000/api/restaurant/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Burger King",
    "email": "admin@burgerking.com",
    "phone": "+9876543210",
    "password": "adminPass456"
  }'

# Try to login Pizza Palace kitchen user with Burger King identifier
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "kitchen_mike",
    "password": "kitchenPass123",
    "role": "kitchen",
    "restaurantIdentifier": "burger-king"
  }'
```

**Expected:** Status 401, "Invalid credentials" (user not found in Burger King)

---

## 📊 Database Verification

### **Check Created Users**

```sql
-- Verify kitchen/captain users
SELECT 
  u.id,
  u.username,
  u.role,
  u."restaurantId",
  r.name as restaurant_name,
  r.slug as restaurant_slug
FROM users u
JOIN "Restaurants" r ON u."restaurantId" = r.id
WHERE u.role IN ('kitchen', 'captain')
ORDER BY r.name, u.role, u.username;
```

### **Verify Password Hashing**

```sql
-- Check password is hashed (should start with $2a$ or $2b$)
SELECT username, role, LEFT(password, 7) as password_hash
FROM users
WHERE role IN ('kitchen', 'captain');
```

**Expected Output:**
```
 username      | role    | password_hash
---------------+---------+--------------
 kitchen_mike  | kitchen | $2a$10$
 captain_lisa  | captain | $2a$10$
```

### **Verify Tenant Isolation**

```sql
-- Check users are correctly assigned to restaurants
SELECT 
  r.name as restaurant,
  COUNT(*) FILTER (WHERE u.role = 'kitchen') as kitchen_users,
  COUNT(*) FILTER (WHERE u.role = 'captain') as captain_users
FROM "Restaurants" r
LEFT JOIN users u ON u."restaurantId" = r.id AND u.role IN ('kitchen', 'captain')
GROUP BY r.name
ORDER BY r.name;
```

---

## 🚨 Common Issues & Solutions

### **Issue 1: "Authentication required" when creating staff**

**Cause:** No JWT token or invalid token

**Solution:**
1. Admin must login first to get JWT token
2. Include token in Authorization header: `Bearer <token>`

```bash
# Login as admin
ADMIN_TOKEN=$(curl -X POST http://localhost:3000/api/restaurant/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pizzapalace.com",
    "password": "adminPass123"
  }' | jq -r '.token')

# Now create staff with token
curl -X POST http://localhost:3000/api/users/kitchen \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username": "kitchen_mike", "password": "pass123"}'
```

---

### **Issue 2: "Invalid credentials" during staff login**

**Possible Causes:**
1. Wrong password
2. Wrong restaurantIdentifier
3. User doesn't exist
4. User exists but in different restaurant

**Debug Steps:**
```sql
-- Check if user exists
SELECT id, username, role, "restaurantId" 
FROM users 
WHERE username = 'kitchen_mike';

-- Check restaurant details
SELECT id, name, slug, email, phone 
FROM "Restaurants" 
WHERE slug = 'pizza-palace';

-- Verify user-restaurant association
SELECT 
  u.username, 
  u.role, 
  u."restaurantId",
  r.name as restaurant_name,
  r.slug as restaurant_slug
FROM users u
JOIN "Restaurants" r ON u."restaurantId" = r.id
WHERE u.username = 'kitchen_mike';
```

---

### **Issue 3: "Username already exists"**

**Cause:** Username taken for that restaurant

**Solutions:**

**Option A:** Use different username
```json
{
  "username": "kitchen_mike2",
  "password": "pass123"
}
```

**Option B:** Delete existing user (if recreating)
```sql
DELETE FROM users 
WHERE username = 'kitchen_mike' 
AND "restaurantId" = 5;
```

---

### **Issue 4: Password not working after creation**

**Cause:** Password hash corruption or manual hash attempt

**Solution:** Update password (will auto-hash)
```sql
-- Find user ID
SELECT id, username FROM users WHERE username = 'kitchen_mike';

-- Update password (Sequelize hook will hash it)
-- Must be done through API endpoint or Sequelize
```

**Better Solution:** Recreate user via API

---

## 📁 Modified Files

### **backend/routes/users.js**

**Changes:**
- ✅ Removed ALL public endpoints
- ✅ All routes require authentication (`router.use(authenticateRestaurant)`)
- ✅ Added `POST /kitchen` with admin role requirement
- ✅ Added `POST /captain` with admin role requirement
- ✅ Both use `req.restaurantId` from JWT (tenant isolation)
- ✅ Password auto-hashed by Sequelize hooks

### **backend/routes/auth.js**

**Already Implemented:**
- ✅ Kitchen/captain login with restaurantIdentifier
- ✅ Restaurant resolution via `Op.or` query
- ✅ User lookup by username + restaurantId + role
- ✅ Password validation with `comparePassword()`
- ✅ JWT generation with restaurantId

### **backend/models/User.js**

**Already Implemented:**
- ✅ Password hashing via `beforeCreate` hook
- ✅ Password update hashing via `beforeUpdate` hook
- ✅ `comparePassword()` instance method
- ✅ Unique constraint on (`restaurantId`, `username`)

---

## ✅ Security Checklist

- [x] ✅ No public staff creation endpoints
- [x] ✅ JWT authentication required for staff creation
- [x] ✅ Admin role required for staff creation
- [x] ✅ Tenant isolation enforced (restaurantId from JWT)
- [x] ✅ Password auto-hashing (Sequelize hooks)
- [x] ✅ Username-based authentication
- [x] ✅ Restaurant identifier auto-resolution
- [x] ✅ Role-based login validation
- [x] ✅ Generic error messages (no info disclosure)
- [x] ✅ Cross-tenant login prevention
- [x] ✅ JWT includes restaurantId for all requests

---

## 🎯 Production Ready

The authentication system is now:
- **Restaurant-owned**: Only admins can create staff
- **Secure**: JWT + role-based access + tenant isolation
- **Flexible**: Multiple restaurant identifiers supported
- **Robust**: Password hashing + validation + error handling

**All staff creation is private and authenticated. No public endpoints exist.**
