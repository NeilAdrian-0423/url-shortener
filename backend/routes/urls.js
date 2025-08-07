import express from 'express';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import { db } from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Create short URL
router.post('/shorten', authenticateToken, async (req, res) => {
  try {
    const { url, customAlias, password } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    // Check if custom alias exists
    if (customAlias) {
      const existing = await db.get(
        'SELECT * FROM urls WHERE short_code = ? OR custom_alias = ?',
        [customAlias, customAlias]
      );

      if (existing) {
        return res.status(409).json({ error: 'Alias already exists' });
      }
    }

    const shortCode = customAlias || nanoid(7);
    let hashedPassword = null;
    let isPasswordProtected = false;

    // Hash password if provided
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
      isPasswordProtected = true;
    }

    // Insert new URL
    const result = await db.run(
      `INSERT INTO urls (user_id, short_code, long_url, custom_alias, password, is_password_protected)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, shortCode, url, customAlias, hashedPassword, isPasswordProtected]
    );

    res.json({
      id: result.lastID,
      shortUrl: `${BASE_URL}/${shortCode}`,
      shortCode,
      longUrl: url,
      isPasswordProtected,
      clicks: 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's URLs
router.get('/my-urls', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM urls WHERE user_id = ?';
    let countQuery = 'SELECT COUNT(*) as total FROM urls WHERE user_id = ?';
    const params = [req.user.id];

    if (search) {
      query += ' AND (long_url LIKE ? OR short_code LIKE ? OR custom_alias LIKE ?)';
      countQuery += ' AND (long_url LIKE ? OR short_code LIKE ? OR custom_alias LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    const urls = await db.all(query, [...params, limit, offset]);
    const { total } = await db.get(countQuery, params);

    const urlsWithFullPath = urls.map(url => ({
      ...url,
      shortUrl: `${BASE_URL}/${url.short_code}`,
      password: undefined // Don't send password hash to client
    }));

    res.json({
      urls: urlsWithFullPath,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update URL
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { password, removePassword } = req.body;

    // Check ownership
    const url = await db.get('SELECT * FROM urls WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    if (removePassword) {
      await db.run(
        'UPDATE urls SET password = NULL, is_password_protected = 0 WHERE id = ?',
        [req.params.id]
      );
    } else if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.run(
        'UPDATE urls SET password = ?, is_password_protected = 1 WHERE id = ?',
        [hashedPassword, req.params.id]
      );
    }

    res.json({ message: 'URL updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete URL
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.run(
      'DELETE FROM urls WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'URL not found' });
    }

    res.json({ message: 'URL deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get URL analytics
router.get('/analytics/:id', authenticateToken, async (req, res) => {
  try {
    const url = await db.get(
      'SELECT * FROM urls WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    const clicks = await db.all(
      'SELECT * FROM clicks WHERE url_id = ? ORDER BY clicked_at DESC LIMIT 100',
      [req.params.id]
    );

    res.json({
      url: {
        ...url,
        shortUrl: `${BASE_URL}/${url.short_code}`,
        password: undefined
      },
      clicks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
