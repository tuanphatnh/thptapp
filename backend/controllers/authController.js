const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // Dùng để xử lý mật khẩu băm
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, waitForConnections: true, connectionLimit: 10, queueLimit: 0
});

// SECRET KEY cho JWT (nên lưu trong .env cho bảo mật)
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_12345';

// API Đăng nhập
exports.login = async (req, res) => {
    const { username, password } = req.body;

    // QUAN TRỌNG: Backend này chưa dùng bcrypt để mã hóa, nên ta phải giả lập
    // Nếu mật khẩu trong DB của bạn là '123456', ta so sánh thô trước.
    const MOCK_PASSWORD_CHECK = (dbHash, inputPassword) => {
        // Trong môi trường thật: return bcrypt.compareSync(inputPassword, dbHash);
        return inputPassword === dbHash; // Giả lập so sánh mật khẩu thô
    }

    try {
        const [users] = await pool.query('SELECT id, username, password_hash, full_name, role, class_id FROM users WHERE username = ?', [username]);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Tên đăng nhập không tồn tại.' });
        }

        const user = users[0];
        
        // Kiểm tra mật khẩu (Giả lập)
        if (!MOCK_PASSWORD_CHECK(user.password_hash, password)) {
            return res.status(401).json({ message: 'Mật khẩu không đúng.' });
        }

        // Tạo JWT Token
        const token = jwt.sign(
            { id: user.id, role: user.role, classId: user.class_id },
            JWT_SECRET,
            { expiresIn: '1h' } // Token hết hạn sau 1 giờ
        );

        // Trả về token và thông tin user (trừ password_hash)
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.full_name,
                role: user.role,
                classId: user.class_id
            },
            message: 'Đăng nhập thành công!'
        });

    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        res.status(500).json({ message: 'Lỗi server khi xử lý đăng nhập.' });
    }
};