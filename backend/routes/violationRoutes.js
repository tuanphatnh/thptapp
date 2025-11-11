const express = require('express');
const router = express.Router();
const violationController = require('../controllers/violationController');

router.post('/', violationController.createViolation); // Cờ đỏ gửi
router.get('/class/:class_id', violationController.getClassViolations); // Lớp xem
router.put('/:id/confirm-dispute', violationController.confirmOrDispute); // Lớp xác nhận/khiếu nại
router.get('/disputed', violationController.getDisputedViolations); // Đoàn trường xem khiếu nại
router.put('/:id/resolve', violationController.resolveDispute); // Đoàn trường phán quyết

module.exports = router;