import sequelize from './config/database.js';
import Restaurant from './models/Restaurant.js';

async function addRestaurantCodes() {
  try {
    console.log('🔄 Starting restaurant code migration...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✓ Database connected');

    // Sync models to add new column
    await sequelize.sync({ alter: true });
    console.log('✓ Database schema updated');

    // Get all restaurants without restaurantCode
    const restaurants = await Restaurant.findAll({
      where: {
        restaurantCode: null
      }
    });

    console.log(`Found ${restaurants.length} restaurants without codes`);

    const usedCodes = new Set();

    // Generate unique codes for each restaurant
    for (const restaurant of restaurants) {
      let restaurantCode;
      let isUnique = false;

      while (!isUnique) {
        // Generate random 4-digit number
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        restaurantCode = `QS${randomNum}`;

        // Check if code is already used in this batch or database
        if (!usedCodes.has(restaurantCode)) {
          const existing = await Restaurant.findOne({
            where: { restaurantCode }
          });
          
          if (!existing) {
            isUnique = true;
            usedCodes.add(restaurantCode);
          }
        }
      }

      // Update restaurant with new code
      await restaurant.update({ restaurantCode });
      console.log(`✓ Updated ${restaurant.name} with code: ${restaurantCode}`);
    }

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addRestaurantCodes();
