import bcrypt from 'bcryptjs';
import sequelize from './config/database.js';
import User from './models/User.js';
import Restaurant from './models/Restaurant.js';

/**
 * Create separate kitchen accounts for each restaurant
 */
async function fixKitchenUsers() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected\n');

    // Get all restaurants
    const restaurants = await Restaurant.findAll();
    console.log(`Found ${restaurants.length} restaurants:\n`);

    for (const restaurant of restaurants) {
      console.log(`\n📍 Processing Restaurant ID ${restaurant.id}: ${restaurant.name} (${restaurant.slug})`);
      
      // Create kitchen username based on restaurant ID
      const kitchenUsername = `kitchen${restaurant.id}`;
      const kitchenPassword = 'kitchen123'; // Default password
      
      // Check if kitchen user already exists for this restaurant
      let kitchenUser = await User.findOne({
        where: {
          restaurantId: restaurant.id,
          role: 'kitchen'
        }
      });

      if (kitchenUser) {
        console.log(`  ℹ Kitchen user exists: ${kitchenUser.username}`);
        
        // Check if username matches expected pattern
        if (kitchenUser.username !== kitchenUsername) {
          console.log(`  ⚠ Updating username from ${kitchenUser.username} to ${kitchenUsername}`);
          kitchenUser.username = kitchenUsername;
          await kitchenUser.save();
        }
        
        console.log(`  ✓ Kitchen user OK: ${kitchenUser.username}`);
      } else {
        // Hash password
        const hashedPassword = await bcrypt.hash(kitchenPassword, 10);

        // Create kitchen user
        kitchenUser = await User.create({
          username: kitchenUsername,
          password: hashedPassword,
          role: 'kitchen',
          restaurantId: restaurant.id,
          isOnline: false,
          lastActive: new Date()
        });

        console.log(`  ✅ Created kitchen user: ${kitchenUser.username}`);
      }
    }

    // Show all kitchen users
    console.log('\n' + '═'.repeat(80));
    console.log('📋 ALL KITCHEN USERS:');
    console.log('═'.repeat(80) + '\n');
    
    const kitchenUsers = await User.findAll({
      where: { role: 'kitchen' },
      order: [['restaurantId', 'ASC']]
    });

    for (const user of kitchenUsers) {
      const restaurant = await Restaurant.findByPk(user.restaurantId);
      console.log(`Username: ${user.username}`);
      console.log(`Password: kitchen123 (default)`);
      console.log(`Restaurant: ${restaurant.name} (ID: ${restaurant.id})`);
      console.log(`Login URL: http://localhost:8080/${restaurant.slug}/kitchen/login`);
      console.log('─'.repeat(40) + '\n');
    }

    console.log('═'.repeat(80));
    console.log('✅ Kitchen accounts setup complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixKitchenUsers();
