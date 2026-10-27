import { Router } from 'express';
import { db } from '../db';
import { authenticate, requireRole, AuthRequest } from '../auth';
import { sendLoanSanctionEmail } from '../emailService';

const router = Router();

// GET /api/emails - Super Admin audit trail of all loan sanction notifications
router.get('/', authenticate, requireRole('SUPER_ADMIN'), (req: AuthRequest, res) => {
  const emails = db.getEmails();
  res.json(emails);
});

// POST /api/emails/test - Send a test email to verify email delivery
router.post('/test', authenticate, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res) => {
  const { to, userName, amount } = req.body;
  const recipient = to || req.user?.email || 'sherasanjayn@gmail.com';
  const name = userName || req.user?.name || 'Super Admin';
  const loanAmount = Number(amount) || 5000;

  try {
    const log = await sendLoanSanctionEmail({
      userName: name,
      userEmail: recipient,
      amount: loanAmount,
    });
    res.json({ message: 'Test sanction email dispatched', log });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to dispatch test email: ' + err.message });
  }
});

export default router;
