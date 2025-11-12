// --- middleware/auth.js ---
// Nhiệm vụ: Chứa các hàm xác thực và phân quyền

import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-key-12345';

// 1. Xác thực (Bạn là ai?)
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 

  if (token == null) {
    return res.status(401).json({ message: 'Không có token truy cập' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
    req.user = user; 
    next(); 
  });
};

// 2. Phân quyền (Bạn được làm gì?)
export const checkRole = (allowedRoles) => (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập chức năng này' });
    }
    next(); 
};