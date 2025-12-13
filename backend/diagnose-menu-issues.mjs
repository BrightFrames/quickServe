import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.yjtoccguzdfzxmfhunbh:Sourabh@123@aws-1-ap-south-1.pooler.supabase.com:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function diagnoseMenuIssues() {
  try {
    await client.connect();
    console.log('✓ Connected to database\n');
    
    // 1. Check all restaurants
    console.log('========== RESTAURANTS ==========');
    const restaurants = await client.query(`
      SELECT id, name, slug, "isActive"
      FROM "Restaurants"
      ORDER BY id
    `);
    
    restaurants.rows.forEach(r => {
      console.log(`  ID: ${r.id} | Name: ${r.name} | Slug: ${r.slug} | Active: ${r.isActive}`);
    });
    
    // 2. Check ALL menu items
    console.log('\n========== ALL MENU ITEMS ==========');
    const allItems = await client.query(`
      SELECT 
        m.id, 
        m.name, 
        m."restaurantId",
        m.available,
        m."inventoryCount",
        r.name as restaurant_name,
        r.slug as restaurant_slug
      FROM menu_items m
      LEFT JOIN "Restaurants" r ON m."restaurantId" = r.id
      ORDER BY m."restaurantId", m.id
    `);
    
    console.log(`Total menu items: ${allItems.rows.length}\n`);
    
    const itemsByRestaurant = {};
    allItems.rows.forEach(item => {
      if (!itemsByRestaurant[item.restaurantId]) {
        itemsByRestaurant[item.restaurantId] = [];
      }
      itemsByRestaurant[item.restaurantId].push(item);
    });
    
    // 3. Analyze by restaurant
    Object.entries(itemsByRestaurant).forEach(([restaurantId, items]) => {
      const restaurant = items[0];
      console.log(`\n--- Restaurant ID: ${restaurantId} (${restaurant.restaurant_name || 'UNKNOWN'}) ---`);
      console.log(`    Slug: ${restaurant.restaurant_slug || 'N/A'}`);
      console.log(`    Total items: ${items.length}`);
      
      items.forEach((item, idx) => {
        const availStatus = item.available ? '✓' : '✗';
        const stockStatus = item.inventoryCount > 0 ? `Stock: ${item.inventoryCount}` : '⚠️ OUT OF STOCK';
        console.log(`      ${idx + 1}. ${availStatus} ${item.name} (ID: ${item.id}) - ${stockStatus}`);
      });
      
      const availableCount = items.filter(i => i.available).length;
      const inStockCount = items.filter(i => i.inventoryCount > 0).length;
      console.log(`    Available for customers: ${availableCount}/${items.length}`);
      console.log(`    In stock: ${inStockCount}/${items.length}`);
    });
    
    // 4. Identify issues
    console.log('\n========== ISSUES FOUND ==========');
    const issues = [];
    
    // Issue 1: Items with available=false
    const unavailableItems = allItems.rows.filter(i => !i.available);
    if (unavailableItems.length > 0) {
      console.log(`\n❌ Issue 1: ${unavailableItems.length} items marked as unavailable (won't show to customers):`);
      unavailableItems.forEach(item => {
        console.log(`   - ${item.name} (ID: ${item.id}, Restaurant: ${item.restaurant_name})`);
      });
      issues.push('unavailable_items');
    }
    
    // Issue 2: Items with 0 inventory
    const outOfStock = allItems.rows.filter(i => i.inventoryCount === 0);
    if (outOfStock.length > 0) {
      console.log(`\n⚠️  Issue 2: ${outOfStock.length} items with 0 inventory (may cause order failures):`);
      outOfStock.forEach(item => {
        console.log(`   - ${item.name} (ID: ${item.id}, Restaurant: ${item.restaurant_name})`);
      });
      issues.push('zero_inventory');
    }
    
    // Issue 3: Items with null restaurantId
    const orphanItems = allItems.rows.filter(i => !i.restaurant_name);
    if (orphanItems.length > 0) {
      console.log(`\n❌ Issue 3: ${orphanItems.length} items with invalid restaurantId (orphaned):`);
      orphanItems.forEach(item => {
        console.log(`   - ${item.name} (ID: ${item.id}, RestaurantID: ${item.restaurantId})`);
      });
      issues.push('orphan_items');
    }
    
    // 5. Propose fixes
    if (issues.length > 0) {
      console.log('\n========== PROPOSED FIXES ==========');
      
      if (issues.includes('unavailable_items')) {
        console.log('\n1. Set all items to available=true:');
        console.log('   UPDATE menu_items SET available = true WHERE available = false;');
      }
      
      if (issues.includes('zero_inventory')) {
        console.log('\n2. Set all items to inventoryCount=100:');
        console.log('   UPDATE menu_items SET "inventoryCount" = 100 WHERE "inventoryCount" < 10;');
      }
      
      if (issues.includes('orphan_items')) {
        console.log('\n3. Fix orphaned items (manual intervention needed):');
        console.log('   Review and assign correct restaurantId to these items.');
      }
      
      console.log('\n========================================');
      console.log('Run the fixes? (This script will execute them now)');
      
      // Auto-fix issues
      return { issues, items: allItems.rows };
    } else {
      console.log('\n✅ No issues found! All menu items are properly configured.');
      return { issues: [], items: allItems.rows };
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

async function fixIssues(issueData) {
  try {
    console.log('\n========== APPLYING FIXES ==========\n');
    
    if (issueData.issues.includes('unavailable_items')) {
      console.log('Fix 1: Setting all items to available=true...');
      const result1 = await client.query(`
        UPDATE menu_items 
        SET available = true, "updatedAt" = NOW()
        WHERE available = false
        RETURNING id, name
      `);
      console.log(`✓ Updated ${result1.rows.length} items to available=true`);
      result1.rows.forEach(item => console.log(`   - ${item.name} (ID: ${item.id})`));
    }
    
    if (issueData.issues.includes('zero_inventory')) {
      console.log('\nFix 2: Setting inventory to 100 for low-stock items...');
      const result2 = await client.query(`
        UPDATE menu_items 
        SET "inventoryCount" = 100, "updatedAt" = NOW()
        WHERE "inventoryCount" < 10
        RETURNING id, name, "inventoryCount"
      `);
      console.log(`✓ Updated ${result2.rows.length} items to inventoryCount=100`);
      result2.rows.forEach(item => console.log(`   - ${item.name} (ID: ${item.id})`));
    }
    
    console.log('\n✅ All fixes applied successfully!');
    
  } catch (error) {
    console.error('❌ Error applying fixes:', error.message);
    throw error;
  }
}

// Run diagnosis and fixes
diagnoseMenuIssues()
  .then(async (issueData) => {
    if (issueData.issues.length > 0) {
      await fixIssues(issueData);
    }
  })
  .catch(err => {
    console.error('Fatal error:', err);
  })
  .finally(() => {
    client.end();
  });
