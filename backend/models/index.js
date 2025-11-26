import Restaurant from './Restaurant.js';
import MenuItem from './MenuItem.js';
import Order from './Order.js';
import Table from './Table.js';
import User from './User.js';
import Rating from './Rating.js';

// Define all relationships
export function setupAssociations() {
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

  console.log('✓ Database associations configured');
}

export { Restaurant, MenuItem, Order, Table, User, Rating };
