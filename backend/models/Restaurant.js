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
  dashboardPassword: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    comment: 'Hashed password for restaurant admin dashboard access (per-restaurant security)',
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
  
  // Cashfree vendor ID for marketplace payments
  // This stores the Cashfree linked account/vendor ID for split settlements
  cashfreeVendorId: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    comment: 'Cashfree marketplace vendor ID for split settlements',
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
      // Set default dashboard password if not provided
      if (!restaurant.dashboardPassword) {
        const salt = await bcrypt.genSalt(10);
        restaurant.dashboardPassword = await bcrypt.hash('admin123', salt);
      } else if (restaurant.dashboardPassword && !restaurant.dashboardPassword.startsWith('$2')) {
        // Hash if provided but not already hashed
        const salt = await bcrypt.genSalt(10);
        restaurant.dashboardPassword = await bcrypt.hash(restaurant.dashboardPassword, salt);
      }
    },
    beforeUpdate: async (restaurant) => {
      if (restaurant.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        restaurant.password = await bcrypt.hash(restaurant.password, salt);
      }
      if (restaurant.changed('dashboardPassword') && restaurant.dashboardPassword) {
        // Only hash if it's not already hashed (doesn't start with bcrypt prefix)
        if (!restaurant.dashboardPassword.startsWith('$2')) {
          const salt = await bcrypt.genSalt(10);
          restaurant.dashboardPassword = await bcrypt.hash(restaurant.dashboardPassword, salt);
        }
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
}, {
  tableName: 'Restaurants', // Explicitly set table name to match database
  timestamps: true,
});

// Instance method to compare passwords
Restaurant.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to compare dashboard password
Restaurant.prototype.compareDashboardPassword = async function (candidatePassword) {
  if (!this.dashboardPassword) {
    // If no dashboard password set, use default
    const defaultHash = await bcrypt.hash('admin123', 10);
    return await bcrypt.compare(candidatePassword, defaultHash);
  }
  return await bcrypt.compare(candidatePassword, this.dashboardPassword);
};

// Instance method to check if using default dashboard password
Restaurant.prototype.isUsingDefaultDashboardPassword = async function () {
  if (!this.dashboardPassword) return true;
  return await bcrypt.compare('admin123', this.dashboardPassword);
};

export default Restaurant;