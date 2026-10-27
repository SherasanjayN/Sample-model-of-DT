import { Router } from 'express';
import { db, Loan, LoanStatusEntry, generateInstallments, RepaymentFrequency } from '../db';
import { authenticate, requireRole, AuthRequest } from '../auth';
import { sendLoanSanctionEmail } from '../emailService';

const router = Router();

// GET /api/loans - Filtered by role
router.get('/', authenticate, (req: AuthRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const allLoans = db.getLoans();

  if (req.user.role === 'SUPER_ADMIN') {
    res.json(allLoans);
    return;
  }

  if (req.user.role === 'GROUP_ADMIN') {
    if (!req.user.group_id) {
      res.json([]);
      return;
    }
    const groupLoans = allLoans.filter(l => l.group_id === req.user!.group_id);
    res.json(groupLoans);
    return;
  }

  // Regular member
  const userLoans = allLoans.filter(l => l.user_id === req.user!.id);
  res.json(userLoans);
});

// GET /api/loans/:id
router.get('/:id', authenticate, (req: AuthRequest, res) => {
  const loan = db.findLoanById(req.params.id);
  if (!loan) {
    res.status(404).json({ error: 'Loan request not found' });
    return;
  }

  // Check authorization
  if (
    req.user?.role !== 'SUPER_ADMIN' &&
    !(req.user?.role === 'GROUP_ADMIN' && req.user?.group_id === loan.group_id) &&
    req.user?.id !== loan.user_id
  ) {
    res.status(403).json({ error: 'Access denied.' });
    return;
  }

  res.json(loan);
});

// POST /api/loans/request - Member submits loan request
router.post('/request', authenticate, (req: AuthRequest, res) => {
  const user = req.user!;

  if (user.status !== 'APPROVED') {
    res.status(403).json({ error: 'Only approved members can request loans.' });
    return;
  }

  if (!user.group_id) {
    res.status(400).json({ error: 'You must be assigned to an active Magalir Kuzhu group before requesting a loan.' });
    return;
  }

  const group = db.findGroupById(user.group_id);
  if (!group) {
    res.status(400).json({ error: 'Assigned group could not be found.' });
    return;
  }

  const { amount, payment_mode, upi_email, purpose, repayment_frequency, tenure_period } = req.body;

  // Validation: Amount must be number ≤ 10,000
  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    res.status(400).json({ error: 'Please enter a valid loan amount.' });
    return;
  }

  if (parsedAmount > 10000) {
    res.status(400).json({ error: 'Loan amount cannot exceed the ₹10,000 cap per Magalir Kuzhu regulations.' });
    return;
  }

  // Payment mode check
  if (!['UPI', 'CASH'].includes(payment_mode)) {
    res.status(400).json({ error: 'Disbursal mode must be either UPI or CASH.' });
    return;
  }

  // Repayment model: WEEKLY vs MONTHLY
  const freq: RepaymentFrequency = repayment_frequency === 'MONTHLY' ? 'MONTHLY' : 'WEEKLY';
  const tenure = Number(tenure_period) || (freq === 'WEEKLY' ? 10 : 6);

  // If UPI: require entering and verifying registered email ID
  if (payment_mode === 'UPI') {
    if (!upi_email || typeof upi_email !== 'string') {
      res.status(400).json({ error: 'UPI payment requires entering your registered email ID for verification.' });
      return;
    }

    if (upi_email.trim().toLowerCase() !== user.email.toLowerCase()) {
      res.status(400).json({
        error: `UPI verification failed: Entered email does not match your registered email address (${user.email}).`,
      });
      return;
    }
  }

  const now = new Date().toISOString();
  const initialHistory: LoanStatusEntry = {
    status: 'PENDING_GROUP_ADMIN',
    updated_at: now,
    updated_by_name: user.name,
    updated_by_role: 'USER',
    note: `Loan requested for ₹${parsedAmount.toLocaleString('en-IN')} via ${payment_mode} (${freq} repayment across ${tenure} cycles)${
      payment_mode === 'UPI' ? ' (UPI ID verified: ' + upi_email.trim() + ')' : ' (Cash at group meeting)'
    }${purpose ? ' - Purpose: ' + purpose.trim() : ''}`,
  };

  const newLoan: Loan = {
    id: 'loan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    user_id: user.id,
    user_name: user.name,
    user_phone: user.phone,
    user_email: user.email,
    group_id: group.id,
    group_name: group.group_name,
    amount: parsedAmount,
    payment_mode,
    upi_email: payment_mode === 'UPI' ? upi_email.trim().toLowerCase() : undefined,
    purpose: purpose ? purpose.trim() : '',
    status: 'PENDING_GROUP_ADMIN',
    requested_at: now,
    status_history: [initialHistory],
    repayment_frequency: freq,
    tenure_period: tenure,
    total_paid: 0,
    remaining_balance: parsedAmount,
  };

  db.addLoan(newLoan);

  res.status(201).json({
    message: 'Loan application submitted successfully. Forwarded to your Group Admin for first-tier review.',
    loan: newLoan,
  });
});

