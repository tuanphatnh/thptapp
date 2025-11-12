// --- routes/adminRoutes.js ---
// Nhiệm vụ: Tất cả API cho Admin (Quản lý User và Lớp)
// (SỬA V5.13) Thêm logic CHẶN XÓA user nếu có dữ liệu liên kết

import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcrypt';
import { authenticateToken, checkRole } from '../middleware/auth.js';

const router = express.Router();
const SALT_ROUNDS = 10;

// Áp dụng middleware xác thực và phân quyền Admin cho TẤT CẢ route trong tệp này
router.use('/admin', authenticateToken, checkRole(['admin']));

// Lấy Danh sách User (Admin Only)
// GET /api/admin/users
router.get('/admin/users', async (req, res) => {
    try {
        const [users] = await pool.query('SELECT user_id, username, fullname, role, chuc_vu, class_id FROM users');
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
});

// Thêm User (Admin Only)
// POST /api/admin/users
router.post('/admin/users', async (req, res) => {
    // (SỬA LỖI V5.13) Nhận 'chuc_vu' từ Frontend (đã tự động điền)
    const { username, password, fullname, role, chuc_vu, class_id } = req.body;
    if (!username || !password || !fullname || !role) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }
    try {
        // (SỬA LỖI V5.13) Thêm logic kiểm tra trùng lặp vai trò/lớp
        // (Chỉ áp dụng cho Bí thư và GVCN)
        if ((role === 'bi_thu_chi_doan' || role === 'giao_vien') && class_id) {
            const [existing] = await pool.query(
                'SELECT user_id FROM users WHERE role = ? AND class_id = ?',
                [role, class_id]
            );
            if (existing.length > 0) {
                return res.status(409).json({ success: false, message: `Lỗi: Lớp này đã có ${role === 'bi_thu_chi_doan' ? 'Bí thư' : 'GVCN'} rồi.` });
            }
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const [result] = await pool.query(
            'INSERT INTO users (username, password_hash, fullname, role, chuc_vu, class_id) VALUES (?, ?, ?, ?, ?, ?)',
            // (SỬA LỖI V5.13) Dùng chuc_vu được gửi từ Frontend
            [username, passwordHash, fullname, role, chuc_vu, class_id || null]
        );
        res.status(201).json({ success: true, message: 'Thêm người dùng thành công', userId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ success: false, message: 'Tên đăng nhập đã tồn tại' });
        }
        console.error("Lỗi API Thêm User:", error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
});

// Cập nhật User (Admin Only)
// PUT /api/admin/users/:userId
router.put('/admin/users/:userId', async (req, res) => {
    const { userId } = req.params;
    const { fullname, role, chuc_vu, class_id, password } = req.body;
    
    let query = 'UPDATE users SET fullname = ?, role = ?, chuc_vu = ?, class_id = ?';
    const params = [fullname, role, chuc_vu, class_id || null]; 

    try {
        // (SỬA LỖI V5.13) Thêm logic kiểm tra trùng lặp vai trò/lớp
        // (Chỉ áp dụng cho Bí thư và GVCN, và phải KHÁC user_id hiện tại)
        if ((role === 'bi_thu_chi_doan' || role === 'giao_vien') && class_id) {
            const [existing] = await pool.query(
                'SELECT user_id FROM users WHERE role = ? AND class_id = ? AND user_id != ?',
                [role, class_id, userId]
            );
            if (existing.length > 0) {
                return res.status(409).json({ success: false, message: `Lỗi: Lớp này đã có ${role === 'bi_thu_chi_doan' ? 'Bí thư' : 'GVCN'} khác.` });
            }
        }

      if (password && password.length > 0) {
          const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
          query += ', password_hash = ?';
          params.push(passwordHash);
      }
      query += ' WHERE user_id = ?';
      params.push(userId);
    
      const [result] = await pool.query(query, params);
      if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
      }
      res.json({ success: true, message: 'Cập nhật người dùng thành công' });
    } catch (error) {
        console.error("Lỗi API Cập nhật User:", error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
});

// Xóa User (Admin Only)
// DELETE /api/admin/users/:userId
router.delete('/api/admin/users/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM users WHERE user_id = ?', [userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }
        res.json({ success: true, message: 'Xóa người dùng thành công' });
    } catch (error) {
        // (SỬA LỖI V5.13) Bắt lỗi Foreign Key
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
            return res.status(409).json({ 
                success: false, 
                message: 'Lỗi: Không thể xóa người dùng này. Người dùng này đã có dữ liệu liên kết (ví dụ: đã chấm Sổ đầu bài, đã được phân công TKB, hoặc đã báo cáo vi phạm).' 
            });
        }
        console.error('Lỗi API Xóa User:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
});

// Thêm Lớp học (Admin Only)
// POST /api/admin/classes
router.post('/api/admin/classes', async (req, res) => {
    const { class_name, grade_level, school_year } = req.body; 
    if (!class_name || !grade_level || !school_year) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin Tên lớp, Khối hoặc Năm học.' });
    }
    try {
        await pool.query(
            'INSERT INTO classes (class_name, grade_level, school_year) VALUES (?, ?, ?)', 
            [class_name, grade_level, school_year]
        );
        res.status(201).json({ success: true, message: 'Thêm lớp học thành công' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ success: false, message: `Lỗi: Lớp ${class_name} năm học ${school_year} đã tồn tại.` });
        }
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
});

// Xóa Lớp học (Admin Only)
// DELETE /api/admin/classes/:classId
router.delete('/api/admin/classes/:classId', async (req, res) => {
    const { classId } = req.params;
    try {
        await pool.query('DELETE FROM classes WHERE class_id = ?', [classId]);
        res.json({ success: true, message: 'Xóa lớp học thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
});

export default router;