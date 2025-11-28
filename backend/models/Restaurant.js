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
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  restaurantCode: {
    type: DataTypes.STRING,
    allowNull: false, // Required after migration
    unique: true,
    validate: {
      is: /^QS\d{4}$/i,
    },
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
  gstNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i, // GST format validation
    },
  },
  taxPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 5.00, // Default 5% tax
    validate: {
      min: 0,
      max: 100,
    },
  },
  // Temporarily commented out - column not in database yet
  // customerAccessCode: {
  //   type: DataTypes.STRING,
  //   allowNull: true,
  //   defaultValue: null,
  //   validate: {
  //     len: [4, 10], // 4-10 character code
  //   },
  // },
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
  paymentAccounts: {
    type: DataTypes.JSONB,
    defaultValue: {
      upiId: null,
      phonePeMerchantId: null,
      bankAccount: {
        accountNumber: null,
        ifscCode: null,
        accountHolderName: null,
        bankName: null,
      },
      paytmMerchantId: null,
      razorpayKeyId: null,
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
    {
      unique: true,
      fields: ['slug'],
    },
    {
      unique: true,
      fields: ['restaurantCode'],
    },
  ],
});

// Instance method to compare passwords
Restaurant.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default Restaurant;