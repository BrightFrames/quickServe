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
    },
    // Add connection timeout and keepalive settings
    connectTimeout: 60000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  },
  pool: {
    max: 10, // Increased for better concurrency
    min: 2, // Keep minimum connections ready
    acquire: 60000, // Increased timeout for acquiring connections
    idle: 10000,
    evict: 1000, // Evict idle connections faster
    maxUses: 1000 // Recycle connections after 1000 uses
  },
  retry: {
    max: 3, // Retry failed operations up to 3 times
    match: [
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/,
      /Connection terminated unexpectedly/,
    ],
  },
  logging: false, // Set to console.log to see SQL queries
  benchmark: false, // Disable query benchmarking in production for speed
  define: {
    timestamps: true,
    underscored: false,
    // Remove freezeTableName to allow explicit tableName in models
    // freezeTableName: true
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
