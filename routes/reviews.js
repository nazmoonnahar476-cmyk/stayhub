const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Create review
router.post('/', authenticate, [
  body('booking_id').isInt().withMessage('Valid booking ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { booking_id, rating, comment } = req.body;

    // Check booking exists and belongs to user
    const [bookings] = await pool.execute(
      'SELECT * FROM bookings WHERE id = ? AND guest_id = ?',
      [booking_id, req.user.id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];

    // Check if booking is completed or confirmed
    if (booking.status !== 'confirmed' && booking.status !== 'completed') {
      return res.status(400).json({ error: 'Can only review confirmed or completed bookings' });
    }

    // Check if review already exists
    const [existing] = await pool.execute(
      'SELECT id FROM reviews WHERE booking_id = ?',
      [booking_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Review already exists for this booking' });
    }

    // Create review
    await pool.execute(
      'INSERT INTO reviews (booking_id, guest_id, property_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [booking_id, req.user.id, booking.property_id, rating, comment || null]
    );

    res.status(201).json({ message: 'Review created successfully' });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get reviews for a property
router.get('/property/:property_id', async (req, res) => {
  try {
    const { property_id } = req.params;
    const [reviews] = await pool.execute(
      `SELECT r.*, u.full_name as guest_name, u.username
       FROM reviews r
       JOIN users u ON r.guest_id = u.id
       WHERE r.property_id = ?
       ORDER BY r.created_at DESC`,
      [property_id]
    );
    res.json(reviews);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

