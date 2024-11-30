// server.js

const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const app = require('./app'); // Ensure you have the app module imported here

const PORT = process.env.PORT || 8080;

// Setup logging
// Create a write stream for logs
const logDirectory = path.join(__dirname, 'logs');
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
}
const accessLogStream = fs.createWriteStream(path.join(logDirectory, 'access.log'), { flags: 'a' });

// Use morgan for logging HTTP requests
app.use(morgan('combined', { stream: accessLogStream }));

// Also log to the console
app.use(morgan('dev'));

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse URL-encoded data (if needed)
app.use(express.urlencoded({ extended: true }));

// Routes
const attendanceRoutes = require('./routes/attendanceRoutes'); // Ensure correct path
const authRoutes = require('./routes/authRoutes'); // Ensure correct path
const memberRoutes = require('./routes/memberRoutes'); // Ensure correct path
const authenticateToken = require('./middleware/authMiddleware'); // Ensure correct path

app.use('/api/attendance', authenticateToken, attendanceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/members', authenticateToken, memberRoutes);

// Serve static files (if applicable)
app.use(express.static('public'));

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({ message: 'Route not found.', success: false });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack);
    res.status(500).json({ message: 'Internal Server Error.', success: false });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
});