import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import sequelize, { testConnection, syncDatabase } from "./config/database.js";
import { setupAssociations } from "./models/index.js";

import authRoutes from "./routes/auth.js";
import restaurantRoutes from "./routes/restaurant.js";
import menuRoutes from "./routes/menu.js";
import orderRoutes from "./routes/orders.js";
import userRoutes from "./routes/users.js";
import analyticsRoutes from "./routes/analytics.js";
import tableRoutes from "./routes/tables.js";
import paymentRoutes from "./routes/payment.js";
import ratingRoutes from "./routes/ratings.js";
import invoiceRoutes from "./routes/invoice.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// ============================
// CORS SETUP
// ============================

// Allowed origins from environment variable or local dev
const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : [];

const allowedOrigins = [
  "http://localhost:3000", // Backend API
  "http://localhost:3001", // Landing page dev
  "http://localhost:5173", // Admin dev
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:8080", // Customer dev
  "http://localhost:8081", // Customer dev (alternate port)
  "http://localhost:8082",
  "http://localhost:3001", // Customer dev (alternate port)
  ...envOrigins, // Production frontends
];

console.log("Allowed CORS origins:", allowedOrigins);

// CORS middleware - manual implementation for better control
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Log every request origin for debugging
  console.log(
    `[CORS] Request from: ${origin || "no-origin"} - Method: ${req.method}`
  );

  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    // Set CORS headers for allowed origins
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, Accept"
    );
    res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours
    console.log(`[CORS] ✓ Allowed origin: ${origin}`);
  } else if (!origin) {
    // Allow requests with no origin (curl, Postman, server-to-server)
    console.log("[CORS] ✓ No origin (non-browser request)");
  } else {
    console.log(`[CORS] ✗ BLOCKED: ${origin}`);
  }

  // Handle preflight OPTIONS requests
  if (req.method === "OPTIONS") {
    console.log("[CORS] Handling OPTIONS preflight request");
    return res.status(200).end();
  }

  next();
});

// ============================
// Middleware
// ============================

app.use(express.json());

// ============================
// Database Connection (SQLite)
// ============================

const connectDatabase = async () => {
  const connected = await testConnection();
  if (connected) {
    // Setup model associations before syncing
    setupAssociations();
    await syncDatabase();
  } else {
    console.error("Failed to connect to database");
    process.exit(1);
  }
};

connectDatabase();

// ============================
// Socket.IO Setup
// ============================

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Make io accessible in routes
app.set("io", io);

// ============================
// Routes
// ============================

// Log all route registrations
console.log("Registering routes...");
app.use("/api/auth", authRoutes);
console.log("✓ Auth routes registered at /api/auth");

app.use("/api/restaurant", restaurantRoutes);
console.log("✓ Restaurant routes registered at /api/restaurant");

app.use("/api/menu", menuRoutes);
console.log("✓ Menu routes registered at /api/menu");

app.use("/api/orders", orderRoutes);
console.log("✓ Order routes registered at /api/orders");

app.use("/api/users", userRoutes);
console.log("✓ User routes registered at /api/users");

app.use("/api/analytics", analyticsRoutes);
console.log("✓ Analytics routes registered at /api/analytics");

app.use("/api/tables", tableRoutes);
console.log("✓ Table routes registered at /api/tables");

app.use("/api/payment", paymentRoutes);
console.log("✓ Payment routes registered at /api/payment");

app.use("/api/ratings", ratingRoutes);
console.log("✓ Rating routes registered at /api/ratings");

app.use("/api/invoice", invoiceRoutes);
console.log("✓ Invoice routes registered at /api/invoice");

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// Root route
app.get("/", (req, res) => {
  res.send("Server is running fine");
});

// 404 handler - catch any unmatched routes
app.use((req, res, next) => {
  console.log(`[404] Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    message: "Route not found",
    path: req.url,
    method: req.method,
  });
});

// ============================
// Start Server
// ============================

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };
