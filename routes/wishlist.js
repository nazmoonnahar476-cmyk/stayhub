const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Add to wishlist
router.post('/:property_id', authenticate, async (req, res) => {
  try {
    const { property_id } = req.params;

    // Check property exists
    const [properties] = await pool.execute('SELECT id FROM properties WHERE id = ?', [property_id]);
    if (properties.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check if already in wishlist
    const [existing] = await pool.execute(
      'SELECT id FROM wishlist WHERE guest_id = ? AND property_id = ?',
      [req.user.id, property_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Property already in wishlist' });
    }

    await pool.execute(
      'INSERT INTO wishlist (guest_id, property_id) VALUES (?, ?)',
      [req.user.id, property_id]
    );

    res.status(201).json({ message: 'Added to wishlist' });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove from wishlist
router.delete('/:property_id', authenticate, async (req, res) => {
  try {
    const { property_id } = req.params;

    await pool.execute(
      'DELETE FROM wishlist WHERE guest_id = ? AND property_id = ?',
      [req.user.id, property_id]
    );

    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's wishlist
router.get('/', authenticate, async (req, res) => {
  try {
    const [wishlist] = await pool.execute(
      `SELECT p.*, u.full_name as host_name
       FROM wishlist w
       JOIN properties p ON w.property_id = p.id
       JOIN users u ON p.host_id = u.id
       WHERE w.guest_id = ?
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );

    const propertiesWithParsedImages = wishlist.map(prop => ({
      ...prop,
      images: prop.images ? JSON.parse(prop.images) : [],
      amenities: prop.amenities ? JSON.parse(prop.amenities) : []
    }));

    res.json(propertiesWithParsedImages);
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

