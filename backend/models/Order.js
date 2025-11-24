import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import MenuItem from './MenuItem.js';

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  orderNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  tableId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tableNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  customerPhone: {
    type: DataTypes.STRING,
  },
  items: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
  },
  status: {
    type: DataTypes.ENUM('pending', 'preparing', 'prepared', 'delivered', 'cancelled'),
    defaultValue: 'pending',
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'card', 'upi'),
    defaultValue: 'cash',
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'failed'),
    defaultValue: 'pending',
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'orders',
});

export default Order;
