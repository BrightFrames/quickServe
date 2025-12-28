import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const InventoryItem = sequelize.define('InventoryItem', {
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
    menuItemId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Can be null if tracking ingredients not linked to menu items (future)
        references: {
            model: 'menu_items',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    currentStock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    lowStockThreshold: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
    },
    unit: {
        type: DataTypes.STRING, // e.g., 'count', 'kg', 'ltr'
        allowNull: false,
        defaultValue: 'count',
    },
    batchNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Optional batch number for tracking expiration etc.',
    },
    status: {
        type: DataTypes.ENUM('in_stock', 'low_stock', 'out_of_stock'),
        defaultValue: 'in_stock',
    },
    lastUpdatedBy: {
        type: DataTypes.INTEGER, // User ID
        allowNull: true,
    },
}, {
    timestamps: true,
    tableName: 'inventory_items',
    indexes: [
        {
            fields: ['restaurantId', 'menuItemId'],
            unique: true, // Ensure one inventory record per menu item per restaurant
        },
        {
            fields: ['restaurantId', 'status'],
        }
    ],
    hooks: {
        beforeSave: (item) => {
            if (item.currentStock <= 0) {
                item.status = 'out_of_stock';
            } else if (item.currentStock <= item.lowStockThreshold) {
                item.status = 'low_stock';
            } else {
                item.status = 'in_stock';
            }
        }
    }
});

export default InventoryItem;
