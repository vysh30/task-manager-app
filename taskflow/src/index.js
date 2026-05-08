require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

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
app.use(helmet());
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
// SERVE FRONTEND (IMPORTANT)
// --------------------
app.use(express.static('public'));

// --------------------
// HEALTH CHECK
// --------------------
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// --------------------
// API ROUTES
// --------------------
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);

// --------------------
// 404 HANDLER
// --------------------
app.use((req, res) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.path} not found`,
  });
});

// --------------------
// ERROR HANDLER
// --------------------
app.use(errorHandler);

// --------------------
// START SERVER
// --------------------
const path = require('path');

// Serve frontend
app.use(express.static(path.join(__dirname, '../public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});
app.listen(PORT, () => {
  console.log(`🚀 TaskFlow API running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`API: http://localhost:${PORT}/api`);
});

module.exports = app;
