// --- routes/scheduleRoutes.js ---
// Nhiệm vụ: API Quản lý Thời Khóa Biểu

import express from 'express';
import pool from '../db.js';
import { authenticateToken, checkRole } from '../middleware/auth.js';

const router = express.Router();
        
// Lấy TKB của 1 lớp
router.get('/schedules/class/:classId', authenticateToken, async (req, res) => {
    const { classId } = req.params;
    const { semester, school_year } = req.query;
    try {
        const [schedules] = await pool.query(
            `SELECT t.*, u.fullname as teacher_fullname 
             FROM timetable t 
             JOIN users u ON t.teacher_id = u.user_id
             WHERE t.class_id = ? AND t.semester = ? AND t.school_year = ?`,
            [classId, semester || 1, school_year || '2024-2025']
        );
        res.json({ success: true, schedules });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Thêm TKB (Đoàn trường)
router.post('/schedules', authenticateToken, checkRole(['doan_truong', 'admin']), async (req, res) => {
    const { class_id, semester, school_year, day_of_week, period_number, subject_name, teacher_id } = req.body;
    try {
        await pool.query(
            'INSERT INTO timetable (class_id, semester, school_year, day_of_week, period_number, subject_name, teacher_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [class_id, semester, school_year, day_of_week, period_number, subject_name, teacher_id]
        );
        res.status(201).json({ success: true, message: 'Thêm tiết học vào TKB thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Xóa TKB (Đoàn trường)
router.delete('/schedules/:timetableId', authenticateToken, checkRole(['doan_truong', 'admin']), async (req, res) => {
    const { timetableId } = req.params;
    try {
        await pool.query('DELETE FROM timetable WHERE timetable_id = ?', [timetableId]);
        res.json({ success: true, message: 'Xóa tiết học khỏi TKB thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;