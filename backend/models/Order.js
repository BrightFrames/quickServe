import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import MenuItem from './MenuItem.js';

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  restaurantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Restaurants',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  orderNumber: {
    type: DataTypes.STRING,
    allowNull: false,
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
  customerEmail: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  items: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
  },
  promoCode: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  taxPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  taxAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'),
    defaultValue: 'pending',
    comment: 'Order lifecycle: pending → preparing → ready → served → completed',
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
  paymentProcessedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  paymentProcessedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  orderedBy: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  captainId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'orders',
  indexes: [
    {
      unique: true,
      fields: ['restaurantId', 'orderNumber'],
    },
  ],
});

export default Order;
