import sequelize from './config/database.js';

async function testInventoryQuery() {
  try {
    const restaurantId = 1;
    const days = 7;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);
    
    console.log('Testing inventory consumption query...');
    console.log('Restaurant ID:', restaurantId);
    console.log('Start Date:', startDate);
    
    // First check if we have any orders
    const [orderCheck] = await sequelize.query(`
      SELECT COUNT(*) as count, 
             MIN("createdAt") as first_order,
             MAX("createdAt") as last_order
      FROM orders
      WHERE "restaurantId" = :restaurantId
    `, {
      replacements: { restaurantId }
    });
    
    console.log('\nOrder Check:', orderCheck[0]);
    
    // Check items structure
    const [itemsSample] = await sequelize.query(`
      SELECT id, "orderNumber", items, status, "createdAt"
      FROM orders
      WHERE "restaurantId" = :restaurantId
      LIMIT 3
    `, {
      replacements: { restaurantId }
    });
    
    console.log('\nSample Orders with Items:');
    itemsSample.forEach(order => {
      console.log(`Order ${order.orderNumber}:`, JSON.stringify(order.items, null, 2));
    });
    
    // Now try the actual query
    const [itemConsumption] = await sequelize.query(`
      SELECT 
        item->>'id' as "itemId",
        item->>'name' as "itemName",
        item->>'category' as category,
        CAST(item->>'price' AS DECIMAL) as price,
        SUM(CAST(item->>'quantity' AS INTEGER)) as "totalQuantity",
        SUM(CAST(item->>'quantity' AS INTEGER) * CAST(item->>'price' AS DECIMAL)) as "totalRevenue"
      FROM orders o,
      jsonb_array_elements(o.items) as item
      WHERE o."restaurantId" = :restaurantId
        AND o."createdAt" >= :startDate
        AND o.status IN ('preparing', 'prepared', 'delivered')
      GROUP BY item->>'id', item->>'name', item->>'category', item->>'price'
      ORDER BY "totalQuantity" DESC
    `, {
      replacements: { restaurantId, startDate }
    });
    
    console.log('\nInventory Consumption Results:');
    console.log(JSON.stringify(itemConsumption, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

testInventoryQuery();
