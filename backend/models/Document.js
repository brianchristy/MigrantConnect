const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  userPhone: { type: String, required: true },
  type: { type: String, required: true }, // 'aadhaar', 'pan', 'ration', 'employment'
  number: { type: String },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', DocumentSchema); 