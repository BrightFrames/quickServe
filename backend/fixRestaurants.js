import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL);

async function fixRestaurants() {
  try {
    // Swap the slugs using temporary values to avoid unique constraint violation
    console.log('Fixing restaurant slugs...\n');
    
    // Step 1: Set ID 1 to temporary slug
    await sequelize.query(
      'UPDATE "Restaurants" SET slug = $1 WHERE id = $2',
      { bind: ['temp-slug-1', 1] }
    );
    console.log('✓ Step 1: ID 1 → temp-slug-1');
    
    // Step 2: Set ID 2 to temporary slug
    await sequelize.query(
      'UPDATE "Restaurants" SET slug = $1 WHERE id = $2',
      { bind: ['temp-slug-2', 2] }
    );
    console.log('✓ Step 2: ID 2 → temp-slug-2');
    
    // Step 3: ID 1 (Vivek) should have vivek-singh-bhadoriya slug
    await sequelize.query(
      'UPDATE "Restaurants" SET slug = $1 WHERE id = $2',
      { bind: ['vivek-singh-bhadoriya', 1] }
    );
    console.log('✓ Step 3: ID 1 (Vivek) → vivek-singh-bhadoriya');
    
    // Step 4: ID 2 (Sourabh) should have sourabh-upadhyay slug
    await sequelize.query(
      'UPDATE "Restaurants" SET slug = $1 WHERE id = $2',
      { bind: ['sourabh-upadhyay', 2] }
    );
    console.log('✓ Step 4: ID 2 (Sourabh) → sourabh-upadhyay');
    
    // Verify the changes
    const restaurants = await sequelize.query(
      'SELECT id, name, slug, "restaurantCode" FROM "Restaurants" WHERE id IN (1, 2) ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    console.log('\n=== UPDATED RESTAURANTS ===\n');
    restaurants.forEach(r => {
      console.log(`ID: ${r.id} | Name: ${r.name} | Slug: ${r.slug} | Code: ${r.restaurantCode}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixRestaurants();
