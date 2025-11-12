// --- routes/logbookRoutes.js ---
// Nhiệm vụ: API cho Sổ Đầu Bài (Giáo viên/BGH)

import express from 'express';
import pool from '../db.js';
import dayjs from 'dayjs';
import { authenticateToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// Lấy lịch dạy (Sổ đầu bài) của giáo viên VÀ các vi phạm đã nhập
router.get('/logbook/my-schedule', authenticateToken, checkRole(['giao_vien', 'ban_giam_hieu', 'admin']), async (req, res) => {
    const { week_number } = req.query;
    const teacher_id = req.user.user_id;

    try {
        // 1. Lấy TKB của giáo viên
        const [schedule] = await pool.query(
            `SELECT t.*, c.class_name 
             FROM timetable t
             JOIN classes c ON t.class_id = c.class_id
             WHERE t.teacher_id = ?`,
            [teacher_id]
        );

        // 2. Lấy các tiết đã ký (logbook_entries) trong tuần đó
        const [signedEntries] = await pool.query(
            `SELECT l.*, u.fullname as signer_fullname
             FROM logbook_entries l
             JOIN users u ON l.grader_id = u.user_id
             WHERE l.week_number = ? AND l.teacher_id = ?`,
            [week_number, teacher_id]
        );
        
        // 3. Lấy TẤT CẢ các vi phạm đã nhập trong sổ đầu bài của tuần đó
        const [logViolations] = await pool.query(
            `SELECT lv.entry_id, lv.rule_id, vt.description, vt.points_deducted
             FROM logbook_violations lv
             JOIN logbook_entries le ON lv.entry_id = le.entry_id
             JOIN violation_types vt ON lv.rule_id = vt.violation_type_id
             WHERE le.week_number = ? AND le.teacher_id = ?`,
            [week_number, teacher_id]
        );

        // 4. Map TKB với Sổ đầu bài VÀ Vi phạm
        const combinedSchedule = schedule.map(entry => {
            const signed = signedEntries.find(s => 
                s.timetable_id === entry.timetable_id && 
                s.week_number === parseInt(week_number)
            );
            
            let violations = [];
            if (signed) {
                violations = logViolations.filter(v => v.entry_id === signed.entry_id);
            }

            return {
                ...entry,
                is_signed: !!signed,
                ...(signed || {}), 
                violations: violations 
            };
        });

        res.json({ success: true, schedule: combinedSchedule });
    } catch (error) {
        console.error("Lỗi lấy SĐB:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Ký Sổ Đầu Bài (Hỗ trợ nhiều vi phạm)
router.post('/logbook/sign', authenticateToken, checkRole(['giao_vien', 'ban_giam_hieu', 'admin']), async (req, res) => {
    const { timetable_id, week_number, lesson_content, notes, attendance, selectedRuleIds } = req.body;
    const grader_id = req.user.user_id;

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [timetableRows] = await connection.query('SELECT * FROM timetable WHERE timetable_id = ?', [timetable_id]);
        if (timetableRows.length === 0) {
            throw new Error('Tiết học không tồn tại');
        }
        const entry = timetableRows[0];
        
        const entryDate = dayjs().isoWeek(week_number).day(entry.day_of_week).format('YYYY-MM-DD');

        const [result] = await connection.query(
            `INSERT INTO logbook_entries 
                (timetable_id, class_id, subject_id, teacher_id, week_number, entry_date, period_number, lesson_content, notes, attendance, grader_id, teacher_signature_timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE
                lesson_content = ?, notes = ?, attendance = ?, grader_id = ?, teacher_signature_timestamp = NOW()`,
            [
                timetable_id, entry.class_id, entry.subject_id, entry.teacher_id, 
                week_number, entryDate, entry.period_number, 
                lesson_content, notes, attendance, grader_id,
                // Dữ liệu cho UPDATE
                lesson_content, notes, attendance, grader_id
            ]
        );
        
        const entry_id = result.insertId === 0 ? (await connection.query('SELECT entry_id FROM logbook_entries WHERE timetable_id = ? AND week_number = ?', [timetable_id, week_number]))[0][0].entry_id : result.insertId;

        // Xử lý bảng nối logbook_violations
        await connection.query('DELETE FROM logbook_violations WHERE entry_id = ?', [entry_id]);
        
        if (selectedRuleIds && selectedRuleIds.length > 0) {
            const violationValues = selectedRuleIds.map(ruleId => [entry_id, ruleId]);
            await connection.query(
                'INSERT INTO logbook_violations (entry_id, rule_id) VALUES ?',
                [violationValues]
            );
        }

        await connection.commit();
        connection.release();

        res.status(201).json({ success: true, message: 'Ký sổ thành công' });
    } catch (error) {
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        console.error("Lỗi Ký Sổ V5:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;