module.exports = {
  apps: [
    {
      name: 'url-shortener',
      script: './server.js',
      interpreter: 'bun',
      env: {
        NODE_ENV: 'production',
        PORT: 3020,
        BASE_URL: 'https://shortener.roochedigital.com'
      }
    }
  ]
};