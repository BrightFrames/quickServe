import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

async function checkAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected');

    const [users] = await sequelize.query(
      `SELECT id, username, role, "restaurantId" FROM users WHERE role = 'admin' OR username = 'admin'`
    );

    console.log('Admin users found:');
    console.log(JSON.stringify(users, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAdmin();
