const express = require('express');
const UserData = require('../models/UserData');
const { authenticateToken } = require('../middleware/auth');
const { generateMealId, validateMealInput, parseTimestamp, isValidDateString } = require('./sync');

const router = express.Router();

// PUT /v1/meals/:server_meal_id
router.put('/:server_meal_id', authenticateToken, async (req, res) => {
  try {
    const { server_meal_id } = req.params;
    const { date, timestamp, item, total_calories } = req.body;

    const validation = validateMealInput(date, item, total_calories);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const parsedTimestamp = parseTimestamp(timestamp);
    if (parsedTimestamp === null) {
      return res.status(400).json({ error: 'Invalid timestamp.' });
    }

    const userData = await UserData.findOne({ userId: req.userId });
    if (!userData) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    const existingIndex = userData.meals.findIndex(
      (m) => m.server_meal_id === server_meal_id
    );

    if (existingIndex < 0) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    const trimmedItem = item.trim();
    const newServerMealId = generateMealId(date, parsedTimestamp, trimmedItem);

    // If the new ID already exists on a different record, reject to avoid collision
    const collisionIndex = userData.meals.findIndex(
      (m) => m.server_meal_id === newServerMealId && m.server_meal_id !== server_meal_id
    );
    if (collisionIndex >= 0) {
      return res.status(409).json({ error: 'A meal with the same date, timestamp, and item already exists' });
    }

    userData.meals[existingIndex] = {
      server_meal_id: newServerMealId,
      date,
      timestamp: parsedTimestamp,
      item: trimmedItem,
      total_calories,
      updated_at: new Date().toISOString(),
    };

    userData.updatedAt = new Date();
    await userData.save();

    return res.status(200).json({ server_meal_id: newServerMealId });
  } catch (err) {
    console.error('Update meal error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /v1/meals/:server_meal_id
router.delete('/:server_meal_id', authenticateToken, async (req, res) => {
  try {
    const { server_meal_id } = req.params;

    const userData = await UserData.findOne({ userId: req.userId });
    if (!userData) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    const existingIndex = userData.meals.findIndex(
      (m) => m.server_meal_id === server_meal_id
    );

    if (existingIndex < 0) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    userData.meals.splice(existingIndex, 1);
    userData.updatedAt = new Date();
    await userData.save();

    return res.status(204).send();
  } catch (err) {
    console.error('Delete meal error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
