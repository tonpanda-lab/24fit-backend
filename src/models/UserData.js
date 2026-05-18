const mongoose = require('mongoose');

const userDataSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  profile: { type: Object },
  meals: [{ type: Object }],
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('UserData', userDataSchema);
