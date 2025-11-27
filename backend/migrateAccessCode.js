// Migration to add customerAccessCode column to Restaurants table
import sequelize from './config/database.js';
import { QueryTypes } from 'sequelize';

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    // Check if column already exists
    const [results] = await sequelize.query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name='Restaurants' 
       AND column_name='customerAccessCode';`,
      { type: QueryTypes.SELECT }
    );

    if (results) {
      console.log('Column customerAccessCode already exists');
      process.exit(0);
    }

    // Add the column
    await sequelize.query(
      `ALTER TABLE "Restaurants" 
       ADD COLUMN "customerAccessCode" VARCHAR(255) DEFAULT NULL;`
    );

    console.log('✅ Successfully added customerAccessCode column');
    console.log('Restaurants can now set access codes for customer authentication');

    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();
