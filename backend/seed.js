import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import sequelize, { testConnection, syncDatabase } from "./config/database.js";
import User from "./models/User.js";
import MenuItem from "./models/MenuItem.js";
import Order from "./models/Order.js";

dotenv.config();

const sampleMenuItems = [
  {
    name: "Margherita Pizza",
    description: "Classic pizza with tomato sauce, mozzarella, and fresh basil",
    price: 299,
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400",
    available: true,
    inventoryCount: 50,
    lowStockThreshold: 10,
  },
  {
    name: "Pepperoni Pizza",
    description: "Loaded with pepperoni and mozzarella cheese",
    price: 349,
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400",
    available: true,
    inventoryCount: 45,
    lowStockThreshold: 10,
  },
  {
    name: "Chicken Burger",
    description:
      "Grilled chicken patty with lettuce, tomato, and special sauce",
    price: 179,
    category: "Burgers",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
    available: true,
    inventoryCount: 60,
    lowStockThreshold: 15,
  },
  {
    name: "Veg Burger",
    description: "Crispy vegetable patty with fresh veggies",
    price: 149,
    category: "Burgers",
    image: "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400",
    available: true,
    inventoryCount: 55,
    lowStockThreshold: 15,
  },
  {
    name: "French Fries",
    description: "Crispy golden fries with seasoning",
    price: 99,
    category: "Sides",
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400",
    available: true,
    inventoryCount: 100,
    lowStockThreshold: 20,
  },
  {
    name: "Garlic Bread",
    description: "Toasted bread with garlic butter and herbs",
    price: 129,
    category: "Sides",
    image: "https://images.unsplash.com/photo-1573140401552-3fab0b24f5f6?w=400",
    available: true,
    inventoryCount: 80,
    lowStockThreshold: 15,
  },
  {
    name: "Coke",
    description: "Chilled Coca-Cola 330ml",
    price: 49,
    category: "Beverages",
    image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400",
    available: true,
    inventoryCount: 200,
    lowStockThreshold: 50,
  },
  {
    name: "Mango Smoothie",
    description: "Fresh mango smoothie with ice cream",
    price: 129,
    category: "Beverages",
    image: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400",
    available: true,
    inventoryCount: 40,
    lowStockThreshold: 10,
  },
  {
    name: "Pasta Alfredo",
    description: "Creamy white sauce pasta with mushrooms",
    price: 249,
    category: "Pasta",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400",
    available: true,
    inventoryCount: 35,
    lowStockThreshold: 10,
  },
  {
    name: "Chocolate Brownie",
    description: "Warm chocolate brownie with vanilla ice cream",
    price: 159,
    category: "Desserts",
    image: "https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=400",
    available: true,
    inventoryCount: 30,
    lowStockThreshold: 8,
  },
];

const sampleKitchenUsers = [
  {
    username: "kitchen1",
    password: "kitchen123",
    role: "kitchen",
  },
  {
    username: "cook1",
    password: "cook123",
    role: "cook",
  },
];

async function seedDatabase() {
  try {
    console.log("Connecting to PostgreSQL...");
    const connected = await testConnection();
    if (!connected) {
      throw new Error("Failed to connect to PostgreSQL");
    }
    console.log("Connected to PostgreSQL");

    console.log("Syncing database schema...");
    await syncDatabase();

    // Clear existing data
    console.log("Clearing existing data...");
    await User.destroy({ where: { role: ['kitchen', 'cook'] } });
    await MenuItem.destroy({ where: {} });
    await Order.destroy({ where: {} });

    // Seed menu items
    console.log("Seeding menu items...");
    for (const item of sampleMenuItems) {
      await MenuItem.create(item);
    }
    console.log(`✓ Created ${sampleMenuItems.length} menu items`);

    // Seed kitchen users
    console.log("Seeding kitchen users...");
    for (const userData of sampleKitchenUsers) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      await User.create({
        username: userData.username,
        password: hashedPassword,
        role: userData.role,
      });

      console.log(
        `✓ Created user: ${userData.username} (password: ${userData.password})`
      );
    }

    console.log("\n✅ Database seeded successfully!");
    console.log("\n📝 Default Credentials:");
    console.log("Admin:");
    console.log(`  Username: ${process.env.ADMIN_USERNAME || 'admin'}`);
    console.log(`  Password: ${process.env.ADMIN_PASSWORD || '(set in .env)'}`);
    console.log("\nKitchen Users:");
    sampleKitchenUsers.forEach((user) => {
      console.log(`  Username: ${user.username}, Password: ${user.password}`);
    });

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
