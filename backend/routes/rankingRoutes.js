// --- routes/rankingRoutes.js ---
// Nhiệm vụ: API Tính toán Xếp hạng (Admin/BGH)

import express from 'express';
import pool from '../db.js';
import dayjs from 'dayjs';
import { authenticateToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// (Admin / BGH) Tính toán điểm
router.post('/calculate-ranking', authenticateToken, checkRole(['admin', 'ban_giam_hieu']), async (req, res) => {
    const { week_number } = req.body;

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [classes] = await connection.query('SELECT class_id FROM classes');
        
        for (const c of classes) {
            const class_id = c.class_id;
            let total_logbook_points = 0;
            let total_violation_points = 0;
            let total_bonus_points = 0; // Điểm thưởng (Loại 2)

            // 3. Tính điểm Sổ Đầu Bài (SĐB) (Loại 0)
            const [logEntries] = await connection.query(
                `SELECT vt.points_deducted 
                 FROM logbook_violations lv
                 JOIN logbook_entries le ON lv.entry_id = le.entry_id
                 JOIN violation_types vt ON lv.rule_id = vt.violation_type_id
                 WHERE le.class_id = ? AND le.week_number = ? AND vt.is_in_class_violation = 0`,
                [class_id, week_number]
            );
            for (const entry of logEntries) {
                total_logbook_points += (entry.points_deducted || 0);
            }

            // 4. Tính điểm Vi Phạm (VP) (Loại 1)
            const [violations] = await connection.query(
                `SELECT vt.points_deducted
                 FROM violation_reports v
                 JOIN violation_types vt ON v.violation_type_id = vt.violation_type_id
                 WHERE v.class_id = ? AND v.week_number = ? AND v.status = 'approved' AND vt.is_in_class_violation = 1`,
                [class_id, week_number]
            );
            for (const v of violations) {
                total_violation_points += (v.points_deducted || 0);
            }
            
            // 5. Tính điểm thưởng (LOẠI 2)
            const [bonuses] = await connection.query(
                `SELECT vt.points_deducted
                 FROM violation_reports v
                 JOIN violation_types vt ON v.violation_type_id = vt.violation_type_id
                 WHERE v.class_id = ? AND v.week_number = ? AND v.status = 'approved' AND vt.is_in_class_violation = 2`,
                [class_id, week_number]
            );
             for (const b of bonuses) {
                total_bonus_points += (b.points_deducted || 0);
            }

            // 6. Tổng điểm (Giả sử bắt đầu = 100)
            const total_points = 100 + total_logbook_points + total_violation_points + total_bonus_points;

            // 7. Cập nhật bảng weekly_rankings
            await connection.query(
                `INSERT INTO weekly_rankings (class_id, week_number, total_points, logbook_points, violation_points)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                 total_points = ?, logbook_points = ?, violation_points = ?`,
                [
                    class_id, week_number, total_points, total_logbook_points, (total_violation_points + total_bonus_points),
                    // Dữ liệu cho UPDATE
                    total_points, total_logbook_points, (total_violation_points + total_bonus_points)
                ]
            );
        }

        await connection.commit(); // Hoàn tất giao dịch
        connection.release();
        res.json({ success: true, message: `Tính toán xếp hạng tuần ${week_number} thành công!` });

    } catch (error) {
        if (connection) {
            await connection.rollback(); // Hoàn tác nếu có lỗi
            connection.release();
        }
        console.error("Lỗi Tính toán Xếp hạng:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;