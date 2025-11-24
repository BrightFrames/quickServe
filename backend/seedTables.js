import dotenv from "dotenv";
import QRCode from "qrcode";
import sequelize, { testConnection, syncDatabase } from "./config/database.js";
import Table from "./models/Table.js";

dotenv.config();

const seedTables = async () => {
  try {
    console.log("Connecting to PostgreSQL...");
    const connected = await testConnection();
    if (!connected) {
      throw new Error("Failed to connect to PostgreSQL");
    }
    console.log("PostgreSQL connected");

    console.log("Syncing database schema...");
    await syncDatabase();

    // Clear existing tables
    await Table.destroy({ where: {} });
    console.log("Cleared existing tables");

    // Create sample tables
    const tableData = [
      {
        tableId: "T1",
        tableName: "Table 1",
        seats: 2,
        location: "Window Side",
      },
      {
        tableId: "T2",
        tableName: "Table 2",
        seats: 4,
        location: "Window Side",
      },
      { tableId: "T3", tableName: "Table 3", seats: 4, location: "Center" },
      { tableId: "T4", tableName: "Table 4", seats: 6, location: "Center" },
      { tableId: "T5", tableName: "Table 5", seats: 2, location: "Near Bar" },
      { tableId: "T6", tableName: "Table 6", seats: 4, location: "Near Bar" },
      {
        tableId: "T7",
        tableName: "Table 7",
        seats: 8,
        location: "Private Room",
      },
      { tableId: "T8", tableName: "Table 8", seats: 4, location: "Outdoor" },
      { tableId: "T9", tableName: "Table 9", seats: 2, location: "Outdoor" },
      {
        tableId: "T10",
        tableName: "Table 10",
        seats: 6,
        location: "Ground Floor",
      },
    ];

    const customerAppUrl =
      process.env.CUSTOMER_APP_URL || "http://localhost:8080";

    for (const data of tableData) {
      const orderUrl = `${customerAppUrl}?table=${data.tableId}`;

      // Generate QR code as base64 image
      const qrCodeImage = await QRCode.toDataURL(orderUrl, {
        errorCorrectionLevel: "H",
        type: "image/png",
        width: 300,
        margin: 2,
      });

      await Table.create({
        ...data,
        qrCode: qrCodeImage,
        isActive: true,
      });

      console.log(`Created ${data.tableName} with QR code`);
    }

    console.log("✅ Successfully seeded 10 tables with QR codes!");
    console.log(`\nTables can be accessed by scanning QR codes or visiting:`);
    console.log(`${customerAppUrl}?table=T1`);
    console.log(`${customerAppUrl}?table=T2`);
    console.log(`... etc.`);

    await sequelize.close();
    console.log("\nPostgreSQL disconnected");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding tables:", error);
    process.exit(1);
  }
};

seedTables();
