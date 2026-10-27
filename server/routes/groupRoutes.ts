import { Router } from 'express';
import { db, Group } from '../db';
import { authenticate, requireRole, AuthRequest, sanitizeUser } from '../auth';

const router = Router();

// GET /api/groups - Super Admin, or all authenticated users
router.get('/', authenticate, (req: AuthRequest, res) => {
  const groups = db.getGroups();
  const users = db.getUsers();

  const enriched = groups.map(group => {
    const members = users.filter(u => u.group_id === group.id && u.status === 'APPROVED');
    const admin = users.find(u => u.id === group.group_admin_id);
    return {
      ...group,
      member_count: members.length,
      group_admin_name: admin ? admin.name : 'Unassigned',
      group_admin_email: admin ? admin.email : null,
      group_admin_phone: admin ? admin.phone : null,
    };
  });

  res.json(enriched);
});

// GET /api/groups/suggest?area=...&district=...
router.get('/suggest', authenticate, (req: AuthRequest, res) => {
  const area = (req.query.area as string || '').toLowerCase().trim();
  const district = (req.query.district as string || '').toLowerCase().trim();

  const groups = db.getGroups();
  const users = db.getUsers();

  // Score groups by exact district and area match
  const scored = groups.map(g => {
    let score = 0;
    if (district && g.district.toLowerCase() === district) {
      score += 2;
    }
    if (area && g.area.toLowerCase().includes(area)) {
      score += 3;
    } else if (area && area.includes(g.area.toLowerCase())) {
      score += 2;
    }
    const memberCount = users.filter(u => u.group_id === g.id && u.status === 'APPROVED').length;
    const admin = users.find(u => u.id === g.group_admin_id);

    return {
      ...g,
      score,
      member_count: memberCount,
      group_admin_name: admin ? admin.name : 'Unassigned',
    };
  });

  // Sort by score desc, then member_count
  scored.sort((a, b) => b.score - a.score);

  res.json({
    exact_matches: scored.filter(g => g.score >= 3),
    district_matches: scored.filter(g => g.score === 2),
    all_groups: scored,
  });
});

// GET /api/groups/:id
router.get('/:id', authenticate, (req: AuthRequest, res) => {
  const group = db.findGroupById(req.params.id);
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  // Check authorization: Super Admin, or members of this group
  if (req.user?.role !== 'SUPER_ADMIN' && req.user?.group_id !== group.id) {
    res.status(403).json({ error: 'Access denied to group details.' });
    return;
  }

  const users = db.getUsers();
  const members = users
    .filter(u => u.group_id === group.id && u.status === 'APPROVED')
    .map(sanitizeUser);

  const admin = users.find(u => u.id === group.group_admin_id);

  res.json({
    ...group,
    members,
    group_admin: admin ? sanitizeUser(admin) : null,
  });
});

// POST /api/groups - Super Admin only
router.post('/', authenticate, requireRole('SUPER_ADMIN'), (req: AuthRequest, res) => {
  const { group_name, area, district, group_admin_id } = req.body;

  if (!group_name || !group_name.trim()) {
    res.status(400).json({ error: 'Group name is required' });
    return;
  }
  if (!area || !area.trim()) {
    res.status(400).json({ error: 'Area is required' });
    return;
  }
  if (!district || !district.trim()) {
    res.status(400).json({ error: 'District is required' });
    return;
  }

  const newGroup: Group = {
    id: 'grp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    group_name: group_name.trim(),
    area: area.trim(),
    district: district.trim(),
    group_admin_id: group_admin_id || null,
    created_at: new Date().toISOString(),
  };

  db.addGroup(newGroup);

  // If group admin was selected, set their role & group_id
  if (group_admin_id) {
    const adminUser = db.findUserById(group_admin_id);
    if (adminUser) {
      db.updateUser(group_admin_id, {
        role: 'GROUP_ADMIN',
        group_id: newGroup.id,
        status: 'APPROVED',
      });
    }
  }

  // Creating a group automatically creates its dedicated chatroom with a welcome system message
  db.addMessage({
    id: 'msg_welcome_' + Date.now(),
    group_id: newGroup.id,
    sender_id: req.user?.id || 'system',
    sender_name: req.user?.name || 'System Admin',
    sender_role: 'SUPER_ADMIN',
    text: `Welcome to the official chat room for ${newGroup.group_name}! Members can coordinate meetings, savings, and loan discussions here.`,
    timestamp: new Date().toISOString(),
  });

  res.status(201).json(newGroup);
});

// POST /api/groups/:id/set-admin - Super Admin only
// Designates exactly one Group Admin per group
router.post('/:id/set-admin', authenticate, requireRole('SUPER_ADMIN'), (req: AuthRequest, res) => {
  const group = db.findGroupById(req.params.id);
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  const { user_id } = req.body;
  if (!user_id) {
    res.status(400).json({ error: 'User ID is required to designate a Group Admin.' });
    return;
  }

  const newAdmin = db.findUserById(user_id);
  if (!newAdmin) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // If there was an existing group admin, demote them to regular USER
  if (group.group_admin_id && group.group_admin_id !== user_id) {
    const oldAdmin = db.findUserById(group.group_admin_id);
    if (oldAdmin && oldAdmin.role === 'GROUP_ADMIN') {
      db.updateUser(oldAdmin.id, { role: 'USER' });
    }
  }

  // Assign new admin
  db.updateGroup(group.id, { group_admin_id: user_id });
  db.updateUser(user_id, {
    role: 'GROUP_ADMIN',
    group_id: group.id,
    status: 'APPROVED',
  });

  res.json({
    message: `Designated ${newAdmin.name} as Group Admin for ${group.group_name}`,
    group: db.findGroupById(group.id),
  });
});

export default router;
