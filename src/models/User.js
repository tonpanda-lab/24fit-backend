const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String },
  authProvider: { type: String, enum: ['email', 'apple', 'google'], required: true },
  providerId: { type: String },
  displayName: { type: String },
  photoUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
