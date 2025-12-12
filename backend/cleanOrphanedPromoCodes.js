import sequelize from './config/database.js';
import PromoCode from './models/PromoCode.js';
import Restaurant from './models/Restaurant.js';

/**
 * Clean up orphaned promo codes that reference non-existent restaurants
 */
async function cleanOrphanedPromoCodes() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected\n');

    // Find all promo codes with their restaurant IDs
    const promoCodes = await PromoCode.findAll({
      attributes: ['id', 'code', 'restaurantId'],
      raw: true
    });

    console.log(`Found ${promoCodes.length} total promo codes\n`);

    // Find all valid restaurant IDs
    const restaurants = await Restaurant.findAll({
      attributes: ['id'],
      raw: true
    });

    const validRestaurantIds = new Set(restaurants.map(r => r.id));
    console.log(`Valid restaurant IDs: ${Array.from(validRestaurantIds).join(', ') || 'none'}\n`);

    // Find orphaned promo codes
    const orphanedPromoCodes = promoCodes.filter(pc => !validRestaurantIds.has(pc.restaurantId));

    if (orphanedPromoCodes.length === 0) {
      console.log('✅ No orphaned promo codes found!\n');
      process.exit(0);
      return;
    }

    console.log('═'.repeat(80));
    console.log(`Found ${orphanedPromoCodes.length} orphaned promo code(s):`);
    console.log('═'.repeat(80) + '\n');

    for (const pc of orphanedPromoCodes) {
      console.log(`  ID: ${pc.id}, Code: ${pc.code}, RestaurantId: ${pc.restaurantId} (INVALID)`);
    }

    console.log('\n' + '═'.repeat(80));
    console.log('DELETING ORPHANED PROMO CODES...');
    console.log('═'.repeat(80) + '\n');

    // Delete orphaned promo codes
    const orphanedIds = orphanedPromoCodes.map(pc => pc.id);
    const deleted = await PromoCode.destroy({
      where: {
        id: orphanedIds
      }
    });

    console.log(`✅ Successfully deleted ${deleted} orphaned promo code(s)\n`);
    console.log('You can now restart the server with: npm start\n');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanOrphanedPromoCodes();
