const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, waitForConnections: true, connectionLimit: 10, queueLimit: 0
});

// Hàm lấy bảng xếp hạng chi tiết
exports.getRankings = async (req, res) => {
    try {
        // SQL TỔNG HỢP: Tính tổng điểm bị trừ cho mỗi lớp
        // Chỉ trừ điểm các lỗi đã được XÁC NHẬN, ĐANG KHIẾU NẠI hoặc CHỜ XÁC NHẬN.
        // Lỗi đã bị 'rejected' (hủy) sẽ không tính.
        const [rows] = await pool.query(`
            SELECT
                c.id,
                c.name,
                c.grade,
                -- Tính tổng điểm bị trừ từ các loại vi phạm
                COALESCE(SUM(vt.points), 0) AS total_deducted_points,
                -- Giả định điểm ban đầu là 100. (100 - Tổng điểm trừ)
                (100 - COALESCE(SUM(CASE 
                    WHEN v.status IN ('confirmed', 'disputed', 'pending_confirmation') 
                    THEN vt.points ELSE 0 END), 0)
                ) AS final_points,
                
                -- Đếm tổng số vi phạm đã được ghi nhận (bất kể trạng thái)
                COUNT(v.id) AS total_violations
            FROM classes c
            LEFT JOIN violations v ON c.id = v.class_id
            LEFT JOIN violation_types vt ON v.violation_type_id = vt.id
            GROUP BY c.id, c.name, c.grade
            ORDER BY final_points DESC, total_deducted_points ASC;
        `);
        res.json(rows);
    } catch (error) {
        console.error('Lỗi lấy bảng xếp hạng:', error);
        res.status(500).json({ message: 'Lỗi server khi tính toán xếp hạng' });
    }
};

// Hàm đếm số lỗi đang khiếu nại (để hiển thị trên Dashboard)
exports.getDisputedCount = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT COUNT(id) AS disputed_count
            FROM violations
            WHERE status = 'disputed'
        `);
        res.json({ count: rows[0].disputed_count });
    } catch (error) {
        console.error('Lỗi đếm khiếu nại:', error);
        res.status(500).json({ message: 'Lỗi server khi đếm khiếu nại' });
    }
};