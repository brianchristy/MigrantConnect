const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Document = require('../models/Document');
const fs = require('fs');
// In-memory token store: { token: { docId, expiresAt } }
const downloadTokens = {};
const crypto = require('crypto');

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

// Delete a document by ID (must come before /:userPhone route)
router.delete('/:id', async (req, res) => {
  try {
    console.log('Delete request for document ID:', req.params.id);
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      console.log('Document not found for ID:', req.params.id);
      return res.status(404).json({ error: 'Document not found' });
    }
    // Remove file from disk
    if (fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
      console.log('File deleted from disk:', doc.filePath);
    }
    await Document.deleteOne({ _id: req.params.id });
    console.log('Document deleted from database:', req.params.id);
    res.json({ message: 'Document deleted' });
  } catch (err) {
    console.error('Delete document error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Download document with role-based access
router.get('/:docId/download', async (req, res) => {
  try {
    const { docId } = req.params;
    const { role } = req.query; // Get role from query parameter
    
    const doc = await Document.findById(docId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    
    if (!fs.existsSync(doc.filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // For requesters, redirect directly to file download
    if (role === 'requester') {
      res.redirect(`http://192.168.214.237:5000/api/documents/${docId}/file`);
    } else {
      // For migrants, allow direct download
      res.download(doc.filePath, doc.fileName);
    }
  } catch (err) {
    console.error('Document download error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Simple file download endpoint
router.get('/:docId/file', async (req, res) => {
  try {
    const { docId } = req.params;
    const doc = await Document.findById(docId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    
    if (!fs.existsSync(doc.filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.download(doc.filePath, doc.fileName);
  } catch (err) {
    console.error('Document file error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Secure document viewing for requesters (with screenshot prevention)
router.get('/view/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const tokenData = downloadTokens[token];
    
    if (!tokenData || new Date() > tokenData.expiresAt) {
      delete downloadTokens[token];
      return res.status(401).json({ error: 'Access expired or invalid' });
    }
    
    const doc = await Document.findById(tokenData.docId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    
    if (!fs.existsSync(doc.filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Set headers to prevent screenshots and downloads
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Send the file
    const fileStream = fs.createReadStream(doc.filePath);
    fileStream.pipe(res);
    
    // Clean up token after sending
    setTimeout(() => {
      delete downloadTokens[token];
    }, 5000); // Clean up after 5 seconds
    
  } catch (err) {
    console.error('Document view error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate a time-limited download link
router.post('/:id/generate-link', async (req, res) => {
  try {
    const docId = req.params.id;
    const doc = await Document.findById(docId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    // Generate a random token
    const token = crypto.randomBytes(16).toString('hex');
    // Set expiry (2 minutes from now)
    const expiresAt = Date.now() + 2 * 60 * 1000;
    downloadTokens[token] = { docId, expiresAt };
    // Return the download URL
    const downloadUrl = `${req.protocol}://${req.get('host')}/api/documents/download/${token}`;
    res.json({ url: downloadUrl, expiresAt });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Time-limited download endpoint
router.get('/download/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const entry = downloadTokens[token];
    if (!entry) return res.status(403).json({ error: 'Invalid or expired token' });
    if (Date.now() > entry.expiresAt) {
      delete downloadTokens[token];
      return res.status(403).json({ error: 'Token expired' });
    }
    const doc = await Document.findById(entry.docId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    // Optionally, delete the token after use (one-time link)
    // delete downloadTokens[token];
    res.download(doc.filePath, doc.fileName);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// List all documents for a user (must come last to avoid conflicts)
router.get('/:userPhone', async (req, res) => {
  try {
    const docs = await Document.find({ userPhone: req.params.userPhone });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 