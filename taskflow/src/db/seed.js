require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/database');

console.log('Seeding database...');

const hash = (pw) => bcrypt.hashSync(pw, 10);

// Clear tables
db.exec('DELETE FROM tasks; DELETE FROM project_members; DELETE FROM projects; DELETE FROM users;');

// Seed users
const users = [
  { name: 'Alice Chen', email: 'alice@taskflow.io', password: hash('alice123'), role: 'admin' },
  { name: 'Bob Wright', email: 'bob@taskflow.io', password: hash('bob123'), role: 'member' },
  { name: 'Carmen Silva', email: 'carmen@taskflow.io', password: hash('carmen123'), role: 'member' },
  { name: 'Dev Patel', email: 'dev@taskflow.io', password: hash('dev123'), role: 'admin' },
  { name: 'Emma Ross', email: 'emma@taskflow.io', password: hash('emma123'), role: 'member' },
];
const insertUser = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)');
users.forEach(u => insertUser.run(u.name, u.email, u.password, u.role));

// Seed projects
const projects = [
  { name: 'Website Redesign', description: 'Revamp company site with new brand identity', owner_id: 1 },
  { name: 'Mobile App MVP', description: 'Launch iOS and Android apps by Q3', owner_id: 4 },
  { name: 'API Infrastructure', description: 'Build scalable REST API with auth and rate limiting', owner_id: 1 },
];
const insertProject = db.prepare('INSERT INTO projects (name, description, owner_id) VALUES (?,?,?)');
projects.forEach(p => insertProject.run(p.name, p.description, p.owner_id));

// Seed members
const members = [
  [1,1],[1,2],[1,3],
  [2,4],[2,2],[2,5],
  [3,1],[3,4],[3,3],[3,5],
];
const insertMember = db.prepare('INSERT INTO project_members (project_id, user_id) VALUES (?,?)');
members.forEach(([pid,uid]) => insertMember.run(pid, uid));

// Seed tasks
const tasks = [
  { project_id:1, title:'Design homepage wireframes', assignee_id:2, status:'done', priority:'high', due_date:'2025-05-01', created_by:1 },
  { project_id:1, title:'Build responsive nav component', assignee_id:3, status:'in-progress', priority:'high', due_date:'2025-05-10', created_by:1 },
  { project_id:1, title:'Write copy for About page', assignee_id:2, status:'todo', priority:'medium', due_date:'2025-05-20', created_by:1 },
  { project_id:1, title:'Set up CI/CD pipeline', assignee_id:1, status:'review', priority:'medium', due_date:'2025-05-06', created_by:1 },
  { project_id:2, title:'Design onboarding flow', assignee_id:5, status:'done', priority:'high', due_date:'2025-04-28', created_by:4 },
  { project_id:2, title:'Implement push notifications', assignee_id:2, status:'in-progress', priority:'high', due_date:'2025-05-15', created_by:4 },
  { project_id:2, title:'App store screenshots', assignee_id:5, status:'todo', priority:'low', due_date:'2025-05-25', created_by:4 },
  { project_id:3, title:'JWT auth middleware', assignee_id:4, status:'done', priority:'high', due_date:'2025-05-03', created_by:1 },
  { project_id:3, title:'Rate limiting logic', assignee_id:3, status:'in-progress', priority:'medium', due_date:'2025-05-12', created_by:1 },
  { project_id:3, title:'Write API documentation', assignee_id:5, status:'todo', priority:'low', due_date:'2025-05-30', created_by:1 },
];
const insertTask = db.prepare('INSERT INTO tasks (project_id, title, assignee_id, status, priority, due_date, created_by) VALUES (?,?,?,?,?,?,?)');
tasks.forEach(t => insertTask.run(t.project_id, t.title, t.assignee_id, t.status, t.priority, t.due_date, t.created_by));

console.log('✅ Seed complete');
console.log('   Demo accounts:');
console.log('   alice@taskflow.io / alice123 (admin)');
console.log('   bob@taskflow.io   / bob123   (member)');
db.close();
