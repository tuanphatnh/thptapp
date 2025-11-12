// --- routes/violationRoutes.js ---
// Nhiệm vụ: API cho Cờ Đỏ, Bí Thư, và Đoàn Trường (phần vi phạm)

import express from 'express';
import pool from '../db.js';
import { authenticateToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// (Đoàn trường) Lấy các vi phạm CHỜ ĐOÀN TRƯỜNG DUYỆT (Đã qua Bí thư)
router.get('/violations/pending-approval', authenticateToken, checkRole(['doan_truong', 'admin']), async (req, res) => {
    try {
        const [reports] = await pool.query(
            `SELECT v.*, c.class_name, vt.description as rule_description, vt.points_deducted as rule_points, v.description_details
             FROM violation_reports v
             JOIN classes c ON v.class_id = c.class_id
             JOIN violation_types vt ON v.violation_type_id = vt.violation_type_id
             WHERE v.status = 'pending_approval'
             ORDER BY v.report_date DESC`
        );
        res.json({ success: true, reports });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// (Đoàn trường) Lấy các vi phạm BỊ BÍ THƯ TỪ CHỐI (Đoàn trường xem xét)
router.get('/violations/denied-by-monitor', authenticateToken, checkRole(['doan_truong', 'admin']), async (req, res) => {
    try {
        const [reports] = await pool.query(
            `SELECT v.*, c.class_name, vt.description as rule_description, vt.points_deducted as rule_points, v.description_details, v.secretary_response
             FROM violation_reports v
             JOIN classes c ON v.class_id = c.class_id
             JOIN violation_types vt ON v.violation_type_id = vt.violation_type_id
             WHERE v.status = 'denied_by_monitor'
             ORDER BY v.report_date DESC`
        );
        res.json({ success: true, reports });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// (Đoàn trường) Duyệt (approve) hoặc Hủy (reject)
router.post('/violations/:reportId/approve', authenticateToken, checkRole(['doan_truong', 'admin']), async (req, res) => {
    const { reportId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    try {
        await pool.query(
            `UPDATE violation_reports 
             SET status = ?, union_response = ?, union_processed_at = NOW() 
             WHERE report_id = ?`,
            [newStatus, `Đã duyệt bởi ${req.user.fullname}`, reportId]
        );
        res.json({ success: true, message: `Đã ${newStatus === 'approved' ? 'duyệt' : 'hủy'} vi phạm` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


// (Cờ Đỏ) Gửi báo cáo
router.post('/violations/report', authenticateToken, checkRole(['co_do', 'admin']), async (req, res) => {
    const { class_id, violation_type_id, description, violation_date, week_number } = req.body;
    const reporter_id = req.user.user_id;

    try {
        await pool.query(
            `INSERT INTO violation_reports (class_id, violation_type_id, description_details, report_date, week_number, reporter_id, status)
             VALUES (?, ?, ?, ?, ?, ?, 'pending_confirmation')`, 
            [class_id, violation_type_id, description, violation_date, week_number, reporter_id]
        );
        res.status(201).json({ success: true, message: 'Báo cáo vi phạm thành công' });
    } catch (error) {
        console.error("Lỗi API Cờ Đỏ:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});


// (Bí thư) Lấy các vi phạm CHỜ BÍ THƯ XÁC NHẬN (của lớp mình)
router.get('/violations/my-class', authenticateToken, checkRole(['bi_thu_chi_doan', 'admin']), async (req, res) => {
    const class_id = req.user.class_id;
    if (!class_id) {
        return res.status(400).json({ success: false, message: 'Tài khoản của bạn chưa được gán vào lớp nào.' });
    }

    try {
        const [reports] = await pool.query(
            `SELECT v.*, u.fullname as reporter_name, vt.description as rule_description, vt.points_deducted as rule_points, v.description_details
             FROM violation_reports v
             JOIN users u ON v.reporter_id = u.user_id
             JOIN violation_types vt ON v.violation_type_id = vt.violation_type_id
             WHERE v.class_id = ? AND v.status = 'pending_confirmation'
             ORDER BY v.report_date DESC`,
            [class_id]
        );
        res.json({ success: true, reports });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// (Bí thư) Xác nhận (confirm) hoặc Từ chối (deny)
router.post('/violations/:reportId/confirm', authenticateToken, checkRole(['bi_thu_chi_doan', 'admin']), async (req, res) => {
    const { reportId } = req.params;
    const { action, feedback } = req.body; // 'confirm' or 'deny'
    const newStatus = action === 'confirm' ? 'pending_approval' : 'denied_by_monitor';

    try {
        await pool.query(
            `UPDATE violation_reports 
             SET status = ?, secretary_response = ?, secretary_processed_at = NOW() 
             WHERE report_id = ? AND class_id = ?`,
            [newStatus, feedback || null, reportId, req.user.class_id]
        );
        res.json({ success: true, message: 'Đã xử lý vi phạm' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


export default router;