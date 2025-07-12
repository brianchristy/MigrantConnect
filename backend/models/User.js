const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String },
  phone: { type: String, required: true, unique: true },
  aadhaar: { type: String, sparse: true, unique: true },
  password: { type: String, required: true },
  language: { type: String, default: 'en' },
  role: { type: String, enum: ['migrant', 'requester'], default: 'migrant' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
