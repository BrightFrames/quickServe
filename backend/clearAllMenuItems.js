// Clear all menu items from database
import sequelize from './config/database.js';
import MenuItem from './models/MenuItem.js';

async function clearAllMenuItems() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    // Count items before deletion
    const count = await MenuItem.count();
    console.log(`Found ${count} menu items in database`);

    if (count === 0) {
      console.log('No items to delete');
      process.exit(0);
    }

    // Delete all menu items
    const deleted = await MenuItem.destroy({
      where: {},
      truncate: true, // This will reset the auto-increment ID as well
    });

    console.log(`✅ Successfully deleted all menu items`);
    console.log(`Total items removed: ${count}`);
    console.log('\nDatabase is now clean. You can add items fresh for each restaurant.');

    process.exit(0);
  } catch (error) {
    console.error('Error clearing menu items:', error);
    process.exit(1);
  }
}

clearAllMenuItems();
