require('dotenv').config(); // Tải các biến môi trường từ file .env
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
// Khởi tạo app Express
const app = express();
const port = process.env.PORT || 5001;

const classRoutes = require('./routes/classRoutes'); 
const violationdRoutes = require('./routes/violationRoutes'); 
const dashboardRoutes = require('./routes/dashboardRoutes'); 
const authRoutes = require('./routes/authRoutes'); 

// Sử dụng middleware
app.use(cors()); // Cho phép Frontend gọi API
app.use(express.json()); // Đọc được JSON từ request

// Đăng ký Route
app.use('/api/classes', classRoutes);
app.use('/api/violation', violationdRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/auth', authRoutes);
// --- Cấu hình kết nối Database (Connection Pool) ---
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// --- API Test Kết nối Database ---
app.get('/api/test-db', async (req, res) => {
    try {
        // Lấy 1 kết nối từ pool
        const connection = await pool.getConnection();
        
        // Thực thi một câu lệnh SQL đơn giản (SELECT NOW() trả về giờ hiện tại của server DB)
        const [rows] = await connection.query('SELECT NOW() as db_time');
        
        // Trả kết nối về pool
        connection.release();
        
        // Trả về kết quả cho client
        res.json({ 
            success: true, 
            message: 'Kết nối database thành công!', 
            dbTime: rows[0].db_time 
        });

    } catch (error) {
        // Báo lỗi nếu kết nối thất bại
        res.status(500).json({ 
            success: false, 
            message: 'Kết nối database THẤT BẠI!', 
            error: error.message 
        });
    }
});

// Khởi động server
app.listen(port, () => {
    console.log(`Backend server đang chạy tại http://localhost:${port}`);
});