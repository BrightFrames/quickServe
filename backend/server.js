import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
import sequelize, { testConnection, syncDatabase } from "./config/database.js";
import { setupAssociations } from "./models/index.js";

import authRoutes from "./routes/auth.js";
import restaurantRoutes from "./routes/restaurant.js";
import menuRoutes from "./routes/menu.js";
import orderRoutes from "./routes/orders.js";
import userRoutes from "./routes/users.js";
import userCredentialsRoutes from "./routes/userCredentials.js";
import analyticsRoutes from "./routes/analytics.js";
import tableRoutes from "./routes/tables.js";
import paymentRoutes from "./routes/payment.js";
import cashfreePaymentRoutes from "./routes/paymentRoutes.js";
import ratingRoutes from "./routes/ratings.js";
import invoiceRoutes from "./routes/invoice.js";
import customerAuthRoutes from "./routes/customerAuth.js";
import promoCodeRoutes from "./routes/promoCodes.js";
import debugRoutes from "./routes/debug.js";
import captainRoutes from "./routes/captain.js";
import receptionRoutes from "./routes/reception.js";
import publicRoutes from "./routes/public.js";

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
  "http://192.168.1.83:8080", // Network IP for mobile testing
  "http://192.168.1.83:5173", // Network IP for admin
  "http://192.168.1.83:3001", // Network IP for landing
  "https://quick-serve-ten.vercel.app", // Production frontend (Vercel)
  "https://quickserve-51ek.onrender.com", // Production backend (Render)
  ...envOrigins, // Additional production frontends from env
];

console.log("Allowed CORS origins:", allowedOrigins);

// CORS middleware - manual implementation for better control
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Log every request origin for debugging
  console.log(
    `[CORS] Request from: ${origin || "no-origin"} - Method: ${req.method} - Path: ${req.path}`
  );

  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    // Set CORS headers for allowed origins
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, Accept, x-restaurant-slug"
    );
    res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours
    console.log(`[CORS] ✓ Allowed origin: ${origin}`);
    
    // Handle preflight OPTIONS requests
    if (req.method === "OPTIONS") {
      console.log("[CORS] ✓ Responding to OPTIONS preflight with 204");
      return res.status(204).end();
    }
  } else if (!origin) {
    // Allow requests with no origin (curl, Postman, server-to-server)
    console.log("[CORS] ✓ No origin (non-browser request)");
  } else {
    console.log(`[CORS] ✗ BLOCKED: ${origin}`);
    // For blocked origins, still need to respond to OPTIONS
    if (req.method === "OPTIONS") {
      console.log("[CORS] ✗ Blocked OPTIONS request - returning 403");
      return res.status(403).json({ error: "CORS not allowed" });
    }
  }

  next();
});

// ============================
// PERFORMANCE OPTIMIZATIONS
// ============================

// Enable gzip/deflate compression for all responses
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Balance between compression ratio and speed
  threshold: 1024, // Only compress responses > 1KB
}));

// Optimize Express settings
app.set('trust proxy', 1); // Trust first proxy
app.set('x-powered-by', false); // Hide Express fingerprint
app.set('etag', 'strong'); // Enable strong ETags for caching

