import sequelize from './config/database.js';
import Restaurant from './models/Restaurant.js';

async function addSlugsToExistingRestaurants() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✓ Database connected');

    // First, check if slug column exists
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Restaurants' AND column_name = 'slug'
    `);

    if (results.length === 0) {
      console.log('Adding slug column...');
      // Add slug column as nullable first
      await sequelize.query(`
        ALTER TABLE "Restaurants" 
        ADD COLUMN "slug" VARCHAR(255);
      `);
      console.log('✓ Slug column added');
    }

    // Get all restaurants
    const restaurants = await sequelize.query(
      'SELECT id, name FROM "Restaurants"',
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log(`Found ${restaurants.length} restaurants`);

    // Generate and update slugs for each restaurant
    for (const restaurant of restaurants) {
      let slug = restaurant.name.toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      // Check if slug exists
      let uniqueSlug = slug;
      let counter = 1;
      let existingSlug = await sequelize.query(
        'SELECT id FROM "Restaurants" WHERE slug = :slug AND id != :id',
        {
          replacements: { slug: uniqueSlug, id: restaurant.id },
          type: sequelize.QueryTypes.SELECT
        }
      );

      while (existingSlug.length > 0) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
        existingSlug = await sequelize.query(
          'SELECT id FROM "Restaurants" WHERE slug = :slug AND id != :id',
          {
            replacements: { slug: uniqueSlug, id: restaurant.id },
            type: sequelize.QueryTypes.SELECT
          }
        );
      }

      // Update restaurant with slug
      await sequelize.query(
        'UPDATE "Restaurants" SET slug = :slug WHERE id = :id',
        {
          replacements: { slug: uniqueSlug, id: restaurant.id }
        }
      );

      console.log(`✓ Updated "${restaurant.name}" with slug: ${uniqueSlug}`);
    }

    // Now make slug column NOT NULL and UNIQUE
    console.log('Adding constraints to slug column...');
    await sequelize.query(`
      ALTER TABLE "Restaurants" 
      ALTER COLUMN "slug" SET NOT NULL;
    `);
    
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Restaurants_slug" 
      ON "Restaurants" ("slug");
    `);

    console.log('✓ Slug migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

addSlugsToExistingRestaurants();
