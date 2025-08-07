# URL Shortener

A simple self-hosted URL shortener built with Vue 3 and Node.js/Bun.

## Features

- Shorten long URLs
- Custom aliases for links
- Password protect links
- Basic analytics (click tracking)
- Simple admin panel
- Multi-user support with invites

## Tech Stack

- **Backend**: Node.js/Bun + Express + SQLite
- **Frontend**: Vue 3 + Tailwind CSS

## Quick Start

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your settings
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Then visit:
- App: http://localhost:5173
- API: http://localhost:3000

Default login: `admin` / `admin123`

## Configuration

Edit `backend/.env`:

```env
PORT=3000
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-secret-key

# For email invites (optional)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
```

## API Examples

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Create short URL
```bash
curl -X POST http://localhost:3000/api/urls/shorten \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

## Project Structure

```
├── backend/           # API server
│   ├── server.js     # Main server
│   ├── routes/       # API routes
│   └── database.js   # SQLite setup
└── frontend/         # Vue app
    └── src/
        ├── views/    # Pages
        └── components/
```