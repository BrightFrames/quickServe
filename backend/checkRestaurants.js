import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL);

async function checkRestaurants() {
  try {
    const restaurants = await sequelize.query(
      'SELECT id, name, slug, "restaurantCode", email FROM "Restaurants" ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    console.log('\n=== ALL RESTAURANTS IN DATABASE ===\n');
    restaurants.forEach(r => {
      console.log(`ID: ${r.id}`);
      console.log(`Name: ${r.name}`);
      console.log(`Slug: ${r.slug}`);
      console.log(`Code: ${r.restaurantCode}`);
      console.log(`Email: ${r.email}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRestaurants();
