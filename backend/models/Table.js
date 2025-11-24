import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Table = sequelize.define('Table', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tableId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  tableName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  seats: {
    type: DataTypes.INTEGER,
    defaultValue: 4,
  },
  qrCode: {
    type: DataTypes.TEXT,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  location: {
    type: DataTypes.STRING,
  },
}, {
  timestamps: true,
  tableName: 'tables',
});

export default Table;
