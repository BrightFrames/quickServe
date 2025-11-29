import express from 'express';
import PromoCode from '../models/PromoCode.js';
import { Op } from 'sequelize';
import { authenticateRestaurant } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateRestaurant);

// Get all promo codes for the restaurant
router.get('/', async (req, res) => {
  try {
    const promoCodes = await PromoCode.findAll({
      where: { restaurantId: req.restaurantId },
      order: [['createdAt', 'DESC']],
    });
    res.json(promoCodes);
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    res.status(500).json({ error: 'Failed to fetch promo codes' });
  }
});

// Create new promo code
router.post('/', async (req, res) => {
  try {
    const { code, discountPercentage, validFrom, validTo, maxUses, minOrderAmount } = req.body;

    // Check if code already exists for this restaurant
    const existing = await PromoCode.findOne({ 
      where: { 
        code: code.toUpperCase(),
        restaurantId: req.restaurantId 
      } 
    });
    if (existing) {
      return res.status(400).json({ error: 'Promo code already exists' });
    }

    const promoCode = await PromoCode.create({
      code,
      discountPercentage,
      validFrom: validFrom || null,
      validTo: validTo || null,
      maxUses: maxUses || null,
      minOrderAmount: minOrderAmount || 0,
      restaurantId: req.restaurantId,
    });

    res.status(201).json(promoCode);
  } catch (error) {
    console.error('Error creating promo code:', error);
    res.status(500).json({ error: 'Failed to create promo code' });
  }
});

// Update promo code
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, discountPercentage, isActive, validFrom, validTo, maxUses, minOrderAmount } = req.body;

    const promoCode = await PromoCode.findOne({ 
      where: { 
        id, 
        restaurantId: req.restaurantId 
      } 
    });
    if (!promoCode) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    // Check if new code conflicts with existing
    if (code && code.toUpperCase() !== promoCode.code) {
      const existing = await PromoCode.findOne({ 
        where: { 
          code: code.toUpperCase(),
          restaurantId: req.restaurantId 
        } 
      });
      if (existing) {
        return res.status(400).json({ error: 'Promo code already exists' });
      }
    }

    await promoCode.update({
      code: code || promoCode.code,
      discountPercentage: discountPercentage !== undefined ? discountPercentage : promoCode.discountPercentage,
      isActive: isActive !== undefined ? isActive : promoCode.isActive,
      validFrom: validFrom !== undefined ? validFrom : promoCode.validFrom,
      validTo: validTo !== undefined ? validTo : promoCode.validTo,
      maxUses: maxUses !== undefined ? maxUses : promoCode.maxUses,
      minOrderAmount: minOrderAmount !== undefined ? minOrderAmount : promoCode.minOrderAmount,
    });

    res.json(promoCode);
  } catch (error) {
    console.error('Error updating promo code:', error);
    res.status(500).json({ error: 'Failed to update promo code' });
  }
});

// Delete promo code
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const promoCode = await PromoCode.findOne({ 
      where: { 
        id, 
        restaurantId: req.restaurantId 
      } 
    });
    if (!promoCode) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    await promoCode.destroy();
    res.json({ message: 'Promo code deleted successfully' });
  } catch (error) {
    console.error('Error deleting promo code:', error);
    res.status(500).json({ error: 'Failed to delete promo code' });
  }
});

// Validate promo code (for customer use) - no auth required
router.post('/validate', async (req, res) => {
  try {
    const { code, orderAmount, restaurantId } = req.body;

    if (!code || !restaurantId) {
      return res.status(400).json({ error: 'Promo code and restaurant ID are required' });
    }

    const promoCode = await PromoCode.findOne({
      where: {
        code: code.toUpperCase(),
        restaurantId: restaurantId,
      },
    });

    if (!promoCode) {
      return res.status(404).json({ error: 'Invalid promo code' });
    }

    // Check if valid
    if (!promoCode.isValid()) {
      return res.status(400).json({ error: 'Promo code is expired or not available' });
    }

    // Check minimum order amount
    if (orderAmount < promoCode.minOrderAmount) {
      return res.status(400).json({
        error: `Minimum order amount of ₹${promoCode.minOrderAmount} required`,
      });
    }

    res.json({
      valid: true,
      discountPercentage: promoCode.discountPercentage,
      code: promoCode.code,
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    res.status(500).json({ error: 'Failed to validate promo code' });
  }
});

// Toggle promo code active status
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    const promoCode = await PromoCode.findOne({ 
      where: { 
        id, 
        restaurantId: req.restaurantId 
      } 
    });
    if (!promoCode) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    await promoCode.update({ isActive: !promoCode.isActive });
    res.json(promoCode);
  } catch (error) {
    console.error('Error toggling promo code:', error);
    res.status(500).json({ error: 'Failed to toggle promo code status' });
  }
});

export default router;
