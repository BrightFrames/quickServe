import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { Sequelize, DataTypes } from 'sequelize';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

const Restaurant = sequelize.define('Restaurant', {
  name: DataTypes.STRING,
  slug: DataTypes.STRING,
  password: DataTypes.STRING,
  dashboardPassword: DataTypes.STRING,
}, {
  timestamps: true,
  tableName: 'Restaurants',
});

async function testPassword() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected');

    const restaurant = await Restaurant.findOne({
      where: { slug: 'sourabh-upadhyay' }
    });

    if (!restaurant) {
      console.log('✗ Restaurant not found');
      process.exit(1);
    }

    console.log(`\nRestaurant: ${restaurant.name}`);
    console.log(`Slug: ${restaurant.slug}`);
    console.log(`Dashboard Password Hash: ${restaurant.dashboardPassword ? restaurant.dashboardPassword.substring(0, 30) + '...' : 'NULL'}`);

    // Test password
    const testPassword = 'admin123';
    
    if (restaurant.dashboardPassword) {
      const isMatch = await bcrypt.compare(testPassword, restaurant.dashboardPassword);
      console.log(`\nTesting password "${testPassword}": ${isMatch ? '✓ MATCH' : '✗ NO MATCH'}`);
    } else {
      console.log(`\n⚠ Dashboard password is NULL in database`);
    }

    // Also test registration password
    const isRegistrationMatch = await bcrypt.compare(testPassword, restaurant.password);
    console.log(`Testing against registration password: ${isRegistrationMatch ? '✓ MATCH' : '✗ NO MATCH'}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testPassword();
