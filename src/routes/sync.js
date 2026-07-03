const express = require('express');
const UserData = require('../models/UserData');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function isValidDateString(dateStr) {
  if (typeof dateStr !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !Number.isNaN(date.getTime());
}

function generateMealId(date, item) {
  const safeItem = String(item)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${date}-${safeItem}`;
}

// POST /v1/sync/profile
router.post('/profile', authenticateToken, async (req, res) => {
  try {
    const { server_user_id, profile } = req.body;
    if (!server_user_id || server_user_id !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await UserData.findOneAndUpdate(
      { userId: req.userId },
      { profile, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Sync profile error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/sync/meals
router.post('/meals', authenticateToken, async (req, res) => {
  try {
    const { server_user_id, date, item, total_calories } = req.body;

    if (!server_user_id || server_user_id !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!date || !isValidDateString(date)) {
      return res.status(400).json({ error: 'Invalid or missing date. Expected YYYY-MM-DD.' });
    }

    if (!item || typeof item !== 'string' || item.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid or missing item. Expected non-empty string.' });
    }

    if (typeof total_calories !== 'number' || Number.isNaN(total_calories) || total_calories < 0) {
      return res.status(400).json({ error: 'Invalid or missing total_calories. Expected non-negative number.' });
    }

    let userData = await UserData.findOne({ userId: req.userId });
    if (!userData) {
      userData = new UserData({ userId: req.userId, meals: [] });
    }

    const trimmedItem = item.trim();
    const serverMealId = generateMealId(date, trimmedItem);
    const existingIndex = userData.meals.findIndex(
      (m) => m.server_meal_id === serverMealId
    );

    const mealRecord = {
      server_meal_id: serverMealId,
      date,
      item: trimmedItem,
      total_calories: total_calories,
      updated_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      userData.meals[existingIndex] = mealRecord;
    } else {
      userData.meals.push(mealRecord);
    }

    userData.updatedAt = new Date();
    await userData.save();

    return res.status(200).json({ server_meal_id: serverMealId });
  } catch (err) {
    console.error('Sync meals error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /v1/sync/data
router.get('/data', authenticateToken, async (req, res) => {
  try {
    const { server_user_id } = req.query;
    if (!server_user_id || server_user_id !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const userData = await UserData.findOne({ userId: req.userId }).lean();
    if (!userData) {
      return res.status(200).json({ profile: null, meals: [] });
    }

    return res.status(200).json({
      profile: userData.profile || null,
      meals: userData.meals || [],
    });
  } catch (err) {
    console.error('Sync data error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
