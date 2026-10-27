import { Router } from 'express';
import { db, SosAlert } from '../db';
import { authenticate, AuthRequest } from '../auth';

const router = Router();

// GET /api/sos
router.get('/', authenticate, (req: AuthRequest, res) => {
  const user = req.user!;
  if (user.role === 'SUPER_ADMIN') {
    res.json(db.getSosAlerts());
    return;
  }

  if (user.group_id) {
    res.json(db.getSosAlerts(user.group_id));
    return;
  }

  res.json([]);
});

// POST /api/sos - Member logs emergency SOS panic alert
router.post('/', authenticate, (req: AuthRequest, res) => {
  const user = req.user!;
  const { crisis_type, description, amount_requested } = req.body;

  if (!description || typeof description !== 'string' || !description.trim()) {
    res.status(400).json({ error: 'Please describe the emergency crisis.' });
    return;
  }

  const group = user.group_id ? db.findGroupById(user.group_id) : null;

  const newAlert: SosAlert = {
    id: 'sos_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    user_id: user.id,
    user_name: user.name,
    user_phone: user.phone,
    group_id: user.group_id || 'unassigned',
    group_name: group ? group.group_name : 'General Unassigned',
    crisis_type: crisis_type || 'HEALTH',
    description: description.trim(),
    amount_requested: amount_requested ? Number(amount_requested) : undefined,
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
  };

  db.addSosAlert(newAlert);

  res.status(201).json({
    message: '🚨 Emergency SOS panic alert broadcasted to Group Admin and Super Admin.',
    alert: newAlert,
  });
});

// POST /api/sos/:id/resolve - Admin resolves emergency
router.post('/:id/resolve', authenticate, (req: AuthRequest, res) => {
  const { resolution_note } = req.body;
  const updated = db.resolveSosAlert(
    req.params.id,
    resolution_note || `Resolved by ${req.user?.name} (${req.user?.role})`
  );

  if (!updated) {
    res.status(404).json({ error: 'SOS Alert not found' });
    return;
  }

  res.json({ message: 'Emergency SOS marked as resolved.', alert: updated });
});

export default router;
