import express from 'express';
import { nanoid } from 'nanoid';
import { db } from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import emailService from '../services/emailService.js';

const router = express.Router();

// Create invite (admin only)
router.post('/create', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { email, expiresIn, sendEmail = true, recipientName } = req.body;
        const code = nanoid(10);

        let expiresAt = null;
        if (expiresIn) {
            const date = new Date();
            date.setDate(date.getDate() + expiresIn);
            expiresAt = date.toISOString();
        }

        await db.run(
            'INSERT INTO invites (code, email, created_by, expires_at) VALUES (?, ?, ?, ?)',
            [code, email, req.user.id, expiresAt]
        );

        const inviteUrl = `${process.env.FRONTEND_URL}/register?invite=${code}`;

        // Send email if requested and email is provided
        if (sendEmail && email) {
            try {
                await emailService.sendInviteEmail(email, {
                    code,
                    inviteUrl,
                    expiresAt,
                    inviterName: req.user.username,
                    recipientName
                });

                res.json({
                    code,
                    inviteUrl,
                    email,
                    expiresAt,
                    emailSent: true,
                    message: 'Invite created and email sent successfully'
                });
            } catch (emailError) {
                console.error('Email sending failed:', emailError);

                // Still return success but indicate email failed
                res.json({
                    code,
                    inviteUrl,
                    email,
                    expiresAt,
                    emailSent: false,
                    message: 'Invite created but email sending failed',
                    emailError: emailError.message
                });
            }
        } else {
            res.json({
                code,
                inviteUrl,
                email,
                expiresAt,
                emailSent: false
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create invite' });
    }
});

// Bulk invite creation (admin only)
router.post('/bulk-create', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { emails, expiresIn, sendEmails = true } = req.body;

        if (!Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({ error: 'Emails array is required' });
        }

        const invites = [];
        const emailResults = [];

        for (const emailData of emails) {
            const email = typeof emailData === 'string' ? emailData : emailData.email;
            const recipientName = typeof emailData === 'object' ? emailData.name : null;

            const code = nanoid(10);

            let expiresAt = null;
            if (expiresIn) {
                const date = new Date();
                date.setDate(date.getDate() + expiresIn);
                expiresAt = date.toISOString();
            }

            await db.run(
                'INSERT INTO invites (code, email, created_by, expires_at) VALUES (?, ?, ?, ?)',
                [code, email, req.user.id, expiresAt]
            );

            const inviteUrl = `${process.env.FRONTEND_URL}/register?invite=${code}`;

            invites.push({
                code,
                email,
                inviteUrl,
                expiresAt
            });

            if (sendEmails) {
                try {
                    await emailService.sendInviteEmail(email, {
                        code,
                        inviteUrl,
                        expiresAt,
                        inviterName: req.user.username,
                        recipientName
                    });

                    emailResults.push({
                        email,
                        sent: true
                    });
                } catch (emailError) {
                    emailResults.push({
                        email,
                        sent: false,
                        error: emailError.message
                    });
                }
            }
        }

        res.json({
            invites,
            emailResults: sendEmails ? emailResults : undefined,
            message: `Created ${invites.length} invites`
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create invites' });
    }
});

// Resend invite email
router.post('/resend/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const invite = await db.get(
            'SELECT i.*, u.username as inviter_name FROM invites i LEFT JOIN users u ON i.created_by = u.id WHERE i.id = ?',
            [req.params.id]
        );

        if (!invite) {
            return res.status(404).json({ error: 'Invite not found' });
        }

        if (!invite.email) {
            return res.status(400).json({ error: 'No email address associated with this invite' });
        }

        if (invite.is_used) {
            return res.status(400).json({ error: 'Invite has already been used' });
        }

        const inviteUrl = `${process.env.FRONTEND_URL}/register?invite=${invite.code}`;

        await emailService.sendInviteEmail(invite.email, {
            code: invite.code,
            inviteUrl,
            expiresAt: invite.expires_at,
            inviterName: invite.inviter_name
        });

        res.json({ message: 'Invite email resent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to resend invite' });
    }
});

// Test email configuration (admin only)
router.post('/test-email', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email address is required' });
        }

        await emailService.sendTestEmail(email);

        res.json({ message: 'Test email sent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Failed to send test email',
            details: error.message
        });
    }
});

// Get all invites (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const invites = await db.all(`
      SELECT i.*, u1.username as created_by_username, u2.username as used_by_username
      FROM invites i
      LEFT JOIN users u1 ON i.created_by = u1.id
      LEFT JOIN users u2 ON i.used_by = u2.id
      ORDER BY i.created_at DESC
    `);

        res.json(invites);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Validate invite code
router.get('/validate/:code', async (req, res) => {
    try {
        const invite = await db.get(
            'SELECT * FROM invites WHERE code = ? AND is_used = 0 AND (expires_at IS NULL OR expires_at > datetime("now"))',
            [req.params.code]
        );

        if (!invite) {
            return res.status(400).json({ valid: false, error: 'Invalid or expired invite code' });
        }

        res.json({ valid: true, email: invite.email });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Revoke invite
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await db.run('DELETE FROM invites WHERE id = ? AND is_used = 0', [req.params.id]);
        res.json({ message: 'Invite revoked' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;