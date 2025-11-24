# MongoDB to PostgreSQL Migration Guide

## Overview
This guide documents the complete migration from MongoDB to PostgreSQL for the QuickServe backend application.

## Changes Made

### 1. Dependencies
- **Removed**: `mongoose` (MongoDB ORM)
- **Added**: `pg` (PostgreSQL driver) and `sequelize` (PostgreSQL ORM)

### 2. Database Configuration
- Created `config/database.js` with Sequelize configuration
- Connection parameters now use environment variables:
  - `POSTGRES_HOST`
  - `POSTGRES_PORT`
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
  - `POSTGRES_DB`

### 3. Models Migration

#### User Model
- Changed from Mongoose Schema to Sequelize Model
- `_id` → `id` (auto-increment INTEGER)
- All fields preserved with equivalent PostgreSQL types

#### MenuItem Model
- `_id` → `id`
- `price` → DECIMAL(10, 2)
- `averageRating` → DECIMAL(3, 2)
- All numeric fields converted appropriately

#### Order Model
- `_id` → `id`
- `items` array → JSONB field (PostgreSQL's JSON storage)
- `totalAmount` → DECIMAL(10, 2)
- ENUMs preserved for status, payment method, etc.

#### Rating Model
- `_id` → `id`
- Added foreign key constraint to `orders` table
- `itemRatings` → JSONB field
- Created indexes on `orderId`, `rating`, and `createdAt`

#### Table Model
- `_id` → `id`
- All fields preserved
- `qrCode` → TEXT field

### 4. Query Changes

#### MongoDB → PostgreSQL Conversions

**Find Operations:**
```javascript
// MongoDB
await Model.find({ field: value })

// PostgreSQL (Sequelize)
await Model.findAll({ where: { field: value } })
```

**Find One:**
```javascript
// MongoDB
await Model.findOne({ field: value })

// PostgreSQL
await Model.findOne({ where: { field: value } })
```

**Find by ID:**
```javascript
// MongoDB
await Model.findById(id)

// PostgreSQL
await Model.findByPk(id)
```

**Create:**
```javascript
// MongoDB
const doc = new Model(data)
await doc.save()

// PostgreSQL
await Model.create(data)
```

**Update:**
```javascript
// MongoDB
await Model.findByIdAndUpdate(id, data, { new: true })

// PostgreSQL
const record = await Model.findByPk(id)
await record.update(data)
```

**Delete:**
```javascript
// MongoDB
await Model.findByIdAndDelete(id)

// PostgreSQL
const record = await Model.findByPk(id)
await record.destroy()
```

**Operators:**
```javascript
// MongoDB: $in, $ne, $gte, $lte
{ field: { $in: [val1, val2] } }

// PostgreSQL: Op.in, Op.ne, Op.gte, Op.lte
import { Op } from 'sequelize'
{ field: { [Op.in]: [val1, val2] } }
```

**Sorting:**
```javascript
// MongoDB
.sort({ field: 1 }) // ascending
.sort({ field: -1 }) // descending

// PostgreSQL
order: [['field', 'ASC']]
order: [['field', 'DESC']]
```

### 5. Aggregation Queries

MongoDB aggregation pipelines were converted to:
- Sequelize queries with `GROUP BY`
- Raw SQL queries for complex operations
- JSONB functions for array operations

Example (Analytics):
```javascript
// MongoDB Aggregation
await Order.aggregate([
  { $match: { status: { $ne: 'cancelled' } } },
  { $group: { _id: null, total: { $sum: '$totalAmount' } } }
])

// PostgreSQL Raw Query
const [result] = await sequelize.query(`
  SELECT COALESCE(SUM(CAST("totalAmount" AS DECIMAL)), 0) as total
  FROM orders
  WHERE status != 'cancelled'
`)
```

### 6. Server Configuration
- Updated `server.js` to use Sequelize connection
- Added database sync on startup with `syncDatabase()`
- Changed connection test logic

### 7. Seed Files
All seed files updated:
- `seed.js` - Seeds kitchen users
- `seedTables.js` - Seeds table data with QR codes
- `clearMenu.js` - Clears menu items

## Setup Instructions

### 1. Install PostgreSQL
Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/)

### 2. Create Database
```sql
CREATE DATABASE quickserve;
```

### 3. Configure Environment Variables
Update `.env` file with your PostgreSQL credentials:
```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=quickserve
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Run Database Migrations
The application automatically creates tables on first run using `sequelize.sync()`.

### 6. Seed Database
```bash
# Seed kitchen users
npm run seed

# Seed tables with QR codes
node seedTables.js

# Clear menu items (optional)
npm run clear-menu
```

### 7. Start Server
```bash
npm start
# or for development
npm run dev
```

## Key Differences

### ID Fields
- MongoDB uses `_id` (ObjectId)
- PostgreSQL uses `id` (auto-increment INTEGER)
- Frontend code may need updates if it references `_id`

### JSONB vs Arrays
- MongoDB nested documents/arrays are now JSONB in PostgreSQL
- Queries on JSONB fields use different syntax
- Example: `order.items` is now JSONB array

### Timestamps
- Both use `createdAt` and `updatedAt`
- PostgreSQL timestamps are timezone-aware by default

### Decimal Precision
- Prices and amounts use DECIMAL(10, 2) for precise calculations
- No more floating-point arithmetic issues

## Testing Checklist

- [ ] Server starts without errors
- [ ] Database connection successful
- [ ] All routes respond correctly:
  - [ ] `/api/auth/login`
  - [ ] `/api/menu`
  - [ ] `/api/orders`
  - [ ] `/api/users`
  - [ ] `/api/tables`
  - [ ] `/api/ratings`
  - [ ] `/api/analytics`
  - [ ] `/api/payment`
- [ ] Create operations work
- [ ] Read operations work
- [ ] Update operations work
- [ ] Delete operations work
- [ ] Socket.io events function
- [ ] QR code generation works
- [ ] Rating system updates menu items
- [ ] Analytics calculations are correct

## Rollback Plan

If you need to rollback to MongoDB:
1. Restore from your Git commit before migration
2. Reinstall MongoDB dependencies: `npm install mongoose`
3. Update `.env` to use `MONGODB_URI`
4. Restart the server

## Performance Considerations

PostgreSQL benefits:
- Better performance for complex queries
- ACID compliance
- Better support for concurrent writes
- More efficient indexing
- Native JSON support (JSONB)
- Better analytics capabilities

## Troubleshooting

### Connection Errors
- Verify PostgreSQL is running: `pg_isready`
- Check credentials in `.env`
- Ensure database exists: `psql -l`

### Schema Errors
- Drop and recreate database if schema issues occur
- Run `syncDatabase()` to recreate tables

### Query Errors
- Check Sequelize query syntax
- Use `logging: console.log` in database config for debugging
- Verify JSONB queries use correct syntax

## Additional Resources

- [Sequelize Documentation](https://sequelize.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
