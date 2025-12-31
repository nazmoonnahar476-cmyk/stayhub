const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Guest: Create booking
router.post('/', authenticate, [
  body('property_id').isInt().withMessage('Valid property ID is required'),
  body('check_in').isISO8601().withMessage('Valid check-in date is required'),
  body('check_out').isISO8601().withMessage('Valid check-out date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { property_id, check_in, check_out, guest_message } = req.body;
    const checkIn = new Date(check_in);
    const checkOut = new Date(check_out);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validation
    if (checkIn < today) {
      return res.status(400).json({ error: 'Check-in date cannot be in the past' });
    }
    if (checkOut <= checkIn) {
      return res.status(400).json({ error: 'Check-out date must be after check-in date' });
    }

    // Check property exists and is available
    const [properties] = await pool.execute(
      'SELECT * FROM properties WHERE id = ? AND is_available = TRUE',
      [property_id]
    );

    if (properties.length === 0) {
      return res.status(404).json({ error: 'Property not found or not available' });
    }

    const property = properties[0];

    // Check for booking conflicts
    const [conflicts] = await pool.execute(
      `SELECT id FROM bookings 
       WHERE property_id = ? 
       AND status IN ('pending', 'confirmed')
       AND ((check_in <= ? AND check_out > ?) OR (check_in < ? AND check_out >= ?))`,
      [property_id, checkIn, checkIn, checkOut, checkOut]
    );

    if (conflicts.length > 0) {
      return res.status(400).json({ error: 'Property is not available for the selected dates' });
    }

    // Calculate total price
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * parseFloat(property.price_per_night);

    // Create booking
    const [result] = await pool.execute(
      `INSERT INTO bookings (guest_id, property_id, check_in, check_out, total_price, guest_message, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [req.user.id, property_id, check_in, check_out, totalPrice, guest_message || null]
    );

    // Create notification for host
    await pool.execute(
      'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
      [property.host_id, `New booking request for ${property.title}`, 'booking_request']
    );

    res.status(201).json({
      message: 'Booking request created successfully',
      booking_id: result.insertId,
      total_price: totalPrice,
      nights
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's bookings
router.get('/my-bookings', authenticate, async (req, res) => {
  try {
    const isHost = req.user.role === 'host' || req.user.role === 'admin';
    
    let query, params;
    if (isHost) {
      query = `SELECT b.*, p.title, p.address, p.city, p.images, u.full_name as guest_name, u.email as guest_email
               FROM bookings b
               JOIN properties p ON b.property_id = p.id
               JOIN users u ON b.guest_id = u.id
               WHERE p.host_id = ?
               ORDER BY b.created_at DESC`;
      params = [req.user.id];
    } else {
      query = `SELECT b.*, p.title, p.address, p.city, p.images, u.full_name as host_name
               FROM bookings b
               JOIN properties p ON b.property_id = p.id
               JOIN users u ON p.host_id = u.id
               WHERE b.guest_id = ?
               ORDER BY b.created_at DESC`;
      params = [req.user.id];
    }

    const [bookings] = await pool.execute(query, params);

    const bookingsWithParsedImages = bookings.map(booking => ({
      ...booking,
      images: booking.images ? JSON.parse(booking.images) : []
    }));

    res.json(bookingsWithParsedImages);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single booking
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const [bookings] = await pool.execute(
      `SELECT b.*, p.*, u1.full_name as guest_name, u1.email as guest_email, u2.full_name as host_name, u2.email as host_email
       FROM bookings b
       JOIN properties p ON b.property_id = p.id
       JOIN users u1 ON b.guest_id = u1.id
       JOIN users u2 ON p.host_id = u2.id
       WHERE b.id = ?`,
      [id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];
    
    // Check authorization
    if (booking.guest_id !== req.user.id && booking.host_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    booking.images = booking.images ? JSON.parse(booking.images) : [];
    booking.amenities = booking.amenities ? JSON.parse(booking.amenities) : [];

    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Host: Accept/Reject booking
router.put('/:id/status', authenticate, authorize('host', 'admin'), [
  body('status').isIn(['confirmed', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, host_response } = req.body;

    // Check booking exists and host owns the property
    const [bookings] = await pool.execute(
      `SELECT b.*, p.host_id FROM bookings b JOIN properties p ON b.property_id = p.id WHERE b.id = ?`,
      [id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];
    if (booking.host_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Booking status cannot be changed' });
    }

    await pool.execute(
      'UPDATE bookings SET status = ?, host_response = ? WHERE id = ?',
      [status, host_response || null, id]
    );

    // Create notification for guest
    await pool.execute(
      'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
      [booking.guest_id, `Your booking has been ${status}`, 'booking_update']
    );

    res.json({ message: `Booking ${status} successfully` });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Guest: Cancel booking
router.put('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check booking exists and belongs to guest
    const [bookings] = await pool.execute(
      'SELECT * FROM bookings WHERE id = ? AND guest_id = ?',
      [id, req.user.id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    // Check if check-in date has passed
    const checkIn = new Date(booking.check_in);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn <= today) {
      return res.status(400).json({ error: 'Cannot cancel booking after check-in date' });
    }

    await pool.execute('UPDATE bookings SET status = ? WHERE id = ?', ['cancelled', id]);

    // Get property for notification
    const [properties] = await pool.execute('SELECT host_id, title FROM properties WHERE id = ?', [booking.property_id]);
    if (properties.length > 0) {
      await pool.execute(
        'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
        [properties[0].host_id, `Booking for ${properties[0].title} has been cancelled`, 'booking_cancelled']
      );
    }

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Get all bookings
router.get('/admin/all', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [bookings] = await pool.execute(
      `SELECT b.*, p.title, u1.full_name as guest_name, u2.full_name as host_name
       FROM bookings b
       JOIN properties p ON b.property_id = p.id
       JOIN users u1 ON b.guest_id = u1.id
       JOIN users u2 ON p.host_id = u2.id
       ORDER BY b.created_at DESC`
    );
    res.json(bookings);
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

