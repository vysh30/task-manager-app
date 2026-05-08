const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme-in-production-please';

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(payload.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function requireProjectMember(req, res, next) {
  const projectId = req.params.projectId || req.params.id || req.body.project_id;
  if (!projectId) return next();
  const member = db.prepare(
    'SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?'
  ).get(projectId, req.user.id);
  const project = db.prepare('SELECT owner_id FROM projects WHERE id = ?').get(projectId);

  if (!member && project?.owner_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not a member of this project' });
  }
  next();
}

module.exports = { authenticate, requireAdmin, requireProjectMember, JWT_SECRET };
