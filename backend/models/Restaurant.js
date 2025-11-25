import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';

const Restaurant = sequelize.define('Restaurant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 100],
    },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {
      theme: 'light',
      currency: 'USD',
      timezone: 'UTC',
    },
  },
  subscription: {
    type: DataTypes.JSONB,
    defaultValue: {
      plan: 'free',
      startDate: new Date(),
      endDate: null,
    },
  },
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (restaurant) => {
      if (restaurant.password) {
        const salt = await bcrypt.genSalt(10);
        restaurant.password = await bcrypt.hash(restaurant.password, salt);
      }
    },
    beforeUpdate: async (restaurant) => {
      if (restaurant.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        restaurant.password = await bcrypt.hash(restaurant.password, salt);
      }
    },
  },
  indexes: [
    {
      unique: true,
      fields: ['email'],
    },
  ],
});

// Instance method to compare passwords
Restaurant.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default Restaurant;