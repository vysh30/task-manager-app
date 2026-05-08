const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate, requireAdmin, requireProjectMember } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/projects — list projects accessible to user
router.get('/', (req, res) => {
  let projects;
  if (req.user.role === 'admin') {
    projects = db.prepare(`
      SELECT p.*, u.name AS owner_name,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) AS task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') AS done_count,
        (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) AS member_count
      FROM projects p
      JOIN users u ON u.id = p.owner_id
      ORDER BY p.created_at DESC
    `).all();
  } else {
    projects = db.prepare(`
      SELECT p.*, u.name AS owner_name,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) AS task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') AS done_count,
        (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) AS member_count
      FROM projects p
      JOIN users u ON u.id = p.owner_id
      JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
      ORDER BY p.created_at DESC
    `).all(req.user.id);
  }
  res.json({ projects });
});

// POST /api/projects — create project (admin only)
router.post('/', requireAdmin, [
  body('name').trim().notEmpty().withMessage('Project name required'),
  body('description').optional().trim(),
  body('member_ids').optional().isArray(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description, member_ids = [] } = req.body;
  const result = db.prepare(
    'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)'
  ).run(name, description || '', req.user.id);

  const projectId = result.lastInsertRowid;

  // Add owner + specified members
  const insertMember = db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)');
  const addAll = db.transaction((ids) => {
    insertMember.run(projectId, req.user.id);
    ids.forEach(id => insertMember.run(projectId, id));
  });
  addAll(member_ids);

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  res.status(201).json({ project });
});

// GET /api/projects/:id
router.get('/:id', requireProjectMember, (req, res) => {
  const project = db.prepare(`
    SELECT p.*, u.name AS owner_name
    FROM projects p JOIN users u ON u.id = p.owner_id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!project) return res.status(404).json({ error: 'Project not found' });

  const members = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, pm.joined_at
    FROM users u JOIN project_members pm ON pm.user_id = u.id
    WHERE pm.project_id = ?
  `).all(req.params.id);

  const tasks = db.prepare(`
    SELECT t.*, u.name AS assignee_name
    FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id
    WHERE t.project_id = ?
    ORDER BY t.created_at DESC
  `).all(req.params.id);

  res.json({ project, members, tasks });
});

// PATCH /api/projects/:id
router.patch('/:id', requireProjectMember, [
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim(),
], (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  if (req.user.role !== 'admin' && project.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'Only project owner or admin can edit' });
  }

  const { name, description } = req.body;
  db.prepare(`
    UPDATE projects SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(name || null, description || null, req.params.id);

  res.json({ project: db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) });
});

// DELETE /api/projects/:id
router.delete('/:id', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  if (req.user.role !== 'admin' && project.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'Only project owner or admin can delete' });
  }

  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ message: 'Project deleted' });
});

// POST /api/projects/:id/members
router.post('/:id/members', requireProjectMember, (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  if (req.user.role !== 'admin' && project.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'Only owner or admin can manage members' });
  }

  const { user_id } = req.body;
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(user_id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)').run(req.params.id, user_id);
  res.json({ message: 'Member added' });
});

// DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', requireProjectMember, (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  if (req.user.role !== 'admin' && project.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'Only owner or admin can remove members' });
  }
  if (parseInt(req.params.userId) === project.owner_id) {
    return res.status(400).json({ error: 'Cannot remove project owner' });
  }

  db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?')
    .run(req.params.id, req.params.userId);
  res.json({ message: 'Member removed' });
});

module.exports = router;
