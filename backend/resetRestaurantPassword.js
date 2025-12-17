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

async function resetRestaurantPassword(slug, newPassword) {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected');

    // Find restaurant by slug
    const restaurant = await Restaurant.findOne({
      where: { slug }
    });

    if (!restaurant) {
      console.log(`✗ Restaurant not found with slug: ${slug}`);
      
      // List all restaurants
      const allRestaurants = await Restaurant.findAll({
        attributes: ['id', 'name', 'slug']
      });
      console.log('\nAvailable restaurants:');
      allRestaurants.forEach(r => {
        console.log(`  - ${r.name} (${r.slug})`);
      });
      
      process.exit(1);
    }

    console.log(`Found restaurant: ${restaurant.name}`);

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update dashboardPassword without triggering hooks
    await Restaurant.update(
      { dashboardPassword: hashedPassword },
      { where: { id: restaurant.id }, individualHooks: false }
    );

    console.log(`✓ Dashboard password updated for ${restaurant.name} (${slug})`);
    console.log(`Dashboard Password: ${newPassword}`);

    // Verify the password works
    const updatedRestaurant = await Restaurant.findByPk(restaurant.id);
    const isMatch = await bcrypt.compare(newPassword, updatedRestaurant.dashboardPassword);
    console.log(`\nVerification: ${isMatch ? '✓ Password matches' : '✗ Password does not match'}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Usage: node resetRestaurantPassword.js <slug> <newPassword>
const [,, slug, newPassword] = process.argv;

if (!slug || !newPassword) {
  console.log('Usage: node resetRestaurantPassword.js <slug> <newPassword>');
  console.log('Example: node resetRestaurantPassword.js sourabh-upadhyay admin123');
  process.exit(1);
}

resetRestaurantPassword(slug, newPassword);
