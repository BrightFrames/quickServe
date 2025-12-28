import sequelize from '../config/database.js';
import { Organization, Restaurant } from '../models/index.js';

async function migrateOrganization() {
    try {
        console.log('--- STARTING ORGANIZATION MIGRATION ---');
        await sequelize.authenticate();
        console.log('✓ Database connected');

        // Sync Organization table
        await Organization.sync({ alter: true });
        // Sync Restaurant table (to add organizationId column)
        await Restaurant.sync({ alter: true });
        console.log('✓ Tables Synced');

        // Check if Default Org exists
        let defaultOrg = await Organization.findOne({ where: { slug: 'default-org' } });

        if (!defaultOrg) {
            console.log('Creating Default Organization...');
            // Need a dummy email, ideally from the first restaurant found
            const firstRestaurant = await Restaurant.findOne();
            const ownerEmail = firstRestaurant ? firstRestaurant.email : 'admin@quickserve.com';

            defaultOrg = await Organization.create({
                name: 'Default Organization',
                slug: 'default-org',
                ownerEmail: ownerEmail
            });
            console.log(`✓ Created Default Org (ID: ${defaultOrg.id})`);
        } else {
            console.log(`✓ Default Org exists (ID: ${defaultOrg.id})`);
        }

        // Migrate Orphan Restaurants
        const orphanRestaurants = await Restaurant.findAll({ where: { organizationId: null } });
        console.log(`Found ${orphanRestaurants.length} orphan restaurants.`);

        for (const restaurant of orphanRestaurants) {
            restaurant.organizationId = defaultOrg.id;
            await restaurant.save();
            console.log(`✓ Linked Restaurant '${restaurant.name}' to Org`);
        }

        console.log('--- MIGRATION COMPLETE ---');
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration Failed:', error);
        process.exit(1);
    }
}

migrateOrganization();
