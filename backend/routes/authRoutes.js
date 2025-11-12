// --- routes/authRoutes.js ---
// Nhiệm vụ: API Đăng nhập và Đăng ký

import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js'; // Import CSDL

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-key-12345';
const SALT_ROUNDS = 10;

// API Đăng ký 
router.post('/register', async (req, res) => {
  const { username, password, fullname, role, chuc_vu, class_id } = req.body;
  if (!username || !password || !fullname || !role) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đủ thông tin (username, password, fullname, role)' });
  }

  try {
    // Kiểm tra trùng lặp vai trò/lớp
    if ((role === 'bi_thu_chi_doan' || role === 'giao_vien') && class_id) {
        const [existing] = await pool.query(
            'SELECT user_id FROM users WHERE role = ? AND class_id = ?',
            [role, class_id]
        );
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: `Lỗi: Lớp này đã có ${role === 'bi_thu_chi_doan' ? 'Bí thư' : 'GVCN'}.` });
        }
    }

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

// API Đăng nhập
router.post('/login', async (req, res) => {
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

    const payload = {
      user_id: user.user_id, 
      role: user.role,
      fullname: user.fullname,
      class_id: user.class_id
    };
    
    delete user.password_hash; 
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' }); 

    res.json({ 
      success: true, 
      message: 'Đăng nhập thành công!', 
      user: user, 
      token: token 
    });

  } catch (error) {
    console.error('Lỗi API Đăng nhập:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
  }
});

export default router;