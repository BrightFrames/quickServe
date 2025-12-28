import sequelize from '../config/database.js';
import InventoryItem from '../models/InventoryItem.js';
import MenuItem from '../models/MenuItem.js';
import Restaurant from '../models/Restaurant.js';

async function verifyInventory() {
    try {
        console.log('--- STARTING INVENTORY VERIFICATION ---');
        await sequelize.authenticate();
        console.log('✓ Database connected');

        await InventoryItem.sync({ alter: true });
        console.log('✓ Inventory table synced');

        const restaurant = await Restaurant.findOne();
        if (!restaurant) {
            console.warn('⚠ No restaurant found. Aborting.');
            return;
        }

        // 1. Find a Menu Item
        let menuItem = await MenuItem.findOne({ where: { restaurantId: restaurant.id } });
        if (!menuItem) {
            console.log('Creating dummy menu item...');
            menuItem = await MenuItem.create({
                restaurantId: restaurant.id,
                name: 'Inventory Test Item',
                description: 'Test',
                price: 50,
                category: 'Test'
            });
        }
        console.log(`✓ Using Menu Item: ${menuItem.name} (ID: ${menuItem.id})`);

        // 2. Create/Update Inventory
        console.log('Testing Stock Update...');
        let invItem = await InventoryItem.findOne({
            where: { restaurantId: restaurant.id, menuItemId: menuItem.id }
        });

        if (!invItem) {
            invItem = await InventoryItem.create({
                restaurantId: restaurant.id,
                menuItemId: menuItem.id,
                currentStock: 10,
                lowStockThreshold: 5
            });
            console.log('✓ Inventory Record Created');
        } else {
            invItem.currentStock = 10;
            await invItem.save();
            console.log('✓ Inventory Record Reset to 10');
        }

        // 3. Verify Stock deduction logic (Phase 2 core requirement)
        // Simulate an order affecting stock? 
        // Note: Feature 7 is auto-deduction. Feature 6 is just management.
        // So checking if we can update it is enough.

        invItem.currentStock = 2; // Below threshold
        await invItem.save();

        // Reload to check hooks
        await invItem.reload();
        if (invItem.status === 'low_stock') {
            console.log('✓ Low Stock Hook Working (Status: low_stock)');
        } else {
            console.error(`❌ Low Stock Hook Failed: Status is ${invItem.status}`);
        }

        invItem.currentStock = 0;
        await invItem.save();
        await invItem.reload();
        if (invItem.status === 'out_of_stock') {
            console.log('✓ Out of Stock Hook Working (Status: out_of_stock)');
        } else {
            console.error(`❌ Out of Stock Hook Failed: Status is ${invItem.status}`);
        }

        console.log('--- VERIFICATION COMPLETE ---');
        process.exit(0);

    } catch (error) {
        console.error('❌ Verification Failed:', error);
        process.exit(1);
    }
}

verifyInventory();
