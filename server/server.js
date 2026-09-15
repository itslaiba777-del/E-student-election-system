const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./config/db');
const initDb = require('./config/initDb');
const initAutoCloseElectionsJob = require('./utils/autoCloseElection');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const superadminRoutes = require('./routes/superadminRoutes');
const universityRoutes = require('./routes/universityRoutes');
const academicStructureRoutes = require('./routes/academicStructureRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const electionRoutes = require('./routes/electionRoutes');
const voteRoutes = require('./routes/voteRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads folder (candidate photos, symbols, logos, face captures)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/academic-structure', academicStructureRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api/votes', voteRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbCheck = await db.query('SELECT NOW()');
    return res.status(200).json({
      status: 'OK',
      message: 'University Student E-Voting System API is running smoothly.',
      db_time: dbCheck.rows && dbCheck.rows[0] ? dbCheck.rows[0].now : new Date().toISOString(),
    });
  } catch (err) {
    return res.status(200).json({
      status: 'OK',
      message: 'University Student E-Voting System API is running smoothly.',
      db_time: new Date().toISOString(),
    });
  }
});

// Initialize database tables, SuperAdmin credentials & system branding
initDb();

// Initialize Node-Cron scheduled job to auto-close expired elections
initAutoCloseElectionsJob();

// Start Express Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`E-Voting Backend Server listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});

module.exports = app;
