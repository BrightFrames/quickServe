import bcrypt from 'bcryptjs';
import sequelize from './config/database.js';
import User from './models/User.js';
import Restaurant from './models/Restaurant.js';

/**
 * Create separate captain accounts for each restaurant
 */
async function createCaptains() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected');

    // Get all restaurants
    const restaurants = await Restaurant.findAll();
    console.log(`\nFound ${restaurants.length} restaurants:\n`);

    for (const restaurant of restaurants) {
      console.log(`Restaurant ID ${restaurant.id}: ${restaurant.name} (${restaurant.slug})`);
      
      // Create captain username based on slug or ID
      const captainUsername = `captain_${restaurant.slug.replace(/-/g, '_')}`;
      const captainPassword = 'captain123'; // Default password
      
      // Check if captain already exists
      const existingCaptain = await User.findOne({
        where: {
          restaurantId: restaurant.id,
          role: 'captain'
        }
      });

      if (existingCaptain) {
        console.log(`  ✓ Captain already exists: ${existingCaptain.username}`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(captainPassword, 10);

      // Create captain
      const captain = await User.create({
        username: captainUsername,
        password: hashedPassword,
        role: 'captain',
        restaurantId: restaurant.id,
        isOnline: false,
        lastActive: new Date()
      });

      console.log(`  ✓ Created captain: ${captain.username} (password: ${captainPassword})`);
    }

    // Show all captains
    console.log('\n📋 All Captains:');
    console.log('═'.repeat(80));
    
    const captains = await User.findAll({
      where: { role: 'captain' }
    });

    for (const captain of captains) {
      const restaurant = await Restaurant.findByPk(captain.restaurantId);
      console.log(`
Username: ${captain.username}
Password: captain123 (default)
Restaurant: ${restaurant.name} (ID: ${restaurant.id})
Login URL: http://localhost:8080/${restaurant.slug}/captain/login
      `);
    }

    console.log('═'.repeat(80));
    console.log('✓ Captain accounts setup complete!');
    process.exit(0);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createCaptains();
