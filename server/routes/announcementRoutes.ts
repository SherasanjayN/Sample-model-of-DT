import { Router } from 'express';
import { db, Announcement } from '../db';
import { authenticate, requireRole, AuthRequest } from '../auth';

const router = Router();

// GET /api/announcements - All authenticated users
router.get('/', authenticate, (req: AuthRequest, res) => {
  const announcements = db.getAnnouncements();
  res.json(announcements);
});

// POST /api/announcements - Super Admin only
router.post('/', authenticate, requireRole('SUPER_ADMIN'), (req: AuthRequest, res) => {
  const { title, message } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ error: 'Announcement title is required.' });
    return;
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'Announcement message body is required.' });
    return;
  }

  const newAnnouncement: Announcement = {
    id: 'ann_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    title: title.trim(),
    message: message.trim(),
    author_name: req.user!.name,
    created_at: new Date().toISOString(),
  };

  db.addAnnouncement(newAnnouncement);

  res.status(201).json(newAnnouncement);
});

export default router;
