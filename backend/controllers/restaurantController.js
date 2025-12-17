import restaurantService from "../services/restaurantService.js";

class RestaurantController {

    async signup(req, res) {
        try {
            if (!req.body.name || !req.body.email || !req.body.password || !req.body.phone || !req.body.address) {
                return res.status(400).json({ message: "All fields are required" });
            }
            if (req.body.password.length < 6) {
                return res.status(400).json({ message: "Password must be at least 6 characters long" });
            }

            const result = await restaurantService.createRestaurant(req.body);

            const { restaurant, token } = result;
            res.status(201).json({
                message: "Restaurant registered successfully. Please set up kitchen and captain access.",
                restaurant: {
                    id: restaurant.id,
                    name: restaurant.name,
                    slug: restaurant.slug,
                    restaurantCode: restaurant.restaurantCode,
                    email: restaurant.email,
                    phone: restaurant.phone,
                    address: restaurant.address,
                    requiresStaffSetup: true,
                },
                token
            });
        } catch (error) {
            console.error("[RESTAURANT CONTROLLER] Signup Error:", error);
            if (error.message.includes("already exists")) {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

            const { restaurant, token } = await restaurantService.login(email, password);

            res.json({
                message: "Login successful",
                restaurant: {
                    id: restaurant.id,
                    name: restaurant.name,
                    slug: restaurant.slug,
                    restaurantCode: restaurant.restaurantCode,
                    email: restaurant.email,
                    phone: restaurant.phone,
                    address: restaurant.address,
                },
                token
            });
        } catch (error) {
            console.error("[RESTAURANT CONTROLLER] Login Error:", error);
            res.status(401).json({ message: error.message });
        }
    }

    async verifyAdminPassword(req, res) {
        try {
            const { slug, password } = req.body;
            if (!slug || !password) return res.status(400).json({ message: "Slug and password required" });

            await restaurantService.verifyAdminPassword(slug, password);
            res.json({ success: true, message: "Password verified successfully" });
        } catch (error) {
            console.error("[RESTAURANT CONTROLLER] Verify Pass Error:", error);
            if (error.message === "Restaurant not found") return res.status(404).json({ success: false, message: error.message });
            if (error.message === "Incorrect password") return res.status(401).json({ success: false, message: error.message });
            res.status(500).json({ success: false, message: "Server error" });
        }
    }

    async verifyAdminCode(req, res) {
        try {
            const { code } = req.body;
            if (!code) return res.status(400).json({ message: "Code required" });

            const restaurant = await restaurantService.verifyAdminCode(code);
            res.json({
                verified: true,
                restaurant: {
                    id: restaurant.id,
                    name: restaurant.name,
                    slug: restaurant.slug,
                    restaurantCode: restaurant.restaurantCode,
                    email: restaurant.email
                }
            });
        } catch (error) {
            console.error("[RESTAURANT CONTROLLER] Verify Code Error:", error);
            if (error.message.includes("not found")) return res.status(404).json({ verified: false, message: error.message });
            res.status(500).json({ verified: false, message: "Server error" });
        }
    }

    async getInfoByCode(req, res) {
        try {
            const { restaurantCode } = req.params;
            const restaurant = await restaurantService.getRestaurantByCode(restaurantCode);
            res.json({
                restaurant: {
                    id: restaurant.id,
                    name: restaurant.name,
                    slug: restaurant.slug,
                    restaurantCode: restaurant.restaurantCode,
                    email: restaurant.email,
                    phone: restaurant.phone,
                    address: restaurant.address,
                    gstNumber: restaurant.gstNumber,
                    taxPercentage: parseFloat(restaurant.taxPercentage) || 5.0,
                    subscription: restaurant.subscription,
                    paymentAccounts: restaurant.paymentAccounts,
                }
            });
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch info" });
        }
    }

    async updatePaymentAccounts(req, res) {
        try {
            const { restaurantCode } = req.params;
            const { paymentAccounts } = req.body;
            if (!paymentAccounts) return res.status(400).json({ message: "Payment accounts required" });

            const updatedAccounts = await restaurantService.updatePaymentAccounts(restaurantCode, paymentAccounts);
            res.json({ message: "Updated successfully", paymentAccounts: updatedAccounts });
        } catch (error) {
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }

    async getProfile(req, res) {
        try {
            const restaurant = await restaurantService.getProfile(req.restaurantId); // extracted from token by middleware
            res.json({
                restaurant: {
                    id: restaurant.id,
                    name: restaurant.name,
                    slug: restaurant.slug,
                    restaurantCode: restaurant.restaurantCode,
                    email: restaurant.email,
                    phone: restaurant.phone,
                    address: restaurant.address,
                    gstNumber: restaurant.gstNumber,
                    settings: restaurant.settings,
                    subscription: restaurant.subscription,
                    createdAt: restaurant.createdAt,
                }
            });
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    }

    async updateProfile(req, res) {
        try {
            if (req.body.taxPercentage !== undefined) {
                const tax = parseFloat(req.body.taxPercentage);
                if (isNaN(tax) || tax < 0 || tax > 100) return res.status(400).json({ message: "Tax must be 0-100" });
            }

            const restaurant = await restaurantService.updateProfile(req.restaurantId, req.body);
            res.json({
                message: "Profile updated",
                restaurant: {
                    id: restaurant.id,
                    name: restaurant.name,
                    slug: restaurant.slug,
                    restaurantCode: restaurant.restaurantCode,
                    email: restaurant.email,
                    phone: restaurant.phone,
                    address: restaurant.address,
                    gstNumber: restaurant.gstNumber,
                    taxPercentage: restaurant.taxPercentage,
                }
            });
        } catch (error) {
            res.status(500).json({ message: "Failed to update profile" });
        }
    }

    async logout(req, res) {
        res.json({ message: "Logged out successfully" });
    }

    async verifyBySlugAndCode(req, res) {
        try {
            const { slug, code } = req.params;
            const restaurant = await restaurantService.verifySlugAndCode(slug, code);
            res.json({
                verified: true,
                restaurant: {
                    id: restaurant.id,
                    name: restaurant.name,
                    slug: restaurant.slug,
                    restaurantCode: restaurant.restaurantCode,
                    email: restaurant.email,
                    phone: restaurant.phone,
                    address: restaurant.address,
                }
            });
        } catch (error) {
            res.status(404).json({ verified: false, message: error.message });
        }
    }

    async updateDashboardPassword(req, res) {
        try {
            const { oldPassword, newPassword } = req.body;
            if (!oldPassword || !newPassword) return res.status(400).json({ message: "Both passwords required" });
            if (newPassword.length < 6) return res.status(400).json({ message: "Password too short" });
            if (newPassword === 'admin123') return res.status(400).json({ message: "Cannot use default password" });

            await restaurantService.updateDashboardPassword(req.restaurantId, oldPassword, newPassword, req.userRole);
            res.json({ message: "Password updated", isUsingDefault: false, success: true });
        } catch (error) {
            console.error("[RESTAURANT CONTROLLER] Update Dash Pass Error:", error);
            if (error.message.includes("incorrect") || error.message.includes("Access denied")) {
                return res.status(401).json({ message: error.message });
            }
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }

    async getDashboardPasswordStatus(req, res) {
        try {
            const isUsingDefault = await restaurantService.getDashboardPasswordStatus(req.restaurantId, req.userRole);
            res.json({
                isUsingDefault,
                message: isUsingDefault ? "Using default" : "Using custom"
            });
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    }

    async setupStaffAccess(req, res) {
        try {
            const { restaurantId, kitchenPassword, captainPassword } = req.body;
            if (!restaurantId || !kitchenPassword || !captainPassword) return res.status(400).json({ message: "Missing fields" });
            if (kitchenPassword.length < 6 || captainPassword.length < 6) return res.status(400).json({ message: "Passwords too short" });

            const { kitchenUser, captainUser } = await restaurantService.setupStaffAccess(restaurantId, kitchenPassword, captainPassword);

            res.status(201).json({
                message: "Staff setup successful",
                staffAccounts: {
                    kitchen: { username: kitchenUser.username, restaurantId: restaurantId },
                    captain: { username: captainUser.username, restaurantId: restaurantId }
                }
            });
        } catch (error) {
            console.error("[RESTAURANT CONTROLLER] Staff Setup Error:", error);
            if (error.message.includes("exist")) return res.status(400).json({ message: error.message });
            res.status(500).json({ message: "Server error" });
        }
    }

    async getStaffSetupStatus(req, res) {
        try {
            const { restaurantId } = req.params;
            const status = await restaurantService.getStaffSetupStatus(restaurantId);
            res.json({
                restaurantId: status.restaurant.id,
                restaurantName: status.restaurant.name,
                setupComplete: status.kitchen.exists && status.captain.exists,
                accounts: {
                    kitchen: status.kitchen,
                    captain: status.captain
                }
            });
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    }

    async updateStaffPasswords(req, res) {
        try {
            const { restaurantId, kitchenPassword, captainPassword } = req.body;
            if (!restaurantId) return res.status(400).json({ message: "Restaurant ID required" });
            if (!kitchenPassword && !captainPassword) return res.status(400).json({ message: "One password required" });

            const updates = await restaurantService.updateStaffPasswords(restaurantId, kitchenPassword, captainPassword);
            res.json({ message: "Passwords updated", updated: updates });
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    }

    async updateCredentials(req, res) {
        try {
            const { restaurantCode } = req.params;
            const { type, username, password } = req.body;
            if (!restaurantCode || !type) return res.status(400).json({ message: "Missing params" });
            if (!username && !password) return res.status(400).json({ message: "Nothing to update" });

            await restaurantService.updateCredentials(restaurantCode, type, username, password);
            res.json({ message: "Credentials updated" });
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    }

    async getPublicInfo(req, res) {
        try {
            const info = await restaurantService.getPublicInfo(req.params.identifier);
            res.json(info);
        } catch (error) {
            if (error.message === "Restaurant not found") return res.status(404).json({ message: error.message });
            res.status(500).json({ message: "Server error" });
        }
    }
}

export default new RestaurantController();
