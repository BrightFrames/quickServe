# PostgreSQL Migration - Quick Start

## ✅ Migration Complete!

Your QuickServe backend has been successfully migrated from MongoDB to PostgreSQL.

## 🚀 Quick Start

### 1. Prerequisites
- PostgreSQL installed and running
- PostgreSQL user with database creation privileges

### 2. Setup Database
```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE quickserve;

# Exit psql
\q
```

### 3. Configure Environment
Edit `backend/.env` and set your PostgreSQL password:
```env
POSTGRES_PASSWORD=your_actual_password
```

### 4. Start the Server
```bash
cd backend
npm start
```

The server will automatically:
- Connect to PostgreSQL
- Create all necessary tables
- Be ready to accept requests

### 5. Seed Data (Optional)
```bash
# Seed kitchen users
npm run seed

# Seed tables
node seedTables.js
```

## 📋 What Changed?

### Database
- **From**: MongoDB (NoSQL)
- **To**: PostgreSQL (SQL)

### ORM
- **From**: Mongoose
- **To**: Sequelize

### Key Changes
1. **IDs**: `_id` (MongoDB ObjectId) → `id` (PostgreSQL INTEGER)
2. **Arrays**: Embedded documents → JSONB fields
3. **Decimals**: Number → DECIMAL(10,2) for prices
4. **Queries**: MongoDB operators → Sequelize operators

## 🔧 Environment Variables

Required in `.env`:
```env
# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=quickserve

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# JWT
JWT_SECRET=your_jwt_secret

# Server
PORT=3000
SAVE_ORDERS=true
```

## 📦 Models

All models converted:
- ✅ User
- ✅ MenuItem
- ✅ Order
- ✅ Rating
- ✅ Table

## 🛣️ Routes

All routes updated:
- ✅ `/api/auth` - Authentication
- ✅ `/api/menu` - Menu management
- ✅ `/api/orders` - Order management
- ✅ `/api/users` - User management
- ✅ `/api/tables` - Table management
- ✅ `/api/ratings` - Rating system
- ✅ `/api/analytics` - Analytics
- ✅ `/api/payment` - Payment processing

## ⚠️ Frontend Considerations

If your frontend references MongoDB-specific fields:

### ID Field Changes
```javascript
// OLD (MongoDB)
order._id

// NEW (PostgreSQL)
order.id
```

### Response Structure
The response structure remains the same, but:
- IDs are now integers instead of ObjectId strings
- Timestamps are ISO 8601 strings (compatible)
- JSONB fields (items, itemRatings) work the same way

## 🧪 Testing

Test all endpoints:
```bash
# Health check
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","role":"admin"}'

# Get menu
curl http://localhost:3000/api/menu
```

## 📖 Documentation

See `MIGRATION_GUIDE.md` for:
- Detailed migration steps
- Query conversion examples
- Troubleshooting guide
- Rollback instructions

## 🆘 Troubleshooting

### Connection Failed
```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql -U postgres -d quickserve -c "SELECT version();"
```

### Schema Issues
Drop and recreate database:
```sql
DROP DATABASE quickserve;
CREATE DATABASE quickserve;
```
Then restart the server.

### Can't Find Module
```bash
npm install
```

## 📊 Benefits of PostgreSQL

- ✅ Better performance for complex queries
- ✅ ACID compliance
- ✅ Better concurrent write handling
- ✅ Native JSONB support
- ✅ Advanced indexing
- ✅ Better for analytics

## 🎉 You're All Set!

Your application is now running on PostgreSQL. All functionality remains the same from a user perspective.
