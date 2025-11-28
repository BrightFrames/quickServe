// Script to initialize tenant schema for a restaurant
import { createTenantSchema, getTenantModels } from './config/tenantDatabase.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const restaurantSlug = process.argv[2];

if (!restaurantSlug) {
  console.error('❌ Please provide restaurant slug as argument');
  console.log('Usage: node initTenant.js <restaurant-slug>');
  console.log('Example: node initTenant.js sourabh-upadhyay');
  process.exit(1);
}

async function initTenant() {
  try {
    console.log(`\n🚀 Initializing tenant for: ${restaurantSlug}`);
    console.log('━'.repeat(50));
    
    // Step 1: Create schema
    await createTenantSchema(restaurantSlug);
    
    // Step 2: Initialize models and create tables
    const models = await getTenantModels(restaurantSlug);
    console.log('✓ Tenant models initialized');
    
    // Step 3: Create default kitchen user
    const hashedPassword = await bcrypt.hash('kitchen123', 10);
    await models.User.create({
      name: 'Kitchen Admin',
      username: 'kitchen',
      password: hashedPassword,
      role: 'kitchen',
    });
    console.log('✓ Default kitchen user created (username: kitchen, password: kitchen123)');
    
    console.log('━'.repeat(50));
    console.log(`✅ Tenant initialized successfully for: ${restaurantSlug}\n`);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Tenant initialization failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

initTenant();
