import Restaurant from './Restaurant.js';
import MenuItem from './MenuItem.js';
import Order from './Order.js';
import Table from './Table.js';
import User from './User.js';
import Rating from './Rating.js';
import Notification from './Notification.js';
import Bill from './Bill.js';
import InventoryItem from './InventoryItem.js';
import Organization from './Organization.js';

// Define all relationships
export function setupAssociations() {
  // Organization Associations (Phase 4)
  Organization.hasMany(Restaurant, {
    foreignKey: 'organizationId',
    as: 'restaurants'
  });
  Restaurant.belongsTo(Organization, {
    foreignKey: 'organizationId',
    as: 'organization'
  });

  // Restaurant has many MenuItems
  Restaurant.hasMany(MenuItem, {
    foreignKey: 'restaurantId',
    as: 'menuItems',
    onDelete: 'CASCADE',
  });
  MenuItem.belongsTo(Restaurant, {
    foreignKey: 'restaurantId',
    as: 'restaurant',
  });

  // MenuItem has one InventoryItem
  MenuItem.hasOne(InventoryItem, {
    foreignKey: 'menuItemId',
    as: 'inventory',
    onDelete: 'CASCADE',
  });
  InventoryItem.belongsTo(MenuItem, {
    foreignKey: 'menuItemId',
    as: 'menuItem',
  });

  // Restaurant has many InventoryItems
  Restaurant.hasMany(InventoryItem, {
    foreignKey: 'restaurantId',
    as: 'inventoryItems',
    onDelete: 'CASCADE',
  });
  InventoryItem.belongsTo(Restaurant, {
    foreignKey: 'restaurantId',
    as: 'restaurant',
  });

  // Restaurant has many Orders
  Restaurant.hasMany(Order, {
    foreignKey: 'restaurantId',
    as: 'orders',
    onDelete: 'CASCADE',
  });
  Order.belongsTo(Restaurant, {
    foreignKey: 'restaurantId',
    as: 'restaurant',
  });

  // Restaurant has many Bills
  Restaurant.hasMany(Bill, {
    foreignKey: 'restaurantId',
    as: 'bills',
    onDelete: 'CASCADE',
  });
  Bill.belongsTo(Restaurant, {
    foreignKey: 'restaurantId',
    as: 'restaurant',
  });

  // Restaurant has many Tables
  Restaurant.hasMany(Table, {
    foreignKey: 'restaurantId',
    as: 'tables',
    onDelete: 'CASCADE',
  });
  Table.belongsTo(Restaurant, {
    foreignKey: 'restaurantId',
    as: 'restaurant',
  });

  // Restaurant has many Users (kitchen staff)
  Restaurant.hasMany(User, {
    foreignKey: 'restaurantId',
    as: 'users',
    onDelete: 'CASCADE',
  });
  User.belongsTo(Restaurant, {
    foreignKey: 'restaurantId',
    as: 'restaurant',
  });

  // Restaurant has many Ratings
  Restaurant.hasMany(Rating, {
    foreignKey: 'restaurantId',
    as: 'ratings',
    onDelete: 'CASCADE',
  });
  Rating.belongsTo(Restaurant, {
    foreignKey: 'restaurantId',
    as: 'restaurant',
  });

  // Restaurant has many Notifications
  Restaurant.hasMany(Notification, {
    foreignKey: 'restaurantId',
    as: 'notifications',
    onDelete: 'CASCADE',
  });
  Notification.belongsTo(Restaurant, {
    foreignKey: 'restaurantId',
    as: 'restaurant',
  });

  console.log('✓ Database associations configured');
}

export { Restaurant, MenuItem, Order, Table, User, Rating, Notification, Bill, InventoryItem, Organization };
