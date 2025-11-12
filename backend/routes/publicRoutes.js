// --- routes/publicRoutes.js ---
// Nhiệm vụ: Các API công khai (Rankings) và API chung (Classes, Rules)

import express from 'express';
import pool from '../db.js';
import dayjs from 'dayjs';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// API Lấy Bảng Xếp Hạng (Public - không cần authenticateToken)
router.get('/rankings', async (req, res) => {
  const { week_number } = req.query;
  const currentWeek = week_number || dayjs().isoWeek(); 

  try {
    const [rankings] = await pool.query(
      `SELECT r.class_id, c.class_name as ten_lop, r.total_points as total_score,
              r.logbook_points, r.violation_points,
              RANK() OVER (ORDER BY r.total_points DESC) as rank_position
       FROM weekly_rankings r
       JOIN classes c ON r.class_id = c.class_id
       WHERE r.week_number = ?
       ORDER BY r.total_points DESC`,
      [currentWeek]
    );

    if (rankings.length === 0) {
      const MOCK_RANKING_DATA = [
        { class_id: 1, ten_lop: '12A1', total_score: 100, rank_position: 1, logbook_points: 0, violation_points: 0 },
        { class_id: 2, ten_lop: '11A2', total_score: 95, rank_position: 2, logbook_points: 0, violation_points: -5 },
      ];
      return res.json({ success: true, rankings: MOCK_RANKING_DATA });
    }
    
    res.json({ success: true, rankings: rankings });
  } catch (error) {
    console.error('Lỗi API Bảng xếp hạng:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
  }
});


// API LẤY DANH SÁCH LỚP HỌC (Yêu cầu đăng nhập)
router.get('/classes', authenticateToken, async (req, res) => {
  try {
    const [classes] = await pool.query('SELECT * FROM classes ORDER BY school_year DESC, grade_level ASC, class_name ASC');
    res.json({ success: true, classes });
  } catch (error) {
    console.error('Lỗi API Lấy Lớp học:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// API LẤY TẤT CẢ QUY TẮC ĐIỂM (Yêu cầu đăng nhập)
router.get('/rules', authenticateToken, async (req, res) => {
    try {
        const [rules] = await pool.query('SELECT * FROM violation_types');
        res.json({ success: true, rules });
    } catch (error) {
        console.error('Lỗi API Lấy Quy tắc:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
});

export default router;