// POST /api/loans/:id/group-approve - Group Admin review
router.post('/:id/group-approve', authenticate, requireRole('GROUP_ADMIN', 'SUPER_ADMIN'), (req: AuthRequest, res) => {
  const loan = db.findLoanById(req.params.id);
  if (!loan) {
    res.status(404).json({ error: 'Loan not found.' });
    return;
  }

  // Ensure group admin is reviewing their own group's member
  if (req.user?.role === 'GROUP_ADMIN' && req.user?.group_id !== loan.group_id) {
    res.status(403).json({ error: 'You can only review loan requests for your own group.' });
    return;
  }

  if (loan.status !== 'PENDING_GROUP_ADMIN') {
    res.status(400).json({ error: `Cannot approve from current state: ${loan.status}` });
    return;
  }

  const { note } = req.body;
  const now = new Date().toISOString();

  const historyEntry: LoanStatusEntry = {
    status: 'PENDING_SUPER_ADMIN',
    updated_at: now,
    updated_by_name: req.user!.name,
    updated_by_role: req.user!.role,
    note: note ? note.trim() : 'Approved by Group Admin. Forwarded to Super Admin for final sanction.',
  };

  const updated = db.updateLoan(loan.id, {
    status: 'PENDING_SUPER_ADMIN',
    status_history: [...loan.status_history, historyEntry],
  });

  res.json({
    message: 'Loan approved by Group Admin and forwarded to Super Admin.',
    loan: updated,
  });
});

// POST /api/loans/:id/group-reject - Group Admin rejects
router.post('/:id/group-reject', authenticate, requireRole('GROUP_ADMIN', 'SUPER_ADMIN'), (req: AuthRequest, res) => {
  const loan = db.findLoanById(req.params.id);
  if (!loan) {
    res.status(404).json({ error: 'Loan not found.' });
    return;
  }

  if (req.user?.role === 'GROUP_ADMIN' && req.user?.group_id !== loan.group_id) {
    res.status(403).json({ error: 'You can only review loan requests for your own group.' });
    return;
  }

  const { note } = req.body;
  const now = new Date().toISOString();

  const historyEntry: LoanStatusEntry = {
    status: 'REJECTED',
    updated_at: now,
    updated_by_name: req.user!.name,
    updated_by_role: req.user!.role,
    note: note ? note.trim() : 'Rejected by Group Admin during group verification.',
  };

  const updated = db.updateLoan(loan.id, {
    status: 'REJECTED',
    status_history: [...loan.status_history, historyEntry],
  });

  res.json({
    message: 'Loan application was rejected.',
    loan: updated,
  });
});

// POST /api/loans/:id/super-approve - Super Admin final sanction
router.post('/:id/super-approve', authenticate, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res) => {
  const loan = db.findLoanById(req.params.id);
  if (!loan) {
    res.status(404).json({ error: 'Loan not found.' });
    return;
  }

  if (loan.status === 'APPROVED') {
    res.status(400).json({ error: 'This loan has already been approved and sanctioned.' });
    return;
  }

  const { note } = req.body;
  const now = new Date().toISOString();

  const historyEntry: LoanStatusEntry = {
    status: 'APPROVED',
    updated_at: now,
    updated_by_name: req.user!.name,
    updated_by_role: 'SUPER_ADMIN',
    note: note ? note.trim() : 'Final loan sanction granted by Super Admin. Funds released for disbursal.',
  };

  const installments = loan.installments && loan.installments.length > 0
    ? loan.installments
    : generateInstallments(loan.amount, loan.repayment_frequency || 'WEEKLY', loan.tenure_period);

  const updated = db.updateLoan(loan.id, {
    status: 'APPROVED',
    sanction_date: now,
    installments,
    total_paid: loan.total_paid || 0,
    remaining_balance: loan.remaining_balance !== undefined ? loan.remaining_balance : loan.amount,
    next_due_date: installments[0]?.due_date,
    status_history: [...loan.status_history, historyEntry],
  });

  // Trigger real email notification per PRD:
  let emailResult = null;
  try {
    emailResult = await sendLoanSanctionEmail({
      userName: loan.user_name,
      userEmail: loan.user_email,
      amount: loan.amount,
    });
  } catch (emailErr) {
    console.error('Failed to dispatch sanction email:', emailErr);
  }

  res.json({
    message: `Loan sanctioned successfully! Notification email dispatched to ${loan.user_email}.`,
    loan: updated,
    emailResult,
  });
});

