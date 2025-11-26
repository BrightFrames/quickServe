import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Use Supabase PostgreSQL for production/shared development
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Required for Supabase
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: false, // Set to console.log to see SQL queries
});

export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully (Supabase PostgreSQL).');
    return true;
  } catch (error) {
    console.error('Unable to connect to database:', error);
    console.error('\n⚠️  Connection failed. Please check:');
    console.error('1. Your internet connection');
    console.error('2. Supabase project is not paused (visit https://supabase.com/dashboard)');
    console.error('3. DATABASE_URL in .env is correct');
    return false;
  }
};

export const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('✓ Database synchronized successfully.');
  } catch (error) {
    console.error('Error synchronizing database:', error);
  }
};

export default sequelize;
