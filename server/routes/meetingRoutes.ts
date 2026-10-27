import { Router } from 'express';
import { db, MeetingRecord } from '../db';
import { authenticate, AuthRequest, requireRole } from '../auth';

const router = Router();

// GET /api/meetings
router.get('/', authenticate, (req: AuthRequest, res) => {
  const user = req.user!;
  if (user.role === 'SUPER_ADMIN') {
    res.json(db.getMeetings());
    return;
  }

  if (user.group_id) {
    res.json(db.getMeetings(user.group_id));
    return;
  }

  res.json([]);
});

// POST /api/meetings - Group Admin or Super Admin logs meeting MoM and attendance
router.post('/', authenticate, requireRole('GROUP_ADMIN', 'SUPER_ADMIN'), (req: AuthRequest, res) => {
  const user = req.user!;
  const { group_id, date, topic, attendance, total_savings_collected, resolutions } = req.body;

  const targetGroupId = group_id || user.group_id;
  if (!targetGroupId) {
    res.status(400).json({ error: 'Group ID is required' });
    return;
  }

  const group = db.findGroupById(targetGroupId);
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  const newMeeting: MeetingRecord = {
    id: 'mom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    group_id: targetGroupId,
    group_name: group.group_name,
    date: date || new Date().toISOString().split('T')[0],
    topic: topic || 'Weekly SHG Coordination & Savings Review',
    attendance: Array.isArray(attendance) ? attendance : [],
    total_savings_collected: Number(total_savings_collected) || 0,
    resolutions: resolutions || '',
    created_by_name: user.name,
    created_at: new Date().toISOString(),
  };

  db.addMeeting(newMeeting);

  res.status(201).json({
    message: 'Meeting Minutes (MoM) & Member Attendance recorded successfully.',
    meeting: newMeeting,
  });
});

export default router;
