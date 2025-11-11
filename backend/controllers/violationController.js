const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, waitForConnections: true, connectionLimit: 10, queueLimit: 0
});

// 1. CỜ ĐỎ: Gửi vi phạm mới
exports.createViolation = async (req, res) => {
    const { class_id, violation_type_id, student_name, date, reported_by } = req.body;
    // Mặc định status là 'pending_confirmation'
    try {
        await pool.query(
            'INSERT INTO violations (class_id, violation_type_id, student_name, date, reported_by, status) VALUES (?, ?, ?, ?, ?, "pending_confirmation")',
            [class_id, violation_type_id, student_name, date, reported_by]
        );
        res.json({ success: true, message: 'Đã gửi báo cáo vi phạm, chờ lớp xác nhận.' });
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Lỗi lưu vi phạm' });
    }
};

// 2. BÍ THƯ CHI ĐOÀN: Lấy danh sách vi phạm của lớp mình để xem
exports.getClassViolations = async (req, res) => {
    const { class_id } = req.params;
    try {
        const [rows] = await pool.query(`
            SELECT v.*, vt.name as violation_name, vt.points
            FROM violations v
            JOIN violation_types vt ON v.violation_type_id = vt.id
            WHERE v.class_id = ?
            ORDER BY v.date DESC, v.created_at DESC
        `, [class_id]);
        res.json(rows);
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Lỗi lấy danh sách' });
    }
};

// 3. BÍ THƯ CHI ĐOÀN: Xác nhận hoặc Khiếu nại
exports.confirmOrDispute = async (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // action là 'confirm' hoặc 'dispute'
    const newStatus = action === 'confirm' ? 'confirmed' : 'disputed';

    try {
        await pool.query('UPDATE violations SET status = ? WHERE id = ?', [newStatus, id]);
        res.json({ success: true, message: `Đã chuyển trạng thái thành ${newStatus}` });
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Lỗi cập nhật' });
    }
};

// 4. ĐOÀN TRƯỜNG: Lấy danh sách các lỗi đang khiếu nại (disputed)
exports.getDisputedViolations = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT v.*, c.name as class_name, vt.name as violation_name, vt.points
            FROM violations v
            JOIN classes c ON v.class_id = c.id
            JOIN violation_types vt ON v.violation_type_id = vt.id
            WHERE v.status = 'disputed'
            ORDER BY v.date ASC
        `);
        res.json(rows);
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Lỗi lấy danh sách khiếu nại' });
    }
};

// 5. ĐOÀN TRƯỜNG: Phán quyết cuối cùng
exports.resolveDispute = async (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // 'confirm' (Đúng là có lỗi) hoặc 'reject' (Hủy lỗi)
    const newStatus = action === 'confirm' ? 'confirmed' : 'rejected';

    try {
        await pool.query('UPDATE violations SET status = ? WHERE id = ?', [newStatus, id]);
        res.json({ success: true, message: 'Đã giải quyết khiếu nại.' });
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Lỗi xử lý' });
    }
};