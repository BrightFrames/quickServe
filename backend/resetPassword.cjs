// Simple password reset script (CommonJS)
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { Sequelize, DataTypes } = require('sequelize');

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

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

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await sequelize.query(
      'UPDATE users SET password = :password WHERE id = :id',
      {
        replacements: { password: hashedPassword, id: user.id }
      }
    );

    console.log(`✓ Password reset complete for ${username}`);

    // Verify
    const isMatch = await bcrypt.compare(newPassword, hashedPassword);
    console.log(`Verification: ${isMatch ? '✓ Works' : '✗ Failed'}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

const [,, username, restaurantId, newPassword] = process.argv;

if (!username || !restaurantId || !newPassword) {
  console.log('Usage: node resetPassword.cjs <username> <restaurantId> <newPassword>');
  console.log('Example: node resetPassword.cjs udita1 4 udita123');
  process.exit(1);
}

resetPassword(username, parseInt(restaurantId), newPassword);
