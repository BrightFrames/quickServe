// Script to set customer access code for testing
import sequelize from './config/database.js';
import Restaurant from './models/Restaurant.js';

async function setAccessCode() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    // Find the restaurant by slug
    const restaurant = await Restaurant.findOne({
      where: { slug: 'sourabh-upadhyay' }
    });

    if (!restaurant) {
      console.log('Restaurant not found');
      process.exit(1);
    }

    console.log('Found restaurant:', restaurant.name);

    // Set access code
    restaurant.customerAccessCode = '1234';
    await restaurant.save();

    console.log('✅ Access code set to: 1234');
    console.log('Customers will need to enter this code to access the menu');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

setAccessCode();
