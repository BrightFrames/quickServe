import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PromoCode = sequelize.define('PromoCode', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      isUppercase: true,
    },
    set(value) {
      this.setDataValue('code', value.toUpperCase());
    },
  },
  discountPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: 0,
      max: 100,
    },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  validFrom: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  validTo: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  restaurantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Restaurants',
      key: 'id',
    },
  },
  maxUses: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null, // null means unlimited
  },
  usedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  minOrderAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
  },
}, {
  tableName: 'PromoCodes',
  timestamps: true,
});

// Method to check if promo code is valid
PromoCode.prototype.isValid = function() {
  const now = new Date();
  
  // Check if active
  if (!this.isActive) return false;
  
  // Check date range
  if (this.validFrom && now < this.validFrom) return false;
  if (this.validTo && now > this.validTo) return false;
  
  // Check usage limit
  if (this.maxUses !== null && this.usedCount >= this.maxUses) return false;
  
  return true;
};

export default PromoCode;
