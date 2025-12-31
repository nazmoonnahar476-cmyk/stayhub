const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// Get dashboard statistics
router.get('/stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const [propertyCount] = await pool.execute('SELECT COUNT(*) as count FROM properties');
    const [bookingCount] = await pool.execute('SELECT COUNT(*) as count FROM bookings');
    const [activeBookingCount] = await pool.execute(
      "SELECT COUNT(*) as count FROM bookings WHERE status IN ('pending', 'confirmed')"
    );

    res.json({
      total_users: userCount[0].count,
      total_properties: propertyCount[0].count,
      total_bookings: bookingCount[0].count,
      active_bookings: activeBookingCount[0].count
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all properties (admin)
router.get('/properties', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [properties] = await pool.execute(
      'SELECT p.*, u.full_name as host_name FROM properties p JOIN users u ON p.host_id = u.id ORDER BY p.created_at DESC'
    );

    const propertiesWithParsedImages = properties.map(prop => ({
      ...prop,
      images: prop.images ? JSON.parse(prop.images) : [],
      amenities: prop.amenities ? JSON.parse(prop.amenities) : []
    }));

    res.json(propertiesWithParsedImages);
  } catch (error) {
    console.error('Get all properties error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

