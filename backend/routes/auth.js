const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Register user (after OTP verification on frontend)
router.post('/register', async (req, res) => {
  console.log('Register request body:', req.body);
  const { name, phone, password, language, role } = req.body;
  if (!name || !phone || !password) return res.status(400).json({ error: 'Name, phone, and password are required' });
  if (!/^[0-9]{10}$/.test(phone)) return res.status(400).json({ error: 'Phone number must be 10 digits' });
  try {
    let user = await User.findOne({ phone });
    if (user) return res.status(400).json({ error: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ 
      name, 
      phone, 
      password: hashedPassword,
      language: language || 'en', // Default to English if not provided
      role: role || 'migrant' // Default to migrant if not provided
    });
    await user.save();
    console.log('User registered successfully:', { name: user.name, phone: user.phone, role: user.role });
    res.json({ message: 'User registered', user });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ error: 'Phone and password required' });
  try {
    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ error: 'User not found' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid password' });
    res.json({ message: 'Login successful', user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user by phone
router.get('/:phone', async (req, res) => {
  try {
    const user = await User.findOne({ phone: req.params.phone });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user language preference
router.put('/:phone/language', async (req, res) => {
  try {
    const { language } = req.body;
    if (!language) return res.status(400).json({ error: 'Language is required' });
    
    const user = await User.findOne({ phone: req.params.phone });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.language = language;
    await user.save();
    
    res.json({ message: 'Language preference updated', user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
