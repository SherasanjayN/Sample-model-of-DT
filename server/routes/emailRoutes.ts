import { Router } from 'express';
import { db, SmtpConfig } from '../db';
import { authenticate, requireRole, AuthRequest } from '../auth';
import {
  sendLoanSanctionEmail,
  getActiveTransportMode,
  verifySmtp,
} from '../emailService';

const router = Router();

// GET /api/emails - Super Admin audit trail of all loan sanction notifications
router.get('/', authenticate, requireRole('SUPER_ADMIN'), (req: AuthRequest, res) => {
  const emails = db.getEmails();
  res.json(emails);
});

// GET /api/emails/smtp-config - Get current SMTP configuration and active delivery mode
router.get('/smtp-config', authenticate, requireRole('SUPER_ADMIN'), (req: AuthRequest, res) => {
  const currentConfig = db.getSmtpConfig();
  const transportMode = getActiveTransportMode();

  res.json({
    config: currentConfig
      ? {
          enabled: currentConfig.enabled,
          provider: currentConfig.provider,
          host: currentConfig.host,
          port: currentConfig.port,
          secure: currentConfig.secure,
          user: currentConfig.user,
          has_password: Boolean(currentConfig.pass),
          from_name: currentConfig.from_name,
          from_email: currentConfig.from_email,
        }
      : null,
    active_mode: transportMode.mode,
    active_transport: transportMode,
    is_configured: transportMode.isConfigured,
  });
});

// POST /api/emails/smtp-config - Save SMTP configuration and verify connection
router.post('/smtp-config', authenticate, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res) => {
  const { provider, host, port, secure, user, pass, from_name, from_email, enabled } = req.body;

  if (!user) {
    res.status(400).json({ error: 'Email username is required.' });
    return;
  }

  const existingConfig = db.getSmtpConfig();
  const finalPassword = pass || existingConfig?.pass || '';

  if (!finalPassword) {
    res.status(400).json({ error: 'Password or Google App Password is required.' });
    return;
  }

  const newConfig: SmtpConfig = {
    enabled: enabled !== false,
    provider: provider || (host && host.includes('gmail') ? 'gmail' : 'custom'),
    host: host || 'smtp.gmail.com',
    port: Number(port) || 465,
    secure: secure !== undefined ? Boolean(secure) : Number(port) === 465,
    user: user.trim(),
    pass: finalPassword.trim(),
    from_name: from_name?.trim() || 'Magalir Kuzhu Management System',
    from_email: from_email?.trim() || user.trim(),
  };

  // Test verify connection
  const verification = await verifySmtp(newConfig);

  // Save config
  db.setSmtpConfig(newConfig);

  res.json({
    message: verification.success
      ? 'SMTP credentials verified and saved successfully! Real email delivery is now active.'
      : 'SMTP credentials saved, but connection verification reported an issue. Please review details below.',
    verified: verification.success,
    verification_message: verification.message,
    verification_error: verification.error,
    config: {
      enabled: newConfig.enabled,
      provider: newConfig.provider,
      host: newConfig.host,
      port: newConfig.port,
      secure: newConfig.secure,
      user: newConfig.user,
      has_password: true,
      from_name: newConfig.from_name,
      from_email: newConfig.from_email,
    },
  });
});

// POST /api/emails/verify-smtp - Verify connection without changing config
router.post('/verify-smtp', authenticate, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res) => {
  const result = await verifySmtp(req.body);
  res.json(result);
});

// POST /api/emails/reset-smtp - Reset to Ethereal sandbox test mode
router.post('/reset-smtp', authenticate, requireRole('SUPER_ADMIN'), (req: AuthRequest, res) => {
  const current = db.getSmtpConfig();
  if (current) {
    db.setSmtpConfig({
      ...current,
      enabled: false,
    });
  }
  res.json({
    message: 'Switched to Developer Virtual Sandbox (Ethereal test mailbox).',
    active_mode: 'DEV_ETHEREAL',
  });
});

// POST /api/emails/test - Send a test email to verify delivery
router.post('/test', authenticate, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res) => {
  const { to, userName, amount } = req.body;
  const recipient = to || req.user?.email || 'sherasanjayn@gmail.com';
  const name = userName || req.user?.name || 'Sanjay N (Super Admin)';
  const loanAmount = Number(amount) || 5000;

  try {
    const log = await sendLoanSanctionEmail({
      userName: name,
      userEmail: recipient,
      amount: loanAmount,
    });

    const transportInfo = getActiveTransportMode();

    res.json({
      message: log.status === 'SENT'
        ? (log.delivery_mode === 'REAL_SMTP'
            ? `Real email delivered to ${recipient} via SMTP!`
            : `Test email dispatched to Developer Sandbox (Ethereal). Real inboxes require Gmail SMTP configuration.`)
        : `Email dispatch recorded with warning: ${log.info}`,
      log,
      delivery_mode: log.delivery_mode,
      transport: transportInfo,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to dispatch test email: ' + err.message });
  }
});

export default router;
