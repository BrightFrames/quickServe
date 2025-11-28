// Check existing users in User table
import sequelize from './config/database.js';
import User from './models/User.js';

async function listUsers() {
  try {
    await sequelize.authenticate();
    console.log('Database connected\n');

    const users = await User.findAll({
      attributes: ['id', 'username', 'role', 'restaurantId', 'isOnline', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    if (users.length === 0) {
      console.log('❌ No kitchen/cook users found in database');
      console.log('\nTo create kitchen staff:');
      console.log('1. Login to Admin dashboard');
      console.log('2. Go to User Management');
      console.log('3. Add Kitchen Staff with username & password');
      console.log('\nAdmin credentials (from .env):');
      console.log(`   Username: ${process.env.ADMIN_USERNAME}`);
      console.log(`   Password: ${process.env.ADMIN_PASSWORD}`);
      console.log('   These should ONLY work for Admin login, not Kitchen login');
    } else {
      console.log(`Found ${users.length} user(s):\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Restaurant ID: ${user.restaurantId}`);
        console.log(`   Status: ${user.isOnline ? '🟢 Online' : '⚫ Offline'}`);
        console.log(`   Created: ${user.createdAt.toLocaleDateString()}\n`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listUsers();
