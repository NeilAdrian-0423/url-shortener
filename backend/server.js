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
app.set('trust proxy', true);
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Add this for form data
app.use('/api/', limiter);

// Initialize database
initDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/invites', inviteRoutes);

// Password verification endpoint (POST method - more secure)
app.post('/verify-password/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const { password } = req.body;

    console.log(`Password verification attempt for code: ${code}`);

    const url = await db.get(
      'SELECT * FROM urls WHERE short_code = ? OR custom_alias = ?',
      [code, code]
    );

    if (!url) {
      return res.status(404).json({ success: false, error: 'URL not found' });
    }

    if (!url.is_password_protected) {
      return res.json({ success: true, url: url.long_url });
    }

    const validPassword = await bcrypt.compare(password, url.password);

    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid password' });
    }

    // Log the click
    await db.run(
      'UPDATE urls SET clicks = clicks + 1, last_accessed = CURRENT_TIMESTAMP WHERE id = ?',
      [url.id]
    );

    await db.run(
      'INSERT INTO clicks (url_id, ip_address, user_agent, referrer) VALUES (?, ?, ?, ?)',
      [url.id, req.ip, req.get('user-agent'), req.get('referrer') || null]
    );

    res.json({ success: true, url: url.long_url });
  } catch (error) {
    console.error('Error in password verification:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Public redirect endpoint
app.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    console.log(`Redirect request for code: ${code}`);

    const url = await db.get(
      'SELECT * FROM urls WHERE short_code = ? OR custom_alias = ?',
      [code, code]
    );

    if (!url) {
      console.log(`URL not found for code: ${code}`);
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>URL Not Found</title>
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
              text-align: center;
            }
            h1 { color: #e53e3e; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>404 - URL Not Found</h1>
            <p>The short URL you're looking for doesn't exist.</p>
          </div>
        </body>
        </html>
      `);
    }

    // If password protected, show password form
    if (url.is_password_protected) {
      console.log(`URL ${code} is password protected, showing form`);
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Password Protected URL</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
              width: 90%;
            }
            h2 {
              margin: 0 0 1rem 0;
              color: #333;
            }
            .form-group {
              margin-bottom: 1rem;
            }
            input {
              width: 100%;
              padding: 0.75rem;
              border: 1px solid #ddd;
              border-radius: 5px;
              font-size: 1rem;
              box-sizing: border-box;
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
            button:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
            .error {
              color: #e53e3e;
              margin-top: 0.5rem;
              display: none;
              padding: 0.5rem;
              background: #fed7d7;
              border-radius: 5px;
            }
            .success {
              color: #38a169;
              margin-top: 0.5rem;
              display: none;
              padding: 0.5rem;
              background: #c6f6d5;
              border-radius: 5px;
            }
            .loading {
              display: none;
              text-align: center;
              color: #667eea;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>🔒 Password Protected URL</h2>
            <p>This link requires a password to access.</p>
            <form id="passwordForm">
              <div class="form-group">
                <input type="password" id="password" placeholder="Enter password" required autofocus>
              </div>
              <button type="submit" id="submitBtn">Access URL</button>
              <div class="error" id="error"></div>
              <div class="success" id="success">Password correct! Redirecting...</div>
              <div class="loading" id="loading">Verifying password...</div>
            </form>
          </div>
          <script>
            document.getElementById('passwordForm').addEventListener('submit', async (e) => {
              e.preventDefault();
              
              const password = document.getElementById('password').value;
              const errorDiv = document.getElementById('error');
              const successDiv = document.getElementById('success');
              const loadingDiv = document.getElementById('loading');
              const submitBtn = document.getElementById('submitBtn');
              
              // Reset states
              errorDiv.style.display = 'none';
              successDiv.style.display = 'none';
              loadingDiv.style.display = 'block';
              submitBtn.disabled = true;
              submitBtn.textContent = 'Verifying...';
              
              try {
                // Use the full URL for the request
                const response = await fetch('https://shortener.roochedigital.com/verify-password/${code}', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                  successDiv.style.display = 'block';
                  // Redirect to the target URL
                  setTimeout(() => {
                    window.location.href = data.url;
                  }, 500);
                } else {
                  errorDiv.textContent = data.error || 'Incorrect password';
                  errorDiv.style.display = 'block';
                  submitBtn.disabled = false;
                  submitBtn.textContent = 'Access URL';
                }
              } catch (error) {
                console.error('Error:', error);
                errorDiv.textContent = 'Network error. Please try again.';
                errorDiv.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Access URL';
              } finally {
                loadingDiv.style.display = 'none';
              }
            });
          </script>
        </body>
        </html>
      `);
    }

    // Not password protected, redirect directly
    console.log(`Redirecting to ${url.long_url} for code: ${code}`);

    // Update click count
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
    console.error('Error in redirect:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Server Error</title>
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
            text-align: center;
          }
          h1 { color: #e53e3e; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>500 - Server Error</h1>
          <p>An error occurred while processing your request.</p>
        </div>
      </body>
      </html>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`Server running at ${BASE_URL}`);
});