import dotenv from "dotenv";
import sequelize, { testConnection, syncDatabase } from "./config/database.js";
import MenuItem from "./models/MenuItem.js";

dotenv.config();

async function clearMenuItems() {
  try {
    console.log("Connecting to PostgreSQL...");
    const connected = await testConnection();
    if (!connected) {
      throw new Error("Failed to connect to PostgreSQL");
    }
    console.log("✓ Connected to PostgreSQL");

    console.log("\nClearing all menu items...");
    const deletedCount = await MenuItem.destroy({ where: {} });
    console.log(`✓ Deleted ${deletedCount} menu items`);

    console.log("\n✅ Menu cleared successfully!");
    console.log(
      "You can now add your own menu items through the admin panel.\n"
    );

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error clearing menu:", error);
    process.exit(1);
  }
}

clearMenuItems();
