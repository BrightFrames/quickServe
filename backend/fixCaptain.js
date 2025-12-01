import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL);

async function fixCaptain() {
  try {
    console.log('Checking captain assignments...\n');
    
    // Check current captain assignments
    const captains = await sequelize.query(
      'SELECT id, username, "restaurantId", role FROM "Users" WHERE role = $1 ORDER BY id',
      { bind: ['captain'], type: Sequelize.QueryTypes.SELECT }
    );
    
    console.log('=== CURRENT CAPTAINS ===\n');
    captains.forEach(c => {
      console.log(`ID: ${c.id} | Username: ${c.username} | RestaurantId: ${c.restaurantId}`);
    });
    
    // Update captain1 to restaurant ID 2 (Sourabh)
    console.log('\nUpdating captain1 to restaurant ID 2 (Sourabh Upadhyay)...');
    await sequelize.query(
      'UPDATE "Users" SET "restaurantId" = $1 WHERE username = $2 AND role = $3',
      { bind: [2, 'captain1', 'captain'] }
    );
    console.log('✓ Updated captain1');
    
    // Verify the change
    const updated = await sequelize.query(
      'SELECT id, username, "restaurantId", role FROM "Users" WHERE username = $1',
      { bind: ['captain1'], type: Sequelize.QueryTypes.SELECT }
    );
    
    console.log('\n=== UPDATED CAPTAIN ===\n');
    updated.forEach(c => {
      console.log(`ID: ${c.id} | Username: ${c.username} | RestaurantId: ${c.restaurantId}`);
    });
    
    // Show restaurant mapping
    const restaurants = await sequelize.query(
      'SELECT id, name, slug FROM "Restaurants" WHERE id IN (1, 2)',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    console.log('\n=== RESTAURANT MAPPING ===\n');
    restaurants.forEach(r => {
      console.log(`ID: ${r.id} | Name: ${r.name} | Slug: ${r.slug}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixCaptain();
