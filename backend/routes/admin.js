import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Get all users
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, username, email, role, is_active, created_at, last_login FROM users';
    let countQuery = 'SELECT COUNT(*) as total FROM users';
    const params = [];

    if (search) {
      query += ' WHERE username LIKE ? OR email LIKE ?';
      countQuery += ' WHERE username LIKE ? OR email LIKE ?';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    const users = await db.all(query, [...params, limit, offset]);
    const { total } = await db.get(countQuery, params);

    // Get URL count for each user
    for (const user of users) {
      const { count } = await db.get('SELECT COUNT(*) as count FROM urls WHERE user_id = ?', [user.id]);
      user.urlCount = count;
    }

    res.json({
      users,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user details with URLs
router.get('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await db.get(
      'SELECT id, username, email, role, is_active, created_at, last_login FROM users WHERE id = ?',
      [req.params.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const urls = await db.all(
      'SELECT * FROM urls WHERE user_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );

    const urlsWithFullPath = urls.map(url => ({
      ...url,
      shortUrl: `${BASE_URL}/${url.short_code}`,
      password: undefined
    }));

    res.json({
      user,
      urls: urlsWithFullPath
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role, is_active } = req.body;

    await db.run(
      'UPDATE users SET role = ?, is_active = ? WHERE id = ?',
      [role, is_active, req.params.id]
    );

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all URLs (admin)
router.get('/all-urls', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const urls = await db.all(`
      SELECT u.*, usr.username, usr.email
      FROM urls u
      JOIN users usr ON u.user_id = usr.id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const { total } = await db.get('SELECT COUNT(*) as total FROM urls');

    const urlsWithFullPath = urls.map(url => ({
      ...url,
      shortUrl: `${BASE_URL}/${url.short_code}`,
      password: undefined
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

// Delete any URL (admin)
router.delete('/urls/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await db.run('DELETE FROM urls WHERE id = ?', [req.params.id]);
    res.json({ message: 'URL deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Dashboard stats
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { totalUsers } = await db.get('SELECT COUNT(*) as totalUsers FROM users');
    const { totalUrls } = await db.get('SELECT COUNT(*) as totalUrls FROM urls');
    const { totalClicks } = await db.get('SELECT SUM(clicks) as totalClicks FROM urls');
    const { todayUrls } = await db.get(`
      SELECT COUNT(*) as todayUrls FROM urls
      WHERE date(created_at) = date('now')
    `);

    res.json({
      totalUsers,
      totalUrls,
      totalClicks: totalClicks || 0,
      todayUrls
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
