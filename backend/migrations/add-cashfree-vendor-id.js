/**
 * Migration: Add cashfreeVendorId to Restaurants table
 * 
 * This migration adds the Cashfree marketplace vendor ID field to support
 * split settlements with 1% platform commission.
 * 
 * Run this migration to enable Cashfree payments:
 * node backend/migrations/add-cashfree-vendor-id.js
 */

import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

async function migrate() {
  console.log('🔄 Starting migration: Add cashfreeVendorId to Restaurants...');

  try {
    // Check if column already exists
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Restaurants' 
      AND column_name = 'cashfreeVendorId';
    `, { type: QueryTypes.SELECT });

    if (results && results.column_name) {
      console.log('⚠️  Column cashfreeVendorId already exists. Skipping migration.');
      return;
    }

    // Add the column
    await sequelize.query(`
      ALTER TABLE "Restaurants" 
      ADD COLUMN "cashfreeVendorId" VARCHAR(255) DEFAULT NULL;
    `);

    console.log('✅ Successfully added cashfreeVendorId column to Restaurants table');
    console.log('📝 Column details:');
    console.log('   - Type: VARCHAR(255)');
    console.log('   - Nullable: true');
    console.log('   - Default: null');
    console.log('   - Purpose: Store Cashfree marketplace vendor ID for split settlements');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run migration
migrate()
  .then(() => {
    console.log('✨ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed with error:', error);
    process.exit(1);
  });
