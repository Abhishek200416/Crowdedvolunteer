// backend/routes/memberRoutes.js

const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);

// Routes
router.post('/add', memberController.addMember);
router.get('/all', memberController.getAllMembers);
router.get('/search', memberController.searchMembers);
router.get('/:id', memberController.getMemberDetails);

// Routes for downloading files
router.get('/download/excel', memberController.downloadExcelFiles);
router.get('/download/pdf', memberController.downloadPDFFiles);
// In memberRoutes.js
router.get('/download/qrcodes', memberController.downloadQRCodeImages);


module.exports = router;