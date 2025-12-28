import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Bill = sequelize.define('Bill', {
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
    billNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Unique sequential bill identifier per restaurant (e.g., BILL-001)',
    },
    tableId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Optional link to a table (for dine-in)',
    },
    tableNumber: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    orderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Optional link to an existing Order (if bill generated from QR order)',
        references: {
            model: 'orders',
            key: 'id'
        }
    },
    items: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
        comment: 'List of items with name, quantity, price, total',
    },
    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
    },
    taxAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
    },
    discountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
    },
    grandTotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('created', 'paid', 'cancelled'),
        defaultValue: 'created',
    },
    paymentMethod: {
        type: DataTypes.ENUM('cash', 'card', 'upi', 'other', 'split'),
        defaultValue: 'cash',
    },
    customerName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    customerPhone: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    createdBy: {
        type: DataTypes.INTEGER, // User ID (Captain or Admin)
        allowNull: true,
    },
    // Phase 5: Payment Gateway Fields
    transactionId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'External transaction ID from gateway'
    },
    gateway: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Payment provider name (razorpay, stripe, mock)'
    },
    gatewayResponse: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Full metadata from payment provider'
    }
}, {
    timestamps: true,
    tableName: 'bills',
    indexes: [
        {
            fields: ['restaurantId', 'billNumber'], // Ensure uniqueness per restaurant might need logic hook, but index helps
        },
        {
            fields: ['restaurantId', 'status'],
        },
        {
            fields: ['orderId'],
        }
    ],
});

export default Bill;
