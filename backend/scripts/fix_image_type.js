import sequelize from '../config/database.js';

async function fixColumn() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connection successful.');

        console.log('Altering image column to TEXT...');
        await sequelize.query('ALTER TABLE "menu_items" ALTER COLUMN "image" TYPE TEXT;');

        console.log('✅ Successfully updated image column to TEXT.');
    } catch (error) {
        console.error('❌ Error updating column:', error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

fixColumn();