// Add response time tracking
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) { // Log slow requests (>1s)
      console.log(`[PERF] Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  next();
});

// Cache-Control headers for static assets
app.use((req, res, next) => {
  if (req.path.match(/\.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
});

// ============================
// Middleware
// ============================

// Import logging and error handling utilities
import { requestLoggerMiddleware } from "./utils/logger.js";
import { errorHandler } from "./utils/errorHandler.js";

// Security headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding for QR codes
  })
);

app.use(express.json());

// Add request logging middleware (logs all API requests)
app.use(requestLoggerMiddleware);

// ============================
// Database Connection (SQLite)
// ============================

const connectDatabase = async () => {
  let retries = 5;
  while (retries > 0) {
    const connected = await testConnection();
    if (connected) {
      // Setup model associations before syncing
      setupAssociations();
      await syncDatabase();
      return;
    } else {
      retries--;
      console.log(`Database connection failed. Retries remaining: ${retries}`);
      if (retries > 0) {
        console.log('Retrying in 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  console.error("Failed to connect to database after multiple attempts");
  process.exit(1);
};

connectDatabase();

// ============================
// Socket.IO Setup
// ============================

import { getRestaurantRoom, getKitchenRoom, getCaptainRoom } from "./utils/orderLifecycle.js";
import jwt from "jsonwebtoken";

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Socket.IO authentication middleware (optional for customers)
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      // Allow connection without auth (for customers tracking orders)
      console.log('[SOCKET] Connection allowed without token (customer)');
      socket.user = null; // Mark as unauthenticated
      return next();
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user data to socket
    socket.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      restaurantId: decoded.restaurantId || decoded.id, // Restaurant owner uses their ID
      type: decoded.type,
    };
    
    console.log('[SOCKET] ✓ Authenticated socket:', socket.user);
    next();
  } catch (error) {
    console.error('[SOCKET] Authentication error:', error.message);
    // Still allow connection but mark as unauthenticated
    socket.user = null;
    next();
  }
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  console.log("Client user:", socket.user);

  // Join restaurant-specific rooms (with validation)
  socket.on("join-restaurant", (restaurantId) => {
    // Allow unauthenticated customers to join (for order tracking)
    if (!socket.user) {
      const restaurantRoom = getRestaurantRoom(restaurantId);
      socket.join(restaurantRoom);
      console.log(`[SOCKET] ✅ Customer socket ${socket.id} joined restaurant room: ${restaurantRoom}`);
      return;
    }
    
    // SECURITY FIX: Use strict equality (===) and convert types properly
    const userRestaurantId = parseInt(socket.user.restaurantId, 10);
    const requestedRestaurantId = parseInt(restaurantId, 10);
    
    if (userRestaurantId !== requestedRestaurantId) {
      console.log(`[SOCKET] ❌ Access denied: User from restaurant ${userRestaurantId} tried to join restaurant ${requestedRestaurantId}`);
      socket.emit('error', { message: 'Access denied: Cannot join another restaurant\'s room' });
      return;
    }
    
    const restaurantRoom = getRestaurantRoom(restaurantId);
    socket.join(restaurantRoom);
    console.log(`[SOCKET] ✅ Socket ${socket.id} joined restaurant room: ${restaurantRoom}`);
    console.log(`[SOCKET] 📊 Clients in ${restaurantRoom}:`, io.sockets.adapter.rooms.get(restaurantRoom)?.size || 0);
  });

  // Join kitchen room (with validation)
  socket.on("join-kitchen", (restaurantId) => {
    // SECURITY FIX: Use strict equality (===) and convert types properly
    const userRestaurantId = parseInt(socket.user.restaurantId, 10);
    const requestedRestaurantId = parseInt(restaurantId, 10);
    
    if (userRestaurantId !== requestedRestaurantId) {
      console.log(`[SOCKET] ❌ Access denied: User from restaurant ${userRestaurantId} tried to join kitchen ${requestedRestaurantId}`);
      socket.emit('error', { message: 'Access denied: Cannot join another restaurant\'s kitchen' });
      return;
    }
    
    // SECURITY: Verify user has kitchen role
    if (socket.user.role !== 'kitchen' && socket.user.role !== 'cook' && socket.user.type !== 'restaurant') {
      console.log(`[SOCKET] ❌ Access denied: User with role ${socket.user.role} cannot join kitchen room`);
      socket.emit('error', { message: 'Access denied: Only kitchen staff can join kitchen room' });
      return;
    }
    
    const kitchenRoom = getKitchenRoom(restaurantId);
    socket.join(kitchenRoom);
    console.log(`Socket ${socket.id} joined kitchen room: ${kitchenRoom}`);
  });

  // Join captain room (with validation)
  socket.on("join-captain", (restaurantId) => {
    // SECURITY FIX: Use strict equality (===) and convert types properly
    const userRestaurantId = parseInt(socket.user.restaurantId, 10);
    const requestedRestaurantId = parseInt(restaurantId, 10);
    
    if (userRestaurantId !== requestedRestaurantId) {
      console.log(`[SOCKET] ❌ Access denied: User from restaurant ${userRestaurantId} tried to join captain room ${requestedRestaurantId}`);
      socket.emit('error', { message: 'Access denied: Cannot join another restaurant\'s captain room' });
      return;
    }
    
    // SECURITY: Verify user has captain role
    if (socket.user.role !== 'captain' && socket.user.type !== 'restaurant') {
      console.log(`[SOCKET] ❌ Access denied: User with role ${socket.user.role} cannot join captain room`);
      socket.emit('error', { message: 'Access denied: Only captains can join captain room' });
      return;
    }
    
    const captainRoom = getCaptainRoom(restaurantId);
    socket.join(captainRoom);
    console.log(`Socket ${socket.id} joined captain room: ${captainRoom}`);
  });

  // Join order-specific room for customers tracking their order
  socket.on("join-order", (orderId) => {
    const orderRoom = `order_${orderId}`;
    socket.join(orderRoom);
    console.log(`[SOCKET] ✅ Customer joined order room: ${orderRoom}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Make io accessible in routes
app.set("io", io);

// ============================
// Health Check Endpoint
// ============================
app.get("/health", async (req, res) => {
  try {
    // Test database connection
    await sequelize.authenticate();
    res.json({ 
      status: "healthy", 
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: "unhealthy", 
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================
// Routes
// ============================

// Log all route registrations
console.log("Registering routes...");

// PUBLIC ROUTES (no authentication required) - MUST BE FIRST
app.use("/public", publicRoutes);
console.log("✓ Public routes registered at /public");

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

app.use("/api/users", userCredentialsRoutes);
console.log("✓ User credentials routes registered at /api/users");

app.use("/api/analytics", analyticsRoutes);
console.log("✓ Analytics routes registered at /api/analytics");

app.use("/api/tables", tableRoutes);
console.log("✓ Table routes registered at /api/tables");

app.use("/api/captain", captainRoutes);
console.log("✓ Captain routes registered at /api/captain");

app.use("/api/reception", receptionRoutes);
console.log("✓ Reception routes registered at /api/reception");

app.use("/api/payment", paymentRoutes);
console.log("✓ Payment routes registered at /api/payment");

// Cashfree marketplace payment routes
app.use("/api/payment", cashfreePaymentRoutes);
console.log("✓ Cashfree payment routes registered at /api/payment");

app.use("/api/ratings", ratingRoutes);
console.log("✓ Rating routes registered at /api/ratings");

app.use("/api/invoice", invoiceRoutes);
console.log("✓ Invoice routes registered at /api/invoice");

app.use("/api/customer/auth", customerAuthRoutes);
console.log("✓ Customer Auth routes registered at /api/customer/auth");

app.use("/api/promo-codes", promoCodeRoutes);
console.log("✓ Promo Code routes registered at /api/promo-codes");

app.use("/api/debug", debugRoutes);
console.log("✓ Debug routes registered at /api/debug");

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

// Global error handler (must be last middleware)
app.use(errorHandler);

// ============================
// Start Server
// ============================

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start cleanup job for old orders
  startOrderCleanupJob();
});

// ============================
// Order Cleanup Job
// ============================
import Order from "./models/Order.js";
import { Op } from "sequelize";

function startOrderCleanupJob() {
  console.log('[CLEANUP] Starting daily order cleanup job');
  
  // Run cleanup immediately on startup
  cleanupOldOrders();
  
  // Run cleanup every 24 hours
  setInterval(cleanupOldOrders, 24 * 60 * 60 * 1000);
}

async function cleanupOldOrders() {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    // Delete orders older than 1 day that are served/completed
    const deletedCount = await Order.destroy({
      where: {
        status: {
          [Op.in]: ['served', 'completed']
        },
        paymentStatus: 'paid',
        updatedAt: {
          [Op.lt]: oneDayAgo
        }
      }
    });
    
    if (deletedCount > 0) {
      console.log(`[CLEANUP] ✓ Deleted ${deletedCount} old paid orders (>1 day old)`);
    }
  } catch (error) {
    console.error('[CLEANUP] Error cleaning up old orders:', error.message);
  }
}

export { io };
