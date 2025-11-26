import sequelize from './config/database.js';

async function migrateToMultiTenant() {
  try {
    console.log('Starting multi-tenant migration...');
    await sequelize.authenticate();
    console.log('✓ Database connected');

    // Get all restaurants
    const restaurants = await sequelize.query(
      'SELECT id, name, slug FROM "Restaurants" ORDER BY id',
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log(`Found ${restaurants.length} restaurants`);

    if (restaurants.length === 0) {
      console.log('No restaurants found. Migration complete.');
      process.exit(0);
    }

    // Use the first restaurant for existing data
    const defaultRestaurant = restaurants[0];
    console.log(`\nUsing "${defaultRestaurant.name}" (ID: ${defaultRestaurant.id}) as default restaurant for existing data`);

    // Add restaurantId columns if they don't exist
    const tables = ['menu_items', 'orders', 'tables', 'users', 'ratings'];
    
    for (const table of tables) {
      try {
        // Check if column exists
        const [results] = await sequelize.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = '${table}' AND column_name = 'restaurantId'
        `);

        if (results.length === 0) {
          console.log(`\nAdding restaurantId to ${table}...`);
          
          // Add column as nullable first
          await sequelize.query(`
            ALTER TABLE "${table}" 
            ADD COLUMN "restaurantId" INTEGER;
          `);
          
          // Update all existing rows with default restaurant ID
          const [updateResult] = await sequelize.query(`
            UPDATE "${table}" 
            SET "restaurantId" = ${defaultRestaurant.id}
            WHERE "restaurantId" IS NULL;
          `);
          
          console.log(`✓ Updated ${table}`);
          
          // Make column NOT NULL
          await sequelize.query(`
            ALTER TABLE "${table}" 
            ALTER COLUMN "restaurantId" SET NOT NULL;
          `);
          
          // Add foreign key constraint
          await sequelize.query(`
            ALTER TABLE "${table}"
            ADD CONSTRAINT "fk_${table}_restaurant"
            FOREIGN KEY ("restaurantId") 
            REFERENCES "Restaurants"(id) 
            ON DELETE CASCADE;
          `);
          
          console.log(`✓ Added constraints to ${table}`);
        } else {
          console.log(`✓ ${table} already has restaurantId column`);
        }
      } catch (error) {
        console.error(`Error processing ${table}:`, error.message);
      }
    }

    // Update unique constraints for tables with composite keys
    console.log('\nUpdating unique constraints...');
    
    // Orders: orderNumber should be unique per restaurant
    try {
      await sequelize.query(`
        DROP INDEX IF EXISTS "orders_orderNumber_key";
      `);
      await sequelize.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "orders_restaurant_order_number" 
        ON "orders" ("restaurantId", "orderNumber");
      `);
      console.log('✓ Updated orders unique constraint');
    } catch (error) {
      console.log('Note: Orders constraint update:', error.message);
    }

    // Tables: tableId should be unique per restaurant
    try {
      await sequelize.query(`
        DROP INDEX IF EXISTS "tables_tableId_key";
      `);
      await sequelize.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "tables_restaurant_table_id" 
        ON "tables" ("restaurantId", "tableId");
      `);
      console.log('✓ Updated tables unique constraint');
    } catch (error) {
      console.log('Note: Tables constraint update:', error.message);
    }

    // Users: username should be unique per restaurant
    try {
      await sequelize.query(`
        DROP INDEX IF EXISTS "users_username_key";
      `);
      await sequelize.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "users_restaurant_username" 
        ON "users" ("restaurantId", "username");
      `);
      console.log('✓ Updated users unique constraint');
    } catch (error) {
      console.log('Note: Users constraint update:', error.message);
    }

    console.log('\n✅ Multi-tenant migration completed successfully!');
    console.log('\nSummary:');
    console.log(`- ${restaurants.length} restaurant(s) in database`);
    console.log(`- All existing data assigned to: ${defaultRestaurant.name}`);
    console.log(`- Each restaurant now has isolated data`);
    
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration error:', error);
    process.exit(1);
  }
}

migrateToMultiTenant();
