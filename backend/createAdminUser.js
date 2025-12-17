import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { Sequelize, DataTypes } from 'sequelize';

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

async function createOrResetAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected');

    const username = 'admin';
    const password = 'admin123';
    const role = 'admin';

    // Check if admin user exists
    let user = await User.findOne({
      where: { username, role: 'admin' }
    });

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (user) {
      // Update existing admin user
      await User.update(
        { password: hashedPassword },
        { where: { id: user.id }, individualHooks: false }
      );
      console.log(`✓ Admin password reset successfully`);
      console.log(`Username: ${username}`);
      console.log(`Password: ${password}`);
    } else {
      // Create new admin user
      user = await User.create({
        username,
        password: hashedPassword,
        role,
        restaurantId: null
      }, {
        hooks: false // Don't trigger hooks since we're already hashing
      });
      console.log(`✓ Admin user created successfully`);
      console.log(`Username: ${username}`);
      console.log(`Password: ${password}`);
    }

    // Verify the password works
    const verifyUser = await User.findByPk(user.id);
    const isMatch = await bcrypt.compare(password, verifyUser.password);
    console.log(`\nVerification: ${isMatch ? '✓ Password matches' : '✗ Password does not match'}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createOrResetAdmin();
