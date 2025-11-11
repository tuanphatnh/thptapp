const mysql = require('mysql2/promise');
require('dotenv').config();

// Tạo pool kết nối riêng hoặc import từ file cấu hình chung (để đơn giản ta tạo lại ở đây tạm thời)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Hàm lấy tất cả lớp học
exports.getAllClasses = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM classes ORDER BY grade ASC, name ASC');
        res.json(rows);
    } catch (error) {
        console.error('Lỗi lấy danh sách lớp:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách lớp' });
    }
};