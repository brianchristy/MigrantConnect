const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get user profile by phone (excluding password)
router.get('/:phone', async (req, res) => {
    try {
        const user = await User.findOne({ phone: req.params.phone }).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user profile by phone
router.put('/:phone', async (req, res) => {
    try {
        const { name, aadhaar, language, password } = req.body;
        const updateData = { name, aadhaar, language };
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }
        const user = await User.findOneAndUpdate(
            { phone: req.params.phone },
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'Profile updated', user });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
