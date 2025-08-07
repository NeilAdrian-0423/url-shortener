import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { initDB, db } from './database.js';
import authRoutes from './routes/auth.js';
import urlRoutes from './routes/urls.js';
import adminRoutes from './routes/admin.js';
import inviteRoutes from './routes/invites.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(cors());
app.use(express.json());
app.use('/api/', limiter);

// Initialize database
initDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/invites', inviteRoutes);

// Public redirect endpoint with password check
app.get('/:code', async (req, res) => {
  try {
    const url = await db.get(
      'SELECT * FROM urls WHERE short_code = ? OR custom_alias = ?',
      [req.params.code, req.params.code]
    );

    if (!url) {
      return res.status(404).send('URL not found');
    }

    // If password protected, show password form
    if (url.is_password_protected) {
      const { pwd } = req.query;

      if (!pwd) {
        // Return HTML form for password
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Password Protected URL</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              }
              .container {
                background: white;
                padding: 2rem;
                border-radius: 10px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                max-width: 400px;
                width: 100%;
              }
              h2 {
                margin: 0 0 1rem 0;
                color: #333;
              }
              .form-group {
                margin-bottom: 1rem;
                display: flex;
              }
              input {
                width: 100%;
                padding: 0.75rem;
                border: 1px solid #ddd;
                border-radius: 5px;
                font-size: 1rem;
              }
              button {
                width: 100%;
                padding: 0.75rem;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 5px;
                font-size: 1rem;
                cursor: pointer;
              }
              button:hover {
                background: #5a67d8;
              }
              .error {
                color: #e53e3e;
                margin-top: 0.5rem;
                display: none;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>🔒 Password Protected URL</h2>
              <p>This link requires a password to access.</p>
              <form id="passwordForm" action="/${req.params.code}" method="GET">
                <div class="form-group">
                  <input type="password" id="password" name="pwd" placeholder="Enter password" required autofocus>
                </div>
                <button type="submit">Access URL</button>
                <div class="error" id="error">Incorrect password</div>
              </form>
            </div>
            <script>
              // Display error if URL has ?error=1
              if (new URLSearchParams(window.location.search).get('error') === '1') {
                document.getElementById('error').style.display = 'block';
              }
            </script>
          </body>
          </html>
        `);
      }

      // Verify password
      const validPassword = await bcrypt.compare(pwd, url.password);
      if (!validPassword) {
        // Redirect back to the same URL with an error query parameter
        return res.redirect(`/${req.params.code}?error=1`);
      }
    }

    // Update click count and last accessed
    await db.run(
      'UPDATE urls SET clicks = clicks + 1, last_accessed = CURRENT_TIMESTAMP WHERE id = ?',
      [url.id]
    );

    // Log click
    await db.run(
      'INSERT INTO clicks (url_id, ip_address, user_agent, referrer) VALUES (?, ?, ?, ?)',
      [url.id, req.ip, req.get('user-agent'), req.get('referrer') || null]
    );

    // Redirect to the long URL
    res.redirect(301, url.long_url);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

app.listen(PORT, () => {
  console.log(`Server running at ${BASE_URL}`);
});