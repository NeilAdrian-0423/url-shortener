#!/bin/bash
cd /root/url-shortener/backend
export NODE_ENV=production
export PORT=3020
export BASE_URL=https://shortener.roochedigital.com
exec bun server.js
