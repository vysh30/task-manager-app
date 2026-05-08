const express = require('express');
const { body, query, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate, requireProjectMember } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/tasks — list tasks (filtered by project, status, assignee, overdue)
router.get('/', (req, res) => {
  const { project_id, status, priority, assignee_id, overdue } = req.query;

  let whereClauses = [];
  let params = [];

  // Non-admins only see tasks in their projects
  if (req.user.role !== 'admin') {
    whereClauses.push(`
      t.project_id IN (
        SELECT project_id FROM project_members WHERE user_id = ?
      )
    `);
    params.push(req.user.id);
  }

  if (project_id) { whereClauses.push('t.project_id = ?'); params.push(project_id); }
  if (status) { whereClauses.push('t.status = ?'); params.push(status); }
  if (priority) { whereClauses.push('t.priority = ?'); params.push(priority); }
  if (assignee_id) { whereClauses.push('t.assignee_id = ?'); params.push(assignee_id); }
  if (overdue === 'true') {
    whereClauses.push(`t.status != 'done' AND t.due_date < date('now')`);
  }

  const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const tasks = db.prepare(`
    SELECT t.*,
      u.name AS assignee_name,
      p.name AS project_name,
      cb.name AS created_by_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    LEFT JOIN projects p ON p.id = t.project_id
    LEFT JOIN users cb ON cb.id = t.created_by
    ${where}
    ORDER BY
      CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
      t.due_date ASC NULLS LAST,
      t.created_at DESC
  `).all(...params);

  res.json({ tasks });
});

// POST /api/tasks — create task
router.post('/', [
  body('project_id').isInt().withMessage('project_id required'),
  body('title').trim().notEmpty().withMessage('Title required'),
  body('assignee_id').optional().isInt(),
  body('status').optional().isIn(['todo','in-progress','review','done']),
  body('priority').optional().isIn(['low','medium','high']),
  body('due_date').optional().isISO8601().withMessage('Invalid date'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { project_id, title, description, assignee_id, status = 'todo', priority = 'medium', due_date } = req.body;

  // Check project membership
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const isMember = db.prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?')
    .get(project_id, req.user.id);
  if (!isMember && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not a project member' });
  }

  const result = db.prepare(`
    INSERT INTO tasks (project_id, title, description, assignee_id, status, priority, due_date, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(project_id, title, description || null, assignee_id || null, status, priority, due_date || null, req.user.id);

  const task = db.prepare(`
    SELECT t.*, u.name AS assignee_name, p.name AS project_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    LEFT JOIN projects p ON p.id = t.project_id
    WHERE t.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ task });
});

// GET /api/tasks/:id
router.get('/:id', (req, res) => {
  const task = db.prepare(`
    SELECT t.*, u.name AS assignee_name, p.name AS project_name, cb.name AS created_by_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    LEFT JOIN projects p ON p.id = t.project_id
    LEFT JOIN users cb ON cb.id = t.created_by
    WHERE t.id = ?
  `).get(req.params.id);

  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (req.user.role !== 'admin') {
    const member = db.prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?')
      .get(task.project_id, req.user.id);
    if (!member) return res.status(403).json({ error: 'Access denied' });
  }

  res.json({ task });
});

// PATCH /api/tasks/:id
router.patch('/:id', [
  body('title').optional().trim().notEmpty(),
  body('status').optional().isIn(['todo','in-progress','review','done']),
  body('priority').optional().isIn(['low','medium','high']),
  body('due_date').optional().isISO8601(),
], (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const canEdit = req.user.role === 'admin'
    || task.assignee_id === req.user.id
    || task.created_by === req.user.id;

  if (!canEdit) return res.status(403).json({ error: 'Cannot edit this task' });

  const { title, description, assignee_id, status, priority, due_date } = req.body;

  db.prepare(`
    UPDATE tasks SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      assignee_id = COALESCE(?, assignee_id),
      status = COALESCE(?, status),
      priority = COALESCE(?, priority),
      due_date = COALESCE(?, due_date),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title || null, description || null, assignee_id || null,
    status || null, priority || null, due_date || null,
    req.params.id
  );

  const updated = db.prepare(`
    SELECT t.*, u.name AS assignee_name, p.name AS project_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    LEFT JOIN projects p ON p.id = t.project_id
    WHERE t.id = ?
  `).get(req.params.id);

  res.json({ task: updated });
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const canDelete = req.user.role === 'admin' || task.created_by === req.user.id;
  if (!canDelete) return res.status(403).json({ error: 'Cannot delete this task' });

  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ message: 'Task deleted' });
});

// GET /api/tasks/dashboard/summary — dashboard stats
router.get('/dashboard/summary', (req, res) => {
  const uid = req.user.id;
  const isAdmin = req.user.role === 'admin';

  const projectFilter = isAdmin ? '' : `
    AND t.project_id IN (SELECT project_id FROM project_members WHERE user_id = ${uid})
  `;

  const stats = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS done,
      SUM(CASE WHEN t.status = 'in-progress' THEN 1 ELSE 0 END) AS in_progress,
      SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) AS todo,
      SUM(CASE WHEN t.status = 'review' THEN 1 ELSE 0 END) AS review,
      SUM(CASE WHEN t.status != 'done' AND t.due_date < date('now') THEN 1 ELSE 0 END) AS overdue
    FROM tasks t
    WHERE 1=1 ${projectFilter}
  `).get();

  res.json({ stats });
});

module.exports = router;
