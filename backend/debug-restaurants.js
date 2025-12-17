
import Restaurant from "./models/Restaurant.js";
import sequelize from "./config/database.js";

async function listRestaurants() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const restaurants = await Restaurant.findAll();
        console.log("Restaurants found:", restaurants.length);
        restaurants.forEach(r => {
            console.log(`[${r.id}] Name: ${r.name}, Slug: ${r.slug}, Code: ${r.restaurantCode}, Active: ${r.isActive}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        try {
            await sequelize.close();
        } catch (e) {
            // ignore
        }
    }
}

listRestaurants();
