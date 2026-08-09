const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify a Google ID token and return normalized user info.
 * @param {string} idToken
 * @returns {Promise<{ providerId: string, email: string, displayName?: string, photoUrl?: string }>}
 */
async function verifyGoogleIdToken(idToken) {
  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  } catch (err) {
    throw new Error(`Invalid Google ID token: ${err.message}`);
  }

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Invalid Google ID token: missing payload');
  }

  if (!payload.sub || !payload.email) {
    throw new Error('Invalid Google ID token: missing required claims');
  }

  return {
    providerId: payload.sub,
    email: payload.email.toLowerCase(),
    displayName: payload.name || undefined,
    photoUrl: payload.picture || undefined,
  };
}

module.exports = {
  verifyGoogleIdToken,
};
