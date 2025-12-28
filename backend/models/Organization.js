import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Organization = sequelize.define('Organization', {
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
    ownerEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { isEmail: true }
    },
    settings: {
        type: DataTypes.JSONB,
        defaultValue: {
            features: {
                centralMenu: false,
                centralInventory: false
            }
        }
    }
}, {
    timestamps: true,
    tableName: 'organizations'
});

export default Organization;
