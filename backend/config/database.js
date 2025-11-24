import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Support both DATABASE_URL (single connection string) and individual parameters
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false, // Set to console.log to see SQL queries
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    })
  : new Sequelize(
      process.env.POSTGRES_DB || 'quickserve',
      process.env.POSTGRES_USER || 'postgres',
      process.env.POSTGRES_PASSWORD,
      {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: process.env.POSTGRES_PORT || 5432,
        dialect: 'postgres',
        logging: false, // Set to console.log to see SQL queries
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
      }
    );

export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connection established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to PostgreSQL:', error);
    return false;
  }
};

export const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Error synchronizing database:', error);
  }
};

export default sequelize;
