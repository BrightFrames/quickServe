import sequelize from './config/database.js';
import User from './models/User.js';
import Restaurant from './models/Restaurant.js';

/**
 * Check kitchen users and their restaurant IDs
 */
async function checkKitchenUsers() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected\n');

    // Get all restaurants
    const restaurants = await Restaurant.findAll();
    console.log(`Found ${restaurants.length} restaurants:\n`);
    
    for (const restaurant of restaurants) {
      console.log(`Restaurant ID ${restaurant.id}: ${restaurant.name} (${restaurant.slug})`);
    }

    console.log('\n' + '═'.repeat(80));
    console.log('KITCHEN USERS:');
    console.log('═'.repeat(80) + '\n');

    // Get all kitchen users
    const kitchenUsers = await User.findAll({
      where: { role: 'kitchen' },
      order: [['restaurantId', 'ASC']]
    });

    if (kitchenUsers.length === 0) {
      console.log('❌ No kitchen users found!\n');
    }

    for (const user of kitchenUsers) {
      const restaurant = await Restaurant.findByPk(user.restaurantId);
      console.log(`Username: ${user.username}`);
      console.log(`User ID: ${user.id}`);
      console.log(`Restaurant ID: ${user.restaurantId}`);
      console.log(`Restaurant Name: ${restaurant ? restaurant.name : 'NOT FOUND'}`);
      console.log(`Restaurant Slug: ${restaurant ? restaurant.slug : 'NOT FOUND'}`);
      console.log(`Online: ${user.isOnline}`);
      console.log('─'.repeat(40) + '\n');
    }

    console.log('═'.repeat(80));
    process.exit(0);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkKitchenUsers();
