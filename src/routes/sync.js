const express = require('express');
const { v4: uuidv4 } = require('uuid');
const UserData = require('../models/UserData');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

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
    const { server_user_id, meal, items } = req.body;
    if (!server_user_id || server_user_id !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    let userData = await UserData.findOne({ userId: req.userId });
    if (!userData) {
      userData = new UserData({ userId: req.userId, meals: [] });
    }

    const incomingTimestamp = meal && meal.timestamp;
    let serverMealId;

    // Try to match by timestamp
    const existingIndex = userData.meals.findIndex(
      m => m.timestamp === incomingTimestamp
    );

    if (existingIndex >= 0) {
      serverMealId = userData.meals[existingIndex].server_meal_id || uuidv4();
      userData.meals[existingIndex] = {
        ...meal,
        items: items || meal.items || [],
        server_meal_id: serverMealId,
        updated_at: new Date().toISOString(),
      };
    } else {
      serverMealId = uuidv4();
      userData.meals.push({
        ...meal,
        items: items || meal.items || [],
        server_meal_id: serverMealId,
        updated_at: new Date().toISOString(),
      });
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
