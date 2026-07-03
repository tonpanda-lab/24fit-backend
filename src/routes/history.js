const express = require('express');
const UserData = require('../models/UserData');
const { authenticateToken } = require('../middleware/auth');
const { validatePagination, paginateArray } = require('../utils/pagination');

const router = express.Router();

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

    // Sort by updated_at descending, fallback to original array order
    const sortedMeals = [...meals].sort((a, b) => {
      const aUpdated = a.updated_at;
      const bUpdated = b.updated_at;

      if (!aUpdated && !bUpdated) return 0;
      if (!aUpdated) return 1;
      if (!bUpdated) return -1;

      const aDate = new Date(aUpdated);
      const bDate = new Date(bUpdated);

      if (Number.isNaN(aDate.getTime()) || Number.isNaN(bDate.getTime())) {
        return 0;
      }

      return bDate - aDate;
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

module.exports = router;
