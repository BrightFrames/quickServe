import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;

async function createDatabase() {
  // Connect to PostgreSQL without specifying a database
  const client = new Client({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD,
    database: 'postgres', // Connect to default postgres database
  });

  try {
    await client.connect();
    console.log('✓ Connected to PostgreSQL');

    // Check if database exists
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      ['quickserve_db']
    );

    if (result.rows.length > 0) {
      console.log('✓ Database "quickserve_db" already exists');
    } else {
      // Create the database
      await client.query('CREATE DATABASE quickserve_db');
      console.log('✓ Database "quickserve_db" created successfully');
    }

    await client.end();
    console.log('\n✓ You can now run: npm start');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createDatabase();
