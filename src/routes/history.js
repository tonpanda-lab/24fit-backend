const express = require('express');
const UserData = require('../models/UserData');
const { authenticateToken } = require('../middleware/auth');
const { validatePagination, paginateArray } = require('../utils/pagination');
const { isValidDateString } = require('./sync');

const router = express.Router();

const MAX_DATE_RANGE_DAYS = 365;

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function getDateRange(startDateStr, endDateStr) {
  const startDate = new Date(startDateStr);
  const endDate = endDateStr ? new Date(endDateStr) : new Date();

  // Normalize to midnight UTC
  startDate.setUTCHours(0, 0, 0, 0);
  endDate.setUTCHours(0, 0, 0, 0);

  if (startDate > endDate) {
    return { valid: false, error: 'end_date must be on or after start_date' };
  }

  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  if (diffDays > MAX_DATE_RANGE_DAYS) {
    return { valid: false, error: `Date range cannot exceed ${MAX_DATE_RANGE_DAYS} days` };
  }

  const dates = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(formatDate(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return { valid: true, dates };
}

// GET /v1/history
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const validation = validatePagination(req.query);
    if (!validation.valid) {
      return res.status(validation.error.status).json({ error: validation.error.message });
    }

    const { page, limit } = validation;

    const userData = await UserData.findOne({ userId: req.userId }).lean();
    const meals = userData?.meals || [];

    // Sort by date descending, then updated_at descending
    const sortedMeals = [...meals].sort((a, b) => {
      const aDateStr = a.date;
      const bDateStr = b.date;

      if (aDateStr && bDateStr && aDateStr !== bDateStr) {
        return bDateStr.localeCompare(aDateStr);
      }

      const aUpdated = a.updated_at;
      const bUpdated = b.updated_at;

      if (!aUpdated && !bUpdated) return 0;
      if (!aUpdated) return 1;
      if (!bUpdated) return -1;

      const aUpdatedDate = new Date(aUpdated);
      const bUpdatedDate = new Date(bUpdated);

      if (Number.isNaN(aUpdatedDate.getTime()) || Number.isNaN(bUpdatedDate.getTime())) {
        return 0;
      }

      return bUpdatedDate - aUpdatedDate;
    });

    const { items, pagination } = paginateArray(sortedMeals, page, limit);

    return res.status(200).json({
      meals: items,
      pagination,
    });
  } catch (err) {
    next(err);
  }
});

// GET /v1/history/calories
router.get('/calories', authenticateToken, async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !isValidDateString(start_date)) {
      return res.status(400).json({ error: 'Invalid or missing start_date. Expected YYYY-MM-DD.' });
    }

    if (end_date && !isValidDateString(end_date)) {
      return res.status(400).json({ error: 'Invalid end_date. Expected YYYY-MM-DD.' });
    }

    const range = getDateRange(start_date, end_date);
    if (!range.valid) {
      return res.status(400).json({ error: range.error });
    }

    const userData = await UserData.findOne({ userId: req.userId }).lean();
    const meals = userData?.meals || [];

    // Aggregate calories per date
    const caloriesByDate = meals.reduce((acc, meal) => {
      const mealDate = meal.date;
      if (!mealDate || typeof meal.total_calories !== 'number') return acc;

      if (!acc[mealDate]) {
        acc[mealDate] = 0;
      }
      acc[mealDate] += meal.total_calories;
      return acc;
    }, {});

    const result = range.dates.map((date) => ({
      date,
      total_calories: caloriesByDate[date] || 0,
    }));

    return res.status(200).json({
      data: result,
      start_date: range.dates[0],
      end_date: range.dates[range.dates.length - 1],
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
