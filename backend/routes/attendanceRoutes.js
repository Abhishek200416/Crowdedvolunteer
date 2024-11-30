const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.post('/mark', attendanceController.markAttendance);

module.exports = router;