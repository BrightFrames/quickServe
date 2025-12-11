// Script to reset a kitchen user's password
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { Sequelize, DataTypes } from 'sequelize';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

// Simple User model for this script
const User = sequelize.define('User', {
  username: DataTypes.STRING,
  password: DataTypes.STRING,
  role: DataTypes.STRING,
  restaurantId: DataTypes.INTEGER,
}, {
  timestamps: true,
  tableName: 'users',
});

async function resetPassword(username, restaurantId, newPassword) {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected');

    const user = await User.findOne({
      where: { username, restaurantId }
    });

    if (!user) {
      console.log(`✗ User not found: ${username} in restaurant ${restaurantId}`);
      process.exit(1);
    }

    console.log(`Found user: ${user.username} (Role: ${user.role})`);
    console.log(`Old password hash: ${user.password.substring(0, 30)}...`);

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update without triggering hooks
    await User.update(
      { password: hashedPassword },
      { where: { id: user.id }, individualHooks: false }
    );

    console.log(`✓ Password updated for ${username}`);
    console.log(`New password hash: ${hashedPassword.substring(0, 30)}...`);

    // Verify the password works
    const updatedUser = await User.findByPk(user.id);
    const isMatch = await bcrypt.compare(newPassword, updatedUser.password);
    console.log(`Verification: ${isMatch ? '✓ Password matches' : '✗ Password does not match'}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Usage: node resetUserPassword.js <username> <restaurantId> <newPassword>
const [,, username, restaurantId, newPassword] = process.argv;

if (!username || !restaurantId || !newPassword) {
  console.log('Usage: node resetUserPassword.js <username> <restaurantId> <newPassword>');
  console.log('Example: node resetUserPassword.js udita1 4 udita123');
  process.exit(1);
}

resetPassword(username, parseInt(restaurantId), newPassword);
