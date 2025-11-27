// Check if customerEmail column exists in orders table
import sequelize from './config/database.js';
import { QueryTypes } from 'sequelize';

async function checkColumn() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    const [results] = await sequelize.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name='orders' 
       AND column_name='customerEmail';`,
      { type: QueryTypes.SELECT }
    );

    if (results) {
      console.log('✅ customerEmail column exists:', results);
    } else {
      console.log('❌ customerEmail column does NOT exist');
      console.log('Adding column now...');
      
      await sequelize.query(
        `ALTER TABLE "orders" 
         ADD COLUMN "customerEmail" VARCHAR(255) DEFAULT NULL;`
      );
      
      console.log('✅ Successfully added customerEmail column');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkColumn();
