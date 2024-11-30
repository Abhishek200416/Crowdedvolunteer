const dotenv = require('dotenv');

// Load environment variables before anything else
dotenv.config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const memberRoutes = require('./routes/memberRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const Admin = require('./models/Admin');
const Member = require('./models/Member');
const Attendance = require('./models/Attendance'); // Import Attendance model

// Initialize models
Admin.initialize();
Member.initialize();
Attendance.initialize(); // Initialize Attendance model

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/attendance', attendanceRoutes);

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Catch-all route to serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

module.exports = app;