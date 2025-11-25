import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Use Supabase PostgreSQL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Required for Supabase
    }
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
