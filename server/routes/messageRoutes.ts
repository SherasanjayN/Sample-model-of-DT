import { Router } from 'express';
import { db, Message } from '../db';
import { authenticate, AuthRequest } from '../auth';

const router = Router();

// GET /api/groups/:id/messages
router.get('/:id/messages', authenticate, (req: AuthRequest, res) => {
  const groupId = req.params.id;
  const user = req.user!;

  // Must be super admin OR member of this group
  if (user.role !== 'SUPER_ADMIN' && user.group_id !== groupId) {
    res.status(403).json({ error: 'Access denied. You can only view chat for your own group.' });
    return;
  }

  const group = db.findGroupById(groupId);
  if (!group) {
    res.status(404).json({ error: 'Group not found.' });
    return;
  }

  const messages = db.getMessages(groupId);
  res.json({
    group: {
      id: group.id,
      name: group.group_name,
      area: group.area,
      district: group.district,
    },
    messages,
  });
});

// POST /api/groups/:id/messages
router.post('/:id/messages', authenticate, (req: AuthRequest, res) => {
  const groupId = req.params.id;
  const user = req.user!;

  if (user.role !== 'SUPER_ADMIN' && user.group_id !== groupId) {
    res.status(403).json({ error: 'Access denied. You can only send messages in your allocated group.' });
    return;
  }

  const group = db.findGroupById(groupId);
  if (!group) {
    res.status(404).json({ error: 'Group not found.' });
    return;
  }

  const { text } = req.body;
  if (!text || typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ error: 'Message text cannot be empty.' });
    return;
  }

  const newMessage: Message = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    group_id: groupId,
    sender_id: user.id,
    sender_name: user.name,
    sender_role: user.role,
    text: text.trim(),
    timestamp: new Date().toISOString(),
  };

  db.addMessage(newMessage);

  res.status(201).json(newMessage);
});

export default router;
