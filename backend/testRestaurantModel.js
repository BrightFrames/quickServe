import dotenv from 'dotenv';
import Restaurant from './models/Restaurant.js';

dotenv.config();

async function testRestaurantModel() {
  try {
    const slug = 'sourabh-upadhyay';
    
    console.log(`\nSearching using Restaurant model for slug: "${slug}"\n`);
    console.log(`Table name used by model: ${Restaurant.tableName || Restaurant.getTableName()}\n`);
    
    const restaurant = await Restaurant.findOne({
      where: {
        slug: slug.toLowerCase().trim(),
        isActive: true
      }
    });
    
    if (!restaurant) {
      console.log('❌ Restaurant not found via Sequelize model');
      
      // Check all restaurants
      const all = await Restaurant.findAll({ attributes: ['id', 'slug', 'isActive'] });
      console.log('\nAll restaurants in model:');
      all.forEach(r => console.log(`- ID:${r.id} Slug:"${r.slug}" Active:${r.isActive}`));
    } else {
      console.log('✅ Restaurant found!');
      console.log('ID:', restaurant.id);
      console.log('Name:', restaurant.name);
      console.log('Slug:', restaurant.slug);
      console.log('Active:', restaurant.isActive);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testRestaurantModel();
