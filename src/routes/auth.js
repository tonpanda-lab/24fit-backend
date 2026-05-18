const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { hashPassword, comparePassword } = require('../utils/password');

const router = express.Router();

function toUserResponse(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    display_name: user.displayName || null,
    photo_url: user.photoUrl || null,
  };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /v1/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      authProvider: 'email',
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user._id);

    return res.status(201).json({
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
      user: toUserResponse(user),
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user._id);

    return res.status(200).json({
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
      user: toUserResponse(user),
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Apple JWKS cache
let appleJwksCache = null;
let appleJwksCacheExpiry = 0;

async function getApplePublicKeys() {
  const now = Date.now();
  if (appleJwksCache && appleJwksCacheExpiry > now) {
    return appleJwksCache;
  }
  const res = await fetch('https://appleid.apple.com/auth/keys');
  if (!res.ok) throw new Error('Failed to fetch Apple public keys');
  const data = await res.json();
  appleJwksCache = data.keys;
  appleJwksCacheExpiry = now + 3600_000; // 1 hour
  return appleJwksCache;
}

function appleKeyToPem(key) {
  // Convert JWK to PEM using Node crypto
  const crypto = require('crypto');
  const { kty, n, e } = key;
  if (kty !== 'RSA') throw new Error('Unsupported Apple key type');
  const pubKey = { kty, n, e };
  return crypto.createPublicKey({ key: pubKey, format: 'jwk' }).export({ type: 'pkcs1', format: 'pem' });
}

async function verifyAppleToken(identityToken) {
  const decoded = jwt.decode(identityToken, { complete: true });
  if (!decoded || !decoded.header || !decoded.header.kid) {
    throw new Error('Invalid Apple token');
  }
  const keys = await getApplePublicKeys();
  const key = keys.find(k => k.kid === decoded.header.kid);
  if (!key) throw new Error('Apple signing key not found');
  const pem = appleKeyToPem(key);
  const payload = jwt.verify(identityToken, pem, { algorithms: ['RS256'] });
  return payload;
}

// POST /v1/auth/apple
router.post('/apple', async (req, res) => {
  try {
    const { identity_token } = req.body;
    if (!identity_token) {
      return res.status(401).json({ error: 'Missing identity token' });
    }

    let payload;
    try {
      payload = await verifyAppleToken(identity_token);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid Apple identity token' });
    }

    const appleUserId = payload.sub;
    const email = payload.email || null;

    let user = await User.findOne({ authProvider: 'apple', providerId: appleUserId });
    if (!user) {
      user = await User.create({
        email: email ? email.toLowerCase() : `${appleUserId}@apple.private`,
        authProvider: 'apple',
        providerId: appleUserId,
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user._id);

    return res.status(200).json({
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
      user: toUserResponse(user),
    });
  } catch (err) {
    console.error('Apple auth error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/auth/google
router.post('/google', async (req, res) => {
  try {
    const { id_token } = req.body;
    if (!id_token) {
      return res.status(401).json({ error: 'Missing ID token' });
    }

    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(id_token)}`);
    if (!googleRes.ok) {
      return res.status(401).json({ error: 'Invalid Google ID token' });
    }
    const payload = await googleRes.json();

    if (payload.error) {
      return res.status(401).json({ error: 'Invalid Google ID token' });
    }

    const googleUserId = payload.sub;
    const email = payload.email;
    const name = payload.name || null;
    const picture = payload.picture || null;

    let user = await User.findOne({ authProvider: 'google', providerId: googleUserId });
    if (!user) {
      user = await User.create({
        email: email.toLowerCase(),
        authProvider: 'google',
        providerId: googleUserId,
        displayName: name,
        photoUrl: picture,
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user._id);

    return res.status(200).json({
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
      user: toUserResponse(user),
    });
  } catch (err) {
    console.error('Google auth error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(401).json({ error: 'Missing refresh token' });
    }

    const tokenDoc = await RefreshToken.findOne({ token: refresh_token });
    if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(tokenDoc.userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const accessToken = generateAccessToken(user);

    return res.status(200).json({
      tokens: {
        access_token: accessToken,
        refresh_token: refresh_token,
      },
    });
  } catch (err) {
    console.error('Refresh error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/auth/logout
router.post('/logout', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (refresh_token) {
      await RefreshToken.deleteOne({ token: refresh_token });
    }
    return res.status(204).send();
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