// POST /api/loans/:id/super-reject - Super Admin rejects
router.post('/:id/super-reject', authenticate, requireRole('SUPER_ADMIN'), (req: AuthRequest, res) => {
  const loan = db.findLoanById(req.params.id);
  if (!loan) {
    res.status(404).json({ error: 'Loan not found.' });
    return;
  }

  const { note } = req.body;
  const now = new Date().toISOString();

  const historyEntry: LoanStatusEntry = {
    status: 'REJECTED',
    updated_at: now,
    updated_by_name: req.user!.name,
    updated_by_role: 'SUPER_ADMIN',
    note: note ? note.trim() : 'Application rejected by Super Admin during central review.',
  };

  const updated = db.updateLoan(loan.id, {
    status: 'REJECTED',
    status_history: [...loan.status_history, historyEntry],
  });

  res.json({
    message: 'Loan application was rejected by Super Admin.',
    loan: updated,
  });
});

// POST /api/loans/:id/repay - Record installment repayment (Group Admin or Super Admin)
router.post('/:id/repay', authenticate, requireRole('GROUP_ADMIN', 'SUPER_ADMIN'), (req: AuthRequest, res) => {
  const loan = db.findLoanById(req.params.id);
  if (!loan) {
    res.status(404).json({ error: 'Loan not found.' });
    return;
  }

  if (loan.status !== 'APPROVED') {
    res.status(400).json({ error: 'Cannot record repayments on un-sanctioned loans.' });
    return;
  }

  if (req.user?.role === 'GROUP_ADMIN' && req.user?.group_id !== loan.group_id) {
    res.status(403).json({ error: 'You can only record repayments for members of your own group.' });
    return;
  }

  const { installment_number, amount, payment_mode, note } = req.body;
  const numInst = Number(installment_number);
  const numAmount = Number(amount);

  if (isNaN(numInst) || numInst <= 0) {
    res.status(400).json({ error: 'Invalid installment cycle number.' });
    return;
  }

  if (isNaN(numAmount) || numAmount <= 0) {
    res.status(400).json({ error: 'Please enter a valid repayment amount.' });
    return;
  }

  const mode = payment_mode === 'UPI' ? 'UPI' : 'CASH';

  const updatedLoan = db.recordRepayment(loan.id, numInst, {
    amount: numAmount,
    mode,
    recorded_by_name: req.user!.name,
    note: note ? String(note).trim() : undefined,
  });

  if (!updatedLoan) {
    res.status(400).json({ error: 'Failed to record installment payment.' });
    return;
  }

  res.json({
    message: `Payment of ₹${numAmount.toLocaleString('en-IN')} recorded successfully for Cycle #${numInst}.`,
    loan: updatedLoan,
  });
});

// GET /api/loans/:id/ledger - Get full repayment ledger
router.get('/:id/ledger', authenticate, (req: AuthRequest, res) => {
  const loan = db.findLoanById(req.params.id);
  if (!loan) {
    res.status(404).json({ error: 'Loan not found.' });
    return;
  }

  if (
    req.user?.role !== 'SUPER_ADMIN' &&
    !(req.user?.role === 'GROUP_ADMIN' && req.user?.group_id === loan.group_id) &&
    req.user?.id !== loan.user_id
  ) {
    res.status(403).json({ error: 'Access denied.' });
    return;
  }

  // Ensure installments exist if approved
  if (loan.status === 'APPROVED' && (!loan.installments || loan.installments.length === 0)) {
    loan.installments = generateInstallments(loan.amount, loan.repayment_frequency || 'WEEKLY', loan.tenure_period);
    loan.total_paid = 0;
    loan.remaining_balance = loan.amount;
    loan.next_due_date = loan.installments[0]?.due_date;
    db.save();
  }

  res.json({
    loan_id: loan.id,
    user_name: loan.user_name,
    amount: loan.amount,
    frequency: loan.repayment_frequency || 'WEEKLY',
    total_paid: loan.total_paid || 0,
    remaining_balance: loan.remaining_balance !== undefined ? loan.remaining_balance : loan.amount,
    next_due_date: loan.next_due_date,
    installments: loan.installments || [],
  });
});

export default router;
