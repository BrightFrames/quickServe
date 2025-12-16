import sequelize from '../config/database.js';

async function checkSchema() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connection successful.');

        console.log('Inspecting orders table schema...');

        const [results] = await sequelize.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'items';
    `);

        console.table(results);

    } catch (error) {
        console.error('❌ Error inspecting schema:', error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

checkSchema();
