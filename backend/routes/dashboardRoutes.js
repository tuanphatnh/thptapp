const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Lấy toàn bộ bảng xếp hạng
router.get('/rankings', dashboardController.getRankings);

// Lấy số lượng lỗi đang khiếu nại
router.get('/disputed-count', dashboardController.getDisputedCount);

module.exports = router;