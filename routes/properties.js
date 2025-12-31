const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all properties with filters
router.get('/', async (req, res) => {
  try {
    const { city, min_price, max_price, property_type, bedrooms, guests } = req.query;
    let query = 'SELECT p.*, u.full_name as host_name FROM properties p JOIN users u ON p.host_id = u.id WHERE p.is_available = TRUE';
    const params = [];

    if (city) {
      query += ' AND p.city LIKE ?';
      params.push(`%${city}%`);
    }
    if (min_price) {
      query += ' AND p.price_per_night >= ?';
      params.push(min_price);
    }
    if (max_price) {
      query += ' AND p.price_per_night <= ?';
      params.push(max_price);
    }
    if (property_type) {
      query += ' AND p.property_type = ?';
      params.push(property_type);
    }
    if (bedrooms) {
      query += ' AND p.bedrooms >= ?';
      params.push(bedrooms);
    }
    if (guests) {
      query += ' AND p.max_guests >= ?';
      params.push(guests);
    }

    query += ' ORDER BY p.created_at DESC';

    const [properties] = await pool.execute(query, params);
    
    // Parse images JSON
    const propertiesWithParsedImages = properties.map(prop => ({
      ...prop,
      images: prop.images ? JSON.parse(prop.images) : [],
      amenities: prop.amenities ? JSON.parse(prop.amenities) : []
    }));

    res.json(propertiesWithParsedImages);
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get featured properties (for homepage)
router.get('/featured', async (req, res) => {
  try {
    const [properties] = await pool.execute(
      'SELECT p.*, u.full_name as host_name FROM properties p JOIN users u ON p.host_id = u.id WHERE p.is_available = TRUE ORDER BY p.created_at DESC LIMIT 6'
    );

    const propertiesWithParsedImages = properties.map(prop => ({
      ...prop,
      images: prop.images ? JSON.parse(prop.images) : [],
      amenities: prop.amenities ? JSON.parse(prop.amenities) : []
    }));

    res.json(propertiesWithParsedImages);
  } catch (error) {
    console.error('Get featured properties error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single property
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [properties] = await pool.execute(
      'SELECT p.*, u.full_name as host_name, u.email as host_email, u.phone as host_phone FROM properties p JOIN users u ON p.host_id = u.id WHERE p.id = ?',
      [id]
    );

    if (properties.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const property = properties[0];
    property.images = property.images ? JSON.parse(property.images) : [];
    property.amenities = property.amenities ? JSON.parse(property.amenities) : [];

    // Get reviews
    const [reviews] = await pool.execute(
      'SELECT r.*, u.full_name as guest_name FROM reviews r JOIN users u ON r.guest_id = u.id WHERE r.property_id = ? ORDER BY r.created_at DESC',
      [id]
    );

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.json({ ...property, reviews, avg_rating: avgRating.toFixed(1) });
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Host: Create property
router.post('/', authenticate, authorize('host', 'admin'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('price_per_night').isFloat({ min: 0 }).withMessage('Valid price is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title, description, address, city, state, country,
      price_per_night, bedrooms, bathrooms, max_guests,
      property_type, amenities, house_rules, images
    } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO properties (host_id, title, description, address, city, state, country, 
       price_per_night, bedrooms, bathrooms, max_guests, property_type, amenities, house_rules, images)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id, title, description, address, city, state || null, country || 'Bangladesh',
        price_per_night, bedrooms || 1, bathrooms || 1, max_guests || 2,
        property_type || null, JSON.stringify(amenities || []), house_rules || null,
        JSON.stringify(images || [])
      ]
    );

    res.status(201).json({ message: 'Property created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Host: Update property
router.put('/:id', authenticate, authorize('host', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const [properties] = await pool.execute('SELECT host_id FROM properties WHERE id = ?', [id]);
    if (properties.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    if (properties[0].host_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updates = [];
    const values = [];

    const allowedFields = ['title', 'description', 'address', 'city', 'state', 'country',
      'price_per_night', 'bedrooms', 'bathrooms', 'max_guests', 'property_type', 'house_rules', 'is_available'];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }

    if (req.body.amenities !== undefined) {
      updates.push('amenities = ?');
      values.push(JSON.stringify(req.body.amenities));
    }

    if (req.body.images !== undefined) {
      updates.push('images = ?');
      values.push(JSON.stringify(req.body.images));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    await pool.execute(`UPDATE properties SET ${updates.join(', ')} WHERE id = ?`, values);

    res.json({ message: 'Property updated successfully' });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Host: Delete property
router.delete('/:id', authenticate, authorize('host', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const [properties] = await pool.execute('SELECT host_id FROM properties WHERE id = ?', [id]);
    if (properties.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    if (properties[0].host_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await pool.execute('DELETE FROM properties WHERE id = ?', [id]);
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Host: Get my properties
router.get('/host/my-properties', authenticate, authorize('host', 'admin'), async (req, res) => {
  try {
    const [properties] = await pool.execute(
      'SELECT * FROM properties WHERE host_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    const propertiesWithParsedImages = properties.map(prop => ({
      ...prop,
      images: prop.images ? JSON.parse(prop.images) : [],
      amenities: prop.amenities ? JSON.parse(prop.amenities) : []
    }));

    res.json(propertiesWithParsedImages);
  } catch (error) {
    console.error('Get my properties error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

