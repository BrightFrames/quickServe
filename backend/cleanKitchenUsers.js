import sequelize from './config/database.js';
import User from './models/User.js';

/**
 * Delete duplicate kitchen users
 */
async function cleanKitchenUsers() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected\n');

    // Find all kitchen users
    const kitchenUsers = await User.findAll({
      where: { role: 'kitchen' },
      order: [['id', 'ASC']]
    });

    console.log(`Found ${kitchenUsers.length} kitchen users:\n`);
    
    for (const user of kitchenUsers) {
      console.log(`ID: ${user.id}, Username: ${user.username}, RestaurantId: ${user.restaurantId}`);
    }

    console.log('\n' + '═'.repeat(80));
    console.log('CLEANING UP...');
    console.log('═'.repeat(80) + '\n');

    // Delete ALL kitchen users to start fresh
    const deleted = await User.destroy({
      where: { role: 'kitchen' }
    });

    console.log(`✅ Deleted ${deleted} kitchen user(s)\n`);
    console.log('Now run: node fixKitchenUsers.js');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanKitchenUsers();
