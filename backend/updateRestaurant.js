import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

async function updateRestaurant() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected');

    // First, list all restaurants
    const [allRestaurants] = await sequelize.query(`
      SELECT id, name, slug FROM "Restaurants" ORDER BY id;
    `);
    
    console.log('\n📋 All Restaurants in Database:');
    allRestaurants.forEach(r => {
      console.log(`  ID: ${r.id} | Name: ${r.name} | Slug: ${r.slug}`);
    });

    // Captain1 is assigned to restaurantId=1
    console.log('\n👤 Captain1 is currently assigned to restaurantId=1');

    // Now swap the slugs
    console.log('\n🔄 Swapping slugs between restaurants...');
    
    // Find the restaurant with sourabh-upadhyay slug
    const sourbhRestaurant = allRestaurants.find(r => r.slug === 'sourabh-upadhyay');
    const vivekRestaurant = allRestaurants.find(r => r.slug === 'vivek-singh-bhadoriya');
    
    if (sourbhRestaurant && vivekRestaurant) {
      // Temporarily change sourabh-upadhyay to temp slug
      await sequelize.query(`
        UPDATE "Restaurants" SET slug = 'temp-slug-swap' WHERE slug = 'sourabh-upadhyay';
      `);
      
      // Change vivek to sourabh
      await sequelize.query(`
        UPDATE "Restaurants" SET slug = 'sourabh-upadhyay' WHERE slug = 'vivek-singh-bhadoriya';
      `);
      
      // Change temp to vivek
      await sequelize.query(`
        UPDATE "Restaurants" SET slug = 'vivek-singh-bhadoriya' WHERE slug = 'temp-slug-swap';
      `);
      
      console.log('✓ Slugs swapped successfully!');
    }
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

updateRestaurant();
