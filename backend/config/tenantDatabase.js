// Multi-tenant database configuration with separate schemas per restaurant
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in .env file');
}

// Main database connection (public schema)
const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

// Store tenant connections
const tenantConnections = new Map();

/**
 * Get or create a tenant-specific database connection
 * Each restaurant gets its own schema for complete data isolation
 */
export async function getTenantConnection(restaurantSlug) {
  if (!restaurantSlug) {
    throw new Error('Restaurant slug is required for tenant connection');
  }

  // Return existing connection if already created
  if (tenantConnections.has(restaurantSlug)) {
    return tenantConnections.get(restaurantSlug);
  }

  // Create new connection with restaurant-specific schema
  const schemaName = `tenant_${restaurantSlug.replace(/-/g, '_')}`;
  
  const tenantSequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    schema: schemaName,
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  });

  // Store connection
  tenantConnections.set(restaurantSlug, tenantSequelize);

  return tenantSequelize;
}

/**
 * Create schema for a new restaurant tenant
 */
export async function createTenantSchema(restaurantSlug) {
  const schemaName = `tenant_${restaurantSlug.replace(/-/g, '_')}`;
  
  try {
    // Create schema if it doesn't exist
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    console.log(`✓ Schema created for tenant: ${schemaName}`);
    
    // Get tenant connection
    const tenantDb = await getTenantConnection(restaurantSlug);
    
    // Test connection
    await tenantDb.authenticate();
    console.log(`✓ Tenant database connection established for: ${restaurantSlug}`);
    
    return tenantDb;
  } catch (error) {
    console.error(`Failed to create schema for ${restaurantSlug}:`, error);
    throw error;
  }
}

/**
 * Initialize tenant database with tables
 */
export async function initializeTenantDatabase(restaurantSlug, tenantDb) {
  try {
    // Import models dynamically for this tenant
    const { default: MenuItem } = await import('../models/MenuItem.js');
    const { default: Order } = await import('../models/Order.js');
    const { default: Table } = await import('../models/Table.js');
    const { default: User } = await import('../models/User.js');
    const { default: Rating } = await import('../models/Rating.js');

    // Initialize models with tenant connection
    const TenantMenuItem = MenuItem.init(MenuItem.rawAttributes, { sequelize: tenantDb });
    const TenantOrder = Order.init(Order.rawAttributes, { sequelize: tenantDb });
    const TenantTable = Table.init(Table.rawAttributes, { sequelize: tenantDb });
    const TenantUser = User.init(User.rawAttributes, { sequelize: tenantDb });
    const TenantRating = Rating.init(Rating.rawAttributes, { sequelize: tenantDb });

    // Setup associations
    TenantOrder.belongsTo(TenantMenuItem, { foreignKey: 'menuItemId' });
    TenantRating.belongsTo(TenantOrder, { foreignKey: 'orderId' });

    // Sync database
    await tenantDb.sync({ alter: true });
    console.log(`✓ Tenant database tables created for: ${restaurantSlug}`);

    return {
      MenuItem: TenantMenuItem,
      Order: TenantOrder,
      Table: TenantTable,
      User: TenantUser,
      Rating: TenantRating,
    };
  } catch (error) {
    console.error(`Failed to initialize tenant database for ${restaurantSlug}:`, error);
    throw error;
  }
}

/**
 * Get tenant models for a restaurant
 */
export async function getTenantModels(restaurantSlug) {
  const tenantDb = await getTenantConnection(restaurantSlug);
  
  // Check if models are already defined
  if (tenantDb.models && Object.keys(tenantDb.models).length > 0) {
    return tenantDb.models;
  }

  // Initialize models
  return await initializeTenantDatabase(restaurantSlug, tenantDb);
}

/**
 * Delete tenant schema and all data
 */
export async function deleteTenantSchema(restaurantSlug) {
  const schemaName = `tenant_${restaurantSlug.replace(/-/g, '_')}`;
  
  try {
    // Close connection if exists
    if (tenantConnections.has(restaurantSlug)) {
      await tenantConnections.get(restaurantSlug).close();
      tenantConnections.delete(restaurantSlug);
    }

    // Drop schema with CASCADE to remove all tables
    await sequelize.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    console.log(`✓ Schema deleted for tenant: ${schemaName}`);
  } catch (error) {
    console.error(`Failed to delete schema for ${restaurantSlug}:`, error);
    throw error;
  }
}

// Test main database connection
export async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✓ Main database connection established successfully (Supabase PostgreSQL).');
    return true;
  } catch (error) {
    console.error('✗ Unable to connect to the main database:', error.message);
    return false;
  }
}

// Sync main database (only Restaurant table stays in public schema)
export async function syncDatabase() {
  try {
    // Only sync Restaurant model in public schema
    // All other models will be in tenant schemas
    await sequelize.sync({ alter: true });
    console.log('✓ Main database synchronized successfully.');
  } catch (error) {
    console.error('✗ Failed to sync main database:', error.message);
    throw error;
  }
}

// Close all connections
export async function closeAllConnections() {
  try {
    // Close tenant connections
    for (const [slug, connection] of tenantConnections.entries()) {
      await connection.close();
      console.log(`✓ Closed tenant connection: ${slug}`);
    }
    tenantConnections.clear();

    // Close main connection
    await sequelize.close();
    console.log('✓ All database connections closed');
  } catch (error) {
    console.error('Failed to close connections:', error);
  }
}

export default sequelize;
