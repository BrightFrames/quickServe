import mongoose from "mongoose";
import dotenv from "dotenv";
import MenuItem from "./models/MenuItem.js";

dotenv.config();

async function clearMenuItems() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✓ Connected to MongoDB");

    console.log("\nClearing all menu items...");
    const result = await MenuItem.deleteMany({});
    console.log(`✓ Deleted ${result.deletedCount} menu items`);

    console.log("\n✅ Menu cleared successfully!");
    console.log(
      "You can now add your own menu items through the admin panel.\n"
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error clearing menu:", error);
    process.exit(1);
  }
}

clearMenuItems();
