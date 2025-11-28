# Multi-Tenant Architecture Conversion

## Overview
Converted the QuickServe backend from a single-database architecture to a **multi-tenant architecture with PostgreSQL schema-based separation**. Each restaurant now has its own isolated database schema, preventing data conflicts and providing complete isolation.

## Architecture

### Schema Separation
- **Main Database (public schema)**: Only stores `Restaurant` table for tenant lookup
- **Tenant Schemas**: Each restaurant gets a schema named `tenant_{slug}` containing:
  - `MenuItem`
  - `Order`
  - `Table`
  - `User` (kitchen staff)
  - `Rating`

### Benefits
✅ **Complete Data Isolation**: No risk of cross-restaurant data leaks  
✅ **Physical Separation**: Each restaurant's data in separate PostgreSQL schema  
✅ **Better Performance**: Queries scoped to single tenant, no complex filters  
✅ **Clearer Security**: Impossible to accidentally query wrong tenant's data  
✅ **Easy Scaling**: Can move tenant schemas to separate databases later

## Core Infrastructure

### 1. Tenant Database Manager (`backend/config/tenantDatabase.js`)
Manages database lifecycle for each tenant:
- **getTenantConnection(slug)**: Returns cached or creates new Sequelize connection
- **createTenantSchema(slug)**: Creates PostgreSQL schema
- **initializeTenantDatabase(slug, db)**: Sets up models (MenuItem, Order, Table, User, Rating)
- **getTenantModels(slug)**: Returns tenant-specific models for use in routes
- **deleteTenantSchema(slug)**: Cleanup when restaurant removed
- **closeAllConnections()**: Graceful shutdown

### 2. Tenant Middleware (`backend/middleware/tenantMiddleware.js`)
Automatic request routing:
- **extractRestaurantSlug()**: Gets slug from params/query/headers/body
- **tenantMiddleware**: Main middleware, attaches `req.tenant` object
- **requireTenant**: Validation middleware
- **initializeRestaurantTenant(slug)**: Hook for new restaurant creation

**Request Flow**:
```
Request → Extract slug → Fetch Restaurant from main DB → Load tenant models → Attach to req.tenant
```

**req.tenant object**:
```javascript
{
  slug: "sourabh_upadhyay",
  restaurant: Restaurant, // Full restaurant object from main DB
  models: {
    MenuItem: TenantMenuItem,
    Order: TenantOrder,
    Table: TenantTable,
    User: TenantUser,
    Rating: TenantRating
  }
}
```

## Converted Routes

### ✅ Menu Routes (`backend/routes/menu.js`)
- Added: `tenantMiddleware`, `requireTenant`
- All routes use: `req.tenant.models.MenuItem`
- Removed: `restaurantId` filtering (implicit via schema)

**Example**:
```javascript
router.get('/', requireTenant, async (req, res) => {
  const { MenuItem: TenantMenuItem } = req.tenant.models;
  const items = await TenantMenuItem.findAll();
  // Automatically fetches only from tenant_sourabh_upadhyay.menu_items
});
```

### ✅ Orders Routes (`backend/routes/orders.js`)
- Uses: `req.tenant.models.Order`, `MenuItem`, `Table`
- Invoice service uses: `req.tenant.restaurant.id`
- Socket events still emit to all (can be scoped to tenant rooms later)

### ✅ Tables Routes (`backend/routes/tables.js`)
- Uses: `req.tenant.models.Table`
- QR code generation uses: `req.tenant.slug` for URL

### ✅ Users Routes (`backend/routes/users.js`)
- Uses: `req.tenant.models.User`
- Kitchen staff management now tenant-specific

### ✅ Analytics Routes (`backend/routes/analytics.js`)
- Uses: `req.tenant.models.Order`
- Raw SQL queries updated to use: `"${schemaName}".orders`
- Schema name: `tenant_${req.tenant.slug}`

### ✅ Ratings Routes (`backend/routes/ratings.js`)
- Uses: `req.tenant.models.Rating`, `Order`, `MenuItem`
- Rating stats query scoped to tenant schema

## Next Steps

### 🔲 1. Update Restaurant Creation
**File**: `backend/routes/restaurant.js` (or wherever restaurants are created)

Add tenant initialization on restaurant creation:
```javascript
import { initializeRestaurantTenant } from '../middleware/tenantMiddleware.js';

router.post('/register', async (req, res) => {
  // Create restaurant in main DB
  const restaurant = await Restaurant.create({ ... });
  
  // Initialize tenant schema and default kitchen user
  await initializeRestaurantTenant(restaurant.slug);
  
  res.json(restaurant);
});
```

### 🔲 2. Update Auth Routes
**File**: `backend/routes/auth.js`

Kitchen login needs to load tenant models:
```javascript
import { getTenantModels } from '../config/tenantDatabase.js';

router.post('/kitchen/login', async (req, res) => {
  const { username, password, restaurantSlug } = req.body;
  
  // Get tenant models
  const models = await getTenantModels(restaurantSlug);
  const user = await models.User.findOne({ where: { username } });
  
  // Verify password, generate token...
});
```

