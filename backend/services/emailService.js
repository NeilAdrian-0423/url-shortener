import { createTransport } from 'nodemailer';  // Changed from default import
import winston from 'winston';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Optional: Only import if you want HTML templates
// import Handlebars from 'handlebars';
// import juice from 'juice';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Email logger
const emailLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'email.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class EmailService {
  constructor() {
    this.transporter = null;
    this.templates = {};
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Create transporter based on SMTP settings
      this.transporter = createTransport({  // Use createTransport directly
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        // Additional settings for better reliability
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 5
      });

      // Verify connection
      await this.transporter.verify();
      emailLogger.info('SMTP connection verified successfully');

      // Load email templates
      await this.loadTemplates();

      this.initialized = true;
      emailLogger.info('Email service initialized successfully');
    } catch (error) {
      emailLogger.error('Failed to initialize email service:', error);
      throw error;
    }
  }

  async loadTemplates() {
    try {
      const templatesDir = path.join(__dirname, '../templates');

      // Create templates directory if it doesn't exist
      try {
        await fs.mkdir(templatesDir, { recursive: true });
      } catch (err) {
        // Directory might already exist
      }

      // For now, we'll use inline templates instead of Handlebars
      // This avoids the dependency issues
      this.templates.invite = (data) => this.getInviteHTML(data);
      this.templates.welcome = (data) => this.getWelcomeHTML(data);
      this.templates.passwordReset = (data) => this.getPasswordResetHTML(data);

      emailLogger.info('Email templates loaded');
    } catch (error) {
      emailLogger.error('Failed to load email templates:', error);
      throw error;
    }
  }

  getInviteHTML(data) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited!</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 10px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 48px;
      margin-bottom: 10px;
    }
    h1 {
      color: #667eea;
      margin: 0;
      font-size: 28px;
    }
    .content {
      margin: 30px 0;
    }
    .invite-box {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px;
      text-align: center;
      margin: 30px 0;
    }
    .invite-code {
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 2px;
      margin: 20px 0;
      font-family: 'Courier New', monospace;
    }
    .button {
      display: inline-block;
      padding: 14px 30px;
      background: white;
      color: #667eea;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      margin-top: 20px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      color: #666;
      font-size: 14px;
    }
    .expires {
      background: #fff3cd;
      color: #856404;
      padding: 10px;
      border-radius: 5px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🔗</div>
      <h1>URL Shortener</h1>
    </div>
    
    <div class="content">
      <h2>Hello${data.recipientName ? ' ' + data.recipientName : ''}!</h2>
      
      <p>${data.inviterName ? data.inviterName + ' has' : "You've been"} invited to join our URL Shortener service!</p>
      
      <div class="invite-box">
        <p style="margin: 0; font-size: 18px;">Your Invite Code:</p>
        <div class="invite-code">${data.inviteCode}</div>
        <a href="${data.inviteUrl}" class="button">Join Now</a>
      </div>
      
      ${data.expiresAt ? `
      <div class="expires">
        ⏰ This invite expires on ${new Date(data.expiresAt).toLocaleDateString()}
      </div>
      ` : ''}
      
      <h3>Getting Started:</h3>
      <ol>
        <li>Click the "Join Now" button above or visit the registration page</li>
        <li>Enter your invite code: <strong>${data.inviteCode}</strong></li>
        <li>Create your account with your chosen username and password</li>
        <li>Start creating short URLs immediately!</li>
      </ol>
      
      <h3>What you can do:</h3>
      <ul>
        <li>✨ Create unlimited short URLs</li>
        <li>🔒 Password protect your links</li>
        <li>📊 Track click analytics</li>
        <li>🎨 Custom aliases for your URLs</li>
        <li>📱 Access from any device</li>
      </ul>
    </div>
    
    <div class="footer">
      <p>If you didn't expect this invitation, please ignore this email.</p>
      <p>© ${new Date().getFullYear()} URL Shortener. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  getWelcomeHTML(data) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Welcome to URL Shortener!</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 10px;
      padding: 40px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    h1 {
      color: #667eea;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome, ${data.username}! 🎉</h1>
    </div>
    <p>Your account has been successfully created. You can now start creating short URLs!</p>
    <p>Login at: <a href="${data.loginUrl}">${data.loginUrl}</a></p>
  </div>
</body>
</html>
    `;
  }

  getPasswordResetHTML(data) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Password Reset</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 10px;
      padding: 40px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Password Reset Request</h1>
    <p>Click the link below to reset your password:</p>
    <p><a href="${data.resetUrl}" class="button">Reset Password</a></p>
    <p>This link expires in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  </div>
</body>
</html>
    `;
  }

  async sendInviteEmail(to, inviteData) {
    await this.initialize();

    try {
      const html = this.templates.invite({
        recipientName: inviteData.recipientName || '',
        inviterName: inviteData.inviterName || '',
        inviteCode: inviteData.code,
        inviteUrl: inviteData.inviteUrl,
        expiresAt: inviteData.expiresAt,
        currentYear: new Date().getFullYear()
      });

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'URL Shortener'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
        to: to,
        subject: inviteData.subject || 'You\'re invited to join URL Shortener! 🎉',
        html: html,
        text: this.getPlainTextInvite(inviteData)
      };

      const info = await this.transporter.sendMail(mailOptions);

      emailLogger.info('Invite email sent successfully', {
        to,
        messageId: info.messageId,
        inviteCode: inviteData.code
      });

      return info;
    } catch (error) {
      emailLogger.error('Failed to send invite email:', error);
      throw error;
    }
  }

  getPlainTextInvite(inviteData) {
    return `
Hello${inviteData.recipientName ? ' ' + inviteData.recipientName : ''}!

${inviteData.inviterName ? inviteData.inviterName + ' has' : "You've been"} invited to join our URL Shortener service!

Your Invite Code: ${inviteData.code}

To get started:
1. Visit: ${inviteData.inviteUrl}
2. Enter your invite code: ${inviteData.code}
3. Create your account
4. Start creating short URLs!

${inviteData.expiresAt ? `This invite expires on ${new Date(inviteData.expiresAt).toLocaleDateString()}` : ''}

What you can do:
- Create unlimited short URLs
- Password protect your links
- Track click analytics
- Custom aliases for your URLs
- Access from any device

If you didn't expect this invitation, please ignore this email.

Best regards,
URL Shortener Team
    `;
  }

  async sendWelcomeEmail(to, userData) {
    await this.initialize();

    try {
      const html = this.templates.welcome({
        username: userData.username,
        loginUrl: `${process.env.FRONTEND_URL}/login`
      });

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'URL Shortener'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
        to: to,
        subject: 'Welcome to URL Shortener! 🚀',
        html: html,
        text: `Welcome ${userData.username}!\n\nYour account has been successfully created.\n\nLogin at: ${process.env.FRONTEND_URL}/login`
      };

      const info = await this.transporter.sendMail(mailOptions);

      emailLogger.info('Welcome email sent successfully', {
        to,
        messageId: info.messageId
      });

      return info;
    } catch (error) {
      emailLogger.error('Failed to send welcome email:', error);
      // Don't throw - welcome emails are not critical
    }
  }

  async sendTestEmail(to) {
    await this.initialize();

    try {
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'URL Shortener'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
        to: to,
        subject: 'Test Email - URL Shortener',
        html: `
          <h1>Test Email</h1>
          <p>This is a test email from your URL Shortener service.</p>
          <p>If you received this, your email configuration is working correctly! ✅</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        `,
        text: 'This is a test email from URL Shortener. Your email configuration is working!'
      };

      const info = await this.transporter.sendMail(mailOptions);

      emailLogger.info('Test email sent successfully', {
        to,
        messageId: info.messageId
      });

      return info;
    } catch (error) {
      emailLogger.error('Failed to send test email:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new EmailService();