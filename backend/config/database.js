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
    max: 10, // Increased for better concurrency
    min: 2, // Keep minimum connections ready
    acquire: 30000,
    idle: 10000,
    evict: 1000, // Evict idle connections faster
    maxUses: 1000 // Recycle connections after 1000 uses
  },
  logging: false, // Set to console.log to see SQL queries
  benchmark: false, // Disable query benchmarking in production for speed
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true // Prevent Sequelize from pluralizing table names
  }
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
