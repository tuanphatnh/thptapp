const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');

// Định nghĩa đường dẫn: GET /api/classes
router.get('/', classController.getAllClasses);

module.exports = router;