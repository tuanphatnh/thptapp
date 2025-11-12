// --- server.js (Tệp Chính) ---
// Nhiệm vụ: Khởi động server, tải middleware và kết nối các routes.

import express from 'express';
import cors from 'cors';
import 'dotenv/config';

// Import các tệp routes
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import logbookRoutes from './routes/logbookRoutes.js';
import violationRoutes from './routes/violationRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import rankingRoutes from './routes/rankingRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Tải Routes (Kết nối API)
// Tất cả API sẽ có tiền tố /api
app.use('/api', authRoutes);        // /api/register, /api/login
app.use('/api', adminRoutes);       // /api/admin/users, /api/admin/classes
app.use('/api', scheduleRoutes);    // /api/schedules/...
app.use('/api', logbookRoutes);     // /api/logbook/...
app.use('/api', violationRoutes);   // /api/violations/...
app.use('/api', publicRoutes);      // /api/rankings, /api/classes, /api/rules
app.use('/api', rankingRoutes);     // /api/calculate-ranking

// Khởi động máy chủ
app.listen(PORT, () => {
  console.log(`Backend server (đã refactor) đang chạy tại http://localhost:${PORT}`);
});