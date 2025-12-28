import express from "express";
import restaurantController from "../controllers/restaurantController.js";
import { signupRateLimiter } from "../utils/rateLimiter.js";
import { validateRestaurantSignup } from "../utils/validators.js";
import { authenticateRestaurant } from "../middleware/auth.js";

const router = express.Router();

// Restaurant Signup
router.post("/signup", signupRateLimiter, validateRestaurantSignup, restaurantController.signup);

// Restaurant Login
router.post("/login", restaurantController.login);

// Admin Pass Verify (Customer trying to access Admin)
router.post("/verify-admin-password", restaurantController.verifyAdminPassword);

// Verify Admin (Code)
router.post("/verify-admin", restaurantController.verifyAdminCode);

// Get Info by Code (Admin)
router.get("/info/code/:restaurantCode", restaurantController.getInfoByCode);

// Update Payment Accounts
router.put("/payment-accounts/:restaurantCode", restaurantController.updatePaymentAccounts);

// Get Profile (Protected)
router.get("/me", authenticateRestaurant, restaurantController.getProfile);
router.get("/profile", authenticateRestaurant, restaurantController.getProfile);

// Update Profile (Protected)
router.put("/profile", authenticateRestaurant, restaurantController.updateProfile);

// Logout
router.post("/logout", restaurantController.logout);

// Verify by Slug & Code
router.get("/verify/:slug/:code", restaurantController.verifyBySlugAndCode);

// Dashboard Password
router.patch("/dashboard-password", authenticateRestaurant, restaurantController.updateDashboardPassword);
router.get("/dashboard-password-status", authenticateRestaurant, restaurantController.getDashboardPasswordStatus);

// Update Credentials (Admin/Kitchen)
router.put("/update-credentials/:restaurantCode", restaurantController.updateCredentials);

// Public Info
router.get("/info/:identifier", restaurantController.getPublicInfo);

// Staff Access Setup
router.post("/setup-staff-access", restaurantController.setupStaffAccess);
router.get("/staff-setup-status/:restaurantId", restaurantController.getStaffSetupStatus);
router.put("/update-staff-passwords", restaurantController.updateStaffPasswords);

export default router;