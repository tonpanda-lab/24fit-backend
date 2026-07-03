const express = require('express');
const UserData = require('../models/UserData');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /v1/profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userData = await UserData.findOne({ userId: req.userId }).lean();

    return res.status(200).json({
      profile: userData?.profile || null,
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
