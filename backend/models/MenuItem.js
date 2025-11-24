import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MenuItem = sequelize.define('MenuItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isVegetarian: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  image: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  inventoryCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  lowStockThreshold: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
  },
  averageRating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5,
    },
  },
  totalRatings: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  ratingSum: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  timestamps: true,
  tableName: 'menu_items',
});

export default MenuItem;
