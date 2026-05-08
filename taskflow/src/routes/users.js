const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/users — list all users (admin) or teammates (member)
router.get('/', (req, res) => {
  let users;
  if (req.user.role === 'admin') {
    users = db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY name').all();
  } else {
    // Only users sharing a project
    users = db.prepare(`
      SELECT DISTINCT u.id, u.name, u.email, u.role
      FROM users u
      JOIN project_members pm ON pm.user_id = u.id
      WHERE pm.project_id IN (
        SELECT project_id FROM project_members WHERE user_id = ?
      )
      ORDER BY u.name
    `).all(req.user.id);
  }
  res.json({ users });
});

// GET /api/users/:id
router.get('/:id', (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (req.user.role !== 'admin' && req.user.id !== user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const taskStats = db.prepare(`
    SELECT
      COUNT(*) AS assigned,
      SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) AS completed
    FROM tasks WHERE assignee_id = ?
  `).get(user.id);

  const projectCount = db.prepare(
    'SELECT COUNT(*) AS count FROM project_members WHERE user_id = ?'
  ).get(user.id);

  res.json({ user, stats: { ...taskStats, projects: projectCount.count } });
});

// PATCH /api/users/:id/role — admin only
router.patch('/:id/role', requireAdmin, [
  body('role').isIn(['admin','member']).withMessage('Role must be admin or member'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.prepare("UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?")
    .run(req.body.role, req.params.id);

  res.json({ message: 'Role updated', role: req.body.role });
});

// PATCH /api/users/me — update own profile
router.patch('/me', [
  body('name').optional().trim().notEmpty(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nothing to update' });

  db.prepare("UPDATE users SET name = ?, updated_at = datetime('now') WHERE id = ?")
    .run(name, req.user.id);

  const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});

module.exports = router;
