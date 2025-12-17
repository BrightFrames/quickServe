import Restaurant from "../models/Restaurant.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cache, cacheKeys } from "../utils/cache.js";

// Helper: Normalize email
const normalizeEmail = (email) => {
    if (!email) return email;
    let normalized = email.toLowerCase().trim();
    if (normalized.endsWith('@gmail.com')) {
        const [localPart, domain] = normalized.split('@');
        normalized = localPart.replace(/\./g, '') + '@' + domain;
    }
    return normalized;
};

// Helper: Retry DB operation
const retryDatabaseOperation = async (operation, maxRetries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            const isConnectionError =
                error.name === 'SequelizeDatabaseError' ||
                error.message?.includes('Connection terminated') ||
                error.message?.includes('connect ECONNREFUSED') ||
                error.message?.includes('connect ETIMEDOUT');

            if (isConnectionError && attempt < maxRetries) {
                console.log(`[DB RETRY] Attempt ${attempt} failed, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error;
        }
    }
};

class RestaurantService {

    async createRestaurant(data) {
        const { name, email, password, phone, address } = data;

        // Check existing email
        const normalizedEmail = normalizeEmail(email);
        const existingRestaurant = await retryDatabaseOperation(() =>
            Restaurant.findOne({ where: { email: normalizedEmail } })
        );

        if (existingRestaurant) {
            throw new Error("A restaurant with this email already exists");
        }

        // Generate Slug
        let slug = name.toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');

        let uniqueSlug = slug;
        let counter = 1;
        let slugExists = await retryDatabaseOperation(() =>
            Restaurant.findOne({ where: { slug: uniqueSlug } })
        );

        while (slugExists) {
            uniqueSlug = `${slug}-${counter}`;
            counter++;
            slugExists = await retryDatabaseOperation(() =>
                Restaurant.findOne({ where: { slug: uniqueSlug } })
            );
        }

        // Generate Code
        let restaurantCode;
        let isCodeUnique = false;
        while (!isCodeUnique) {
            const randomNum = Math.floor(1000 + Math.random() * 9000);
            restaurantCode = `QS${randomNum}`;
            const existingCode = await retryDatabaseOperation(() =>
                Restaurant.findOne({ where: { restaurantCode } })
            );
            if (!existingCode) isCodeUnique = true;
        }

        // Create Restaurant
        const restaurant = await retryDatabaseOperation(() =>
            Restaurant.create({
                name: name.trim(),
                slug: uniqueSlug,
                restaurantCode,
                email: normalizedEmail,
                password, // Hashed by hook
                phone: phone.trim(),
                address: address.trim(),
            })
        );

        // Generate Token
        const token = jwt.sign(
            { id: restaurant.id, email: restaurant.email, type: 'restaurant' },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }
        );

        return { restaurant, token };
    }

    async login(email, password) {
        const normalizedEmail = normalizeEmail(email);
        const restaurant = await Restaurant.findOne({
            where: { email: normalizedEmail, isActive: true }
        });

        if (!restaurant) throw new Error("Invalid email or password");

        const isValid = await restaurant.comparePassword(password);
        if (!isValid) throw new Error("Invalid email or password");

        const token = jwt.sign(
            { id: restaurant.id, email: restaurant.email, type: 'restaurant' },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }
        );

        return { restaurant, token };
    }

    async verifyAdminPassword(slug, password) {
        const restaurant = await Restaurant.findOne({
            where: { slug: slug.toLowerCase().trim(), isActive: true }
        });

        if (!restaurant) throw new Error("Restaurant not found");

        const isRegistrationValid = await restaurant.comparePassword(password);
        const isDashboardValid = await restaurant.compareDashboardPassword(password);

        if (!isRegistrationValid && !isDashboardValid) {
            throw new Error("Incorrect password");
        }

        return true;
    }

    async verifyAdminCode(code) {
        const restaurant = await Restaurant.findOne({
            where: { restaurantCode: code.toUpperCase().trim(), isActive: true }
        });
        if (!restaurant) throw new Error("Restaurant not found with this code");
        return restaurant;
    }

    async getRestaurantByCode(code) {
        const restaurant = await Restaurant.findOne({ where: { restaurantCode: code } });
        if (!restaurant || !restaurant.isActive) throw new Error("Restaurant not found");
        return restaurant;
    }

    async updatePaymentAccounts(code, paymentAccounts) {
        const restaurant = await Restaurant.findOne({ where: { restaurantCode: code } });
        if (!restaurant) throw new Error("Restaurant not found");

        restaurant.set('paymentAccounts', paymentAccounts);
        restaurant.changed('paymentAccounts', true);
        await restaurant.save();
        return restaurant.paymentAccounts;
    }

    async getProfile(restaurantId) {
        const restaurant = await Restaurant.findByPk(restaurantId);
        if (!restaurant || !restaurant.isActive) throw new Error("Restaurant not found");
        return restaurant;
    }

    async updateProfile(restaurantId, updateData) {
        const restaurant = await Restaurant.findByPk(restaurantId);
        if (!restaurant || !restaurant.isActive) throw new Error("Restaurant not found");

        const { phone, address, gstNumber, taxPercentage } = updateData;

        if (phone) restaurant.phone = phone;
        if (address) restaurant.address = address;
        if (gstNumber !== undefined) {
            restaurant.gstNumber = gstNumber ? gstNumber.toUpperCase() : null;
        }
        if (taxPercentage !== undefined) {
            restaurant.taxPercentage = parseFloat(taxPercentage);
        }

        await restaurant.save();
        return restaurant;
    }

    async verifySlugAndCode(slug, code) {
        const restaurant = await Restaurant.findOne({
            where: {
                slug: slug.toLowerCase(),
                restaurantCode: code.toUpperCase(),
                isActive: true
            }
        });
        if (!restaurant) throw new Error("Restaurant not found or invalid code");
        return restaurant;
    }

    async updateDashboardPassword(restaurantId, oldPassword, newPassword, userRole) {
        if (userRole !== 'admin') throw new Error("Access denied");

        const restaurant = await Restaurant.findByPk(restaurantId);
        if (!restaurant) throw new Error("Restaurant not found");

        const isOldValid = await restaurant.compareDashboardPassword(oldPassword);
        if (!isOldValid) throw new Error("Current dashboard password is incorrect");

        restaurant.dashboardPassword = newPassword;
        await restaurant.save();
        return true;
    }

    async getDashboardPasswordStatus(restaurantId, userRole) {
        if (userRole !== 'admin') throw new Error("Access denied");

        const restaurant = await Restaurant.findByPk(restaurantId);
        if (!restaurant) throw new Error("Restaurant not found");

        return await restaurant.isUsingDefaultDashboardPassword();
    }

    async setupStaffAccess(restaurantId, kitchenPassword, captainPassword) {
        const restaurant = await Restaurant.findByPk(restaurantId);
        if (!restaurant) throw new Error("Restaurant not found");

        const kitchenUsername = `kitchen_${restaurant.slug.replace(/-/g, '_')}`;
        const captainUsername = `captain_${restaurant.slug.replace(/-/g, '_')}`;

        const existingKitchen = await User.findOne({ where: { username: kitchenUsername, restaurantId } });
        const existingCaptain = await User.findOne({ where: { username: captainUsername, restaurantId } });

        if (existingKitchen || existingCaptain) {
            throw new Error("Staff accounts already exist");
        }

        const kitchenUser = await User.create({
            username: kitchenUsername,
            password: kitchenPassword,
            role: 'kitchen',
            restaurantId: restaurant.id,
            isOnline: false,
            lastActive: new Date()
        });

        const captainUser = await User.create({
            username: captainUsername,
            password: captainPassword,
            role: 'captain',
            restaurantId: restaurant.id,
            isOnline: false,
            lastActive: new Date()
        });

        return { kitchenUser, captainUser };
    }

    async getStaffSetupStatus(restaurantId) {
        const restaurant = await Restaurant.findByPk(restaurantId);
        if (!restaurant) throw new Error("Restaurant not found");

        const kitchenUsername = `kitchen_${restaurant.slug.replace(/-/g, '_')}`;
        const captainUsername = `captain_${restaurant.slug.replace(/-/g, '_')}`;

        const kitchenUser = await User.findOne({ where: { username: kitchenUsername, restaurantId, role: 'kitchen' } });
        const captainUser = await User.findOne({ where: { username: captainUsername, restaurantId, role: 'captain' } });

        return {
            restaurant,
            kitchen: { exists: !!kitchenUser, username: kitchenUsername },
            captain: { exists: !!captainUser, username: captainUsername }
        };
    }

    async updateStaffPasswords(restaurantId, kitchenPassword, captainPassword) {
        const restaurant = await Restaurant.findByPk(restaurantId);
        if (!restaurant) throw new Error("Restaurant not found");

        const updates = [];

        if (kitchenPassword) {
            const kitchenUsername = `kitchen_${restaurant.slug.replace(/-/g, '_')}`;
            let kitchenUser = await User.findOne({ where: { username: kitchenUsername, restaurantId, role: 'kitchen' } });

            if (kitchenUser) {
                kitchenUser.password = kitchenPassword;
                await kitchenUser.save();
                updates.push('kitchen');
            } else {
                await User.create({
                    username: kitchenUsername,
                    password: kitchenPassword,
                    role: 'kitchen',
                    restaurantId: restaurant.id,
                    isOnline: false,
                    lastActive: new Date()
                });
                updates.push('kitchen (created)');
            }
        }

        if (captainPassword) {
            const captainUsername = `captain_${restaurant.slug.replace(/-/g, '_')}`;
            let captainUser = await User.findOne({ where: { username: captainUsername, restaurantId, role: 'captain' } });

            if (captainUser) {
                captainUser.password = captainPassword;
                await captainUser.save();
                updates.push('captain');
            } else {
                await User.create({
                    username: captainUsername,
                    password: captainPassword,
                    role: 'captain',
                    restaurantId: restaurant.id,
                    isOnline: false,
                    lastActive: new Date()
                });
                updates.push('captain (created)');
            }
        }

        return updates;
    }

    async updateCredentials(restaurantCode, type, username, password) {
        const restaurant = await Restaurant.findOne({ where: { restaurantCode } });
        if (!restaurant) throw new Error("Restaurant not found");

        const currentSettings = restaurant.settings || {};
        const credentials = currentSettings.credentials || {};

        if (type === 'admin') {
            if (username) credentials.adminUsername = username;
            if (password) {
                const salt = await bcrypt.genSalt(10);
                credentials.adminPassword = await bcrypt.hash(password, salt);
            }
        } else if (type === 'kitchen') {
            if (username) credentials.kitchenUsername = username;
            if (password) {
                const salt = await bcrypt.genSalt(10);
                credentials.kitchenPassword = await bcrypt.hash(password, salt);
            }
        } else {
            throw new Error("Invalid type");
        }

        currentSettings.credentials = credentials;
        restaurant.set('settings', currentSettings);
        restaurant.changed('settings', true);
        await restaurant.save();

        return { type, usernameUpdated: !!username, passwordUpdated: !!password };
    }

    async getPublicInfo(identifier) {
        const cacheKey = cacheKeys.restaurant(identifier);
        const cached = cache.get(cacheKey);
        if (cached) return cached;

        let restaurant;
        const numericId = parseInt(identifier, 10);
        if (!isNaN(numericId) && numericId > 0) {
            restaurant = await Restaurant.findByPk(numericId);
        } else {
            restaurant = await Restaurant.findOne({ where: { slug: identifier.toLowerCase().trim() } });
        }

        if (!restaurant || !restaurant.isActive) throw new Error("Restaurant not found");

        const data = {
            id: restaurant.id,
            name: restaurant.name,
            slug: restaurant.slug,
            restaurantCode: restaurant.restaurantCode,
            taxPercentage: parseFloat(restaurant.taxPercentage) || 5.0,
            address: restaurant.address,
            phone: restaurant.phone
        };

        cache.set(cacheKey, data, 15 * 60 * 1000);
        return data;
    }
}

export default new RestaurantService();
