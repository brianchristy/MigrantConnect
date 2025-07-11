const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Document = require('../models/Document');
const fs = require('fs');

// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Upload document
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { userPhone, type, number } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (!userPhone || !type) return res.status(400).json({ error: 'userPhone and type are required' });
    const doc = new Document({
      userPhone,
      type,
      number,
      fileName: req.file.originalname,
      filePath: req.file.path
    });
    await doc.save();
    console.log(`Document uploaded: userPhone=${userPhone}, type=${type}, number=${number}, fileName=${req.file.originalname}`);
    res.json({ message: 'Document uploaded', document: doc });
  } catch (err) {
    console.error('Document upload error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Download document
router.get('/:id/download', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.download(doc.filePath, doc.fileName);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// List all documents for a user
router.get('/:userPhone', async (req, res) => {
  try {
    const docs = await Document.find({ userPhone: req.params.userPhone });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 