### 🔲 3. Frontend API Updates
Ensure all API calls include restaurant slug:

**Customer App**: Already includes slug in URL path  
**Admin Dashboard**: Add slug to headers or query params  
**Kitchen Dashboard**: Add slug from login context

### 🔲 4. Data Migration Script
Create script to migrate existing data to tenant schemas:

```javascript
// backend/migrateTenants.js
import { getTenantModels, createTenantSchema, initializeTenantDatabase } from './config/tenantDatabase.js';
import Restaurant from './models/Restaurant.js';
import MenuItem from './models/MenuItem.js'; // Old shared model

async function migrateRestaurants() {
  const restaurants = await Restaurant.findAll();
  
  for (const restaurant of restaurants) {
    console.log(`Migrating ${restaurant.slug}...`);
    
    // Create tenant schema
    await createTenantSchema(restaurant.slug);
    
    // Get tenant models
    const tenantModels = await getTenantModels(restaurant.slug);
    
    // Migrate menu items
    const oldItems = await MenuItem.findAll({ 
      where: { restaurantId: restaurant.id } 
    });
    
    for (const item of oldItems) {
      await tenantModels.MenuItem.create(item.toJSON());
    }
    
    // Migrate orders, tables, users, ratings...
  }
}
```

### 🔲 5. Server Startup Updates
**File**: `backend/server.js`

Add tenant middleware globally or per route group:
```javascript
import { tenantMiddleware } from './middleware/tenantMiddleware.js';

// Apply to API routes (not auth routes)
app.use('/api/menu', tenantMiddleware);
app.use('/api/orders', tenantMiddleware);
app.use('/api/tables', tenantMiddleware);
// etc.
```

### 🔲 6. Socket.IO Tenant Rooms
Update socket events to use tenant rooms:
```javascript
// When emitting new order
io.to(`tenant-${req.tenant.slug}`).emit('new-order', order);

// When kitchen connects
socket.join(`tenant-${restaurantSlug}`);
```

## Testing Plan

1. **Create New Restaurant**:
   - Verify schema created: `tenant_restaurantslug`
   - Verify default kitchen1 user created
   - Verify tables created in tenant schema

2. **Add Menu Items**:
   - Create items in Restaurant A
   - Create items in Restaurant B with same names
   - Verify no conflicts, items isolated

3. **Place Orders**:
   - Place order in Restaurant A
   - Place order in Restaurant B
   - Verify order numbers independent per restaurant
   - Verify inventory updates only affect own restaurant

4. **Kitchen Dashboard**:
   - Login as kitchen1 for Restaurant A
   - Verify only sees Restaurant A's orders
   - Login as kitchen1 for Restaurant B
   - Verify only sees Restaurant B's orders

5. **Analytics**:
   - Generate analytics for Restaurant A
   - Generate analytics for Restaurant B
   - Verify revenue, orders, popular items all separate

## Rollback Plan

If issues occur, rollback steps:
1. Comment out `router.use(tenantMiddleware)` in converted route files
2. Restore direct model imports
3. Re-add `restaurantId` filters to queries
4. Keep tenant schemas for future migration

## Performance Considerations

- **Connection Pooling**: Map stores tenant connections, reused across requests
- **Schema Creation**: One-time cost when restaurant created
- **Query Performance**: Better than shared tables (no restaurantId filter overhead)
- **Memory**: Minimal - one connection per active tenant

## Security Benefits

- **SQL Injection Protection**: Schema name validated against Restaurant table
- **No Cross-Tenant Queries**: Physically impossible to leak data
- **Audit Trail**: Each schema has separate migration history
- **Access Control**: Can grant/revoke schema permissions per tenant

## Monitoring & Logs

All operations log tenant context:
```
[TENANT] Request routed to: Sourabh's Restaurant (sourabh_upadhyay)
[MENU] Retrieved 15 items for sourabh_upadhyay
[ORDERS] ✓ Order saved for sourabh_upadhyay: ORD00001
[ANALYTICS] Generated analytics for sourabh_upadhyay
```

## Documentation

- **Tenant Database Manager**: `backend/config/tenantDatabase.js` (comments)
- **Tenant Middleware**: `backend/middleware/tenantMiddleware.js` (comments)
- **This Document**: `backend/MULTI_TENANT_CONVERSION.md`

---

## Status: 🟡 Partial Implementation (60% Complete)

**Completed**:
- ✅ Core infrastructure (tenantDatabase.js, tenantMiddleware.js)
- ✅ Menu routes converted
- ✅ Orders routes converted
- ✅ Tables routes converted
- ✅ Users routes converted
- ✅ Analytics routes converted
- ✅ Ratings routes converted

**Pending**:
- ❌ Restaurant creation hook
- ❌ Auth routes tenant loading
- ❌ Frontend slug passing
- ❌ Data migration script
- ❌ Server startup integration
- ❌ Socket.IO tenant rooms
- ❌ Testing

**Next Action**: Add restaurant creation hook to initialize tenant schemas automatically when new restaurants sign up.
