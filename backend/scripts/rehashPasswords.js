/**
 * Password Rehash Script
 * 
 * This script checks for plaintext passwords in the database and rehashes them using bcrypt.
 * Run this ONCE after deploying the password security fixes.
 * 
 * Usage: node rehashPasswords.js
 */

import User from './models/User.js';
import Restaurant from './models/Restaurant.js';
import bcrypt from 'bcryptjs';
import sequelize from './config/database.js';

async function rehashPasswords() {
  console.log('========================================');
  console.log('PASSWORD REHASH SCRIPT');
  console.log('========================================\n');
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connection established\n');

    let totalRehashed = 0;
    let totalChecked = 0;

    // ============================
    // Rehash User passwords
    // ============================
    console.log('[1/2] Checking User table...');
    const users = await User.findAll({
      attributes: ['id', 'username', 'password', 'role', 'restaurantId']
    });
    
    console.log(`Found ${users.length} users to check`);
    
    for (const user of users) {
      totalChecked++;
      
      // Check if password is already hashed (bcrypt hashes start with $2a$ or $2b$)
      const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
      
      if (!isHashed) {
        console.log(`  ⚠️  User ${user.username} (ID: ${user.id}) has plaintext password!`);
        
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        
        // Update without triggering hooks (to avoid double-hashing)
        await user.update(
          { password: hashedPassword },
          { hooks: false }
        );
        
        console.log(`  ✓ Rehashed password for user ${user.username}`);
        totalRehashed++;
      } else {
        console.log(`  ✓ User ${user.username} (ID: ${user.id}) already hashed`);
      }
    }
    
    console.log(`\nUser table: ${totalChecked} checked, ${totalRehashed} rehashed\n`);

    // ============================
    // Rehash Restaurant passwords
    // ============================
    console.log('[2/2] Checking Restaurant table...');
    const restaurants = await Restaurant.findAll({
      attributes: ['id', 'name', 'email', 'password']
    });
    
    console.log(`Found ${restaurants.length} restaurants to check`);
    
    let restaurantsRehashed = 0;
    let restaurantsChecked = 0;
    
    for (const restaurant of restaurants) {
      restaurantsChecked++;
      
      // Check if password is already hashed
      const isHashed = restaurant.password.startsWith('$2a$') || restaurant.password.startsWith('$2b$');
      
      if (!isHashed) {
        console.log(`  ⚠️  Restaurant ${restaurant.name} (ID: ${restaurant.id}) has plaintext password!`);
        
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(restaurant.password, salt);
        
        // Update without triggering hooks
        await restaurant.update(
          { password: hashedPassword },
          { hooks: false }
        );
        
        console.log(`  ✓ Rehashed password for restaurant ${restaurant.name}`);
        restaurantsRehashed++;
      } else {
        console.log(`  ✓ Restaurant ${restaurant.name} (ID: ${restaurant.id}) already hashed`);
      }
    }
    
    console.log(`\nRestaurant table: ${restaurantsChecked} checked, ${restaurantsRehashed} rehashed\n`);

    // ============================
    // Summary
    // ============================
    console.log('========================================');
    console.log('SUMMARY');
    console.log('========================================');
    console.log(`Total records checked: ${totalChecked + restaurantsChecked}`);
    console.log(`Total passwords rehashed: ${totalRehashed + restaurantsRehashed}`);
    console.log('========================================\n');

    if (totalRehashed + restaurantsRehashed === 0) {
      console.log('✅ All passwords are already hashed! No action needed.');
    } else {
      console.log(`✅ Successfully rehashed ${totalRehashed + restaurantsRehashed} passwords!`);
      console.log('\n⚠️  IMPORTANT: Users with rehashed passwords will need to use their');
      console.log('   original passwords to login (the ones that were just hashed).');
    }

  } catch (error) {
    console.error('\n❌ Error during password rehash:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Close database connection
    await sequelize.close();
    console.log('\n✓ Database connection closed');
  }
}

// Run the script
console.log('\n⚠️  WARNING: This script will modify password data in the database.');
console.log('Make sure you have a backup before proceeding!\n');

// Add a 3-second delay to allow user to cancel
console.log('Starting in 3 seconds... (Press Ctrl+C to cancel)');
setTimeout(() => {
  rehashPasswords()
    .then(() => {
      console.log('\n✅ Password rehash completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Failed to rehash passwords:', error);
      process.exit(1);
    });
}, 3000);
