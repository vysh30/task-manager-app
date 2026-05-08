require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
 
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');
const { errorHandler } = require('./middleware/errorHandler');
 
const app = express();
const PORT = process.env.PORT || 3000;
 
// --------------------
// SECURITY & LOGGING
// --------------------
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
 
// --------------------
// RATE LIMITING
// --------------------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);
 
// --------------------
// BODY PARSING
// --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
 
// --------------------
// SERVE FRONTEND
// --------------------
app.use(express.static(path.join(__dirname, '../public')));
 
// --------------------
// HEALTH CHECK
// --------------------
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
 
// --------------------
// API ROUTES
// --------------------
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
 
// --------------------
// ERROR HANDLER
// --------------------
app.use(errorHandler);
 
// --------------------
// CATCH-ALL → FRONTEND
// --------------------
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});
 
// --------------------
// START SERVER
// --------------------
app.listen(PORT, () => {
  console.log(`\n🚀 TaskFlow API running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   API:    http://localhost:${PORT}/api\n`);
});
 
module.exports = app;
