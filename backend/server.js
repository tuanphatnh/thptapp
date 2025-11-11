// --- Backend Node.js cho Hệ thống Thi đua THPT (Nâng cấp) ---
// Thêm JWT Authentication Middleware và API CRUD cho Users

import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import 'dotenv/config';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// --- Cấu hình ---
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-key-12345';
const SALT_ROUNDS = 10;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Cấu hình Kết nối CSDL ---
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'thpt_thidua',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};
const pool = mysql.createPool(dbConfig);


// --- MIDDLEWARE XÁC THỰC (JWT Authentication) ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expecting "Bearer TOKEN"

  if (token == null) return res.status(401).json({ message: 'Không có token truy cập' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token không hợp lệ' });
    req.user = user; // Gắn thông tin user vào request
    next();
  });
};

// --- MIDDLEWARE PHÂN QUYỀN (Role-Based Access) ---
const checkRole = (allowedRoles) => (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Bạn không có quyền truy cập chức năng này' });
    }
    next();
};


// --- API Endpoints (CRUD) ---

// 1. API Đăng ký (Public) - Vẫn giữ nguyên
app.post('/api/register', async (req, res) => {
  const { username, password, fullname, role, chuc_vu, class_id } = req.body;

  if (!username || !password || !fullname || !role) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đủ thông tin bắt buộc' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await pool.query(
      'INSERT INTO users (username, password_hash, fullname, role, chuc_vu, class_id) VALUES (?, ?, ?, ?, ?, ?)',
      [username, passwordHash, fullname, role, chuc_vu || role, class_id || null]
    );

    res.status(201).json({ success: true, message: 'Đăng ký thành công!', userId: result.insertId });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Tên đăng nhập đã tồn tại' });
    }
    console.error('Lỗi API Đăng ký:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
  }
});


// 2. API Đăng nhập (Public) - Vẫn giữ nguyên
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Tên đăng nhập không tồn tại' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
       return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác' });
    }

    delete user.password_hash;
    const token = jwt.sign(
      { userId: user.user_id, role: user.role, fullname: user.fullname }, 
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ success: true, message: 'Đăng nhập thành công!', user: user, token: token });

  } catch (error) {
    console.error('Lỗi API Đăng nhập:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
  }
});


// 3. API Lấy Bảng Xếp Hạng Tuần (Public) - Vẫn giữ nguyên
app.get('/api/rankings', async (req, res) => {
  try {
    // Lấy dữ liệu từ bảng rankings (hoặc view bạn đã tạo)
    const [rankings] = await pool.query(
      `SELECT r.class_id, c.class_name as ten_lop, r.total_points as total_score, 
              RANK() OVER (PARTITION BY r.week_number ORDER BY r.total_points DESC) as rank_position
       FROM weekly_rankings r
       JOIN classes c ON r.class_id = c.class_id
       WHERE r.week_number = ?
       ORDER BY rank_position ASC`,
      [30] // Ví dụ: Lấy tuần 30
    );

    // Dữ liệu giả nếu CSDL trống
    if (rankings.length === 0) {
       const MOCK_RANKING_DATA = [
          { ten_lop: '12A1', total_score: 950, rank_position: 1 },
          { ten_lop: '11A2', total_score: 920, rank_position: 2 },
          { ten_lop: '10A3', total_score: 900, rank_position: 3 },
       ];
       return res.json({ success: true, rankings: MOCK_RANKING_DATA });
    }
    
    res.json({ success: true, rankings: rankings });
  } catch (error) {
    console.error('Lỗi API Bảng xếp hạng:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
  }
});


// 4. API Lấy Danh sách User (Admin Only) - MỚI
app.get('/api/admin/users', authenticateToken, checkRole(['admin']), async (req, res) => {
    try {
        const [users] = await pool.query('SELECT user_id, username, fullname, role, chuc_vu, class_id FROM users');
        res.json({ success: true, users });
    } catch (error) {
        console.error('Lỗi API Lấy User:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
    }
});

// 5. API Thêm User (Admin Only) - MỚI
app.post('/api/admin/users', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { username, password, fullname, role, chuc_vu, class_id } = req.body;
    if (!username || !password || !fullname || !role) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }
    try {
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const [result] = await pool.query(
            'INSERT INTO users (username, password_hash, fullname, role, chuc_vu, class_id) VALUES (?, ?, ?, ?, ?, ?)',
            [username, passwordHash, fullname, role, chuc_vu || role, class_id || null]
        );
        res.status(201).json({ success: true, message: 'Thêm người dùng thành công', userId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ success: false, message: 'Tên đăng nhập đã tồn tại' });
        }
        console.error('Lỗi API Thêm User:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
    }
});

// 6. API Cập nhật User (Admin Only) - MỚI
app.put('/api/admin/users/:userId', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { userId } = req.params;
    const { fullname, role, chuc_vu, class_id, password } = req.body;
    
    let query = 'UPDATE users SET fullname = ?, role = ?, chuc_vu = ?, class_id = ?';
    const params = [fullname, role, chuc_vu, class_id];

    // Chỉ cập nhật mật khẩu nếu có nhập mật khẩu mới
    if (password) {
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        query += ', password_hash = ?';
        params.push(passwordHash);
    }

    query += ' WHERE user_id = ?';
    params.push(userId);
    
    try {
        const [result] = await pool.query(query, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }
        res.json({ success: true, message: 'Cập nhật người dùng thành công' });
    } catch (error) {
        console.error('Lỗi API Cập nhật User:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
    }
});


// 7. API Xóa User (Admin Only) - MỚI
app.delete('/api/admin/users/:userId', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { userId } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM users WHERE user_id = ?', [userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }
        res.json({ success: true, message: 'Xóa người dùng thành công' });
    } catch (error) {
        console.error('Lỗi API Xóa User:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
    }
});

// --- Khởi động máy chủ ---
app.listen(PORT, () => {
  console.log(`Backend server đang chạy tại http://localhost:${PORT}`);
});