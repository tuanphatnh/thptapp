import React from 'react';
import { ROLES } from '../constants.js'; // Import hằng số

// --- COMPONENT: Header (Chung) ---
export const Header = ({ user, onLogout, onNavigate }) => {
  return (
    <div className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 items-center">
            <h1 className="text-2xl font-bold text-indigo-600 cursor-pointer">
              <a onClick={() => onNavigate('dashboard')}>Hệ thống Thi đua THPT</a>
            </h1>
          </div>
          <div className="ml-auto">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">
                  Chào, <strong>{user.fullname || user.role}</strong>!
                </span>
                <button
                  onClick={onLogout}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Đăng xuất
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200">
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: Sidebar (Chung) ---
export const Sidebar = ({ userRole, onNavigate, currentPage }) => {
  if (!userRole) return null; // Không hiển thị sidebar nếu chưa đăng nhập

  const navClass = (page) =>
    `block px-4 py-2 mt-2 text-sm font-medium rounded-lg ${
      currentPage === page
        ? 'bg-indigo-600 text-white'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
    }`;

  const links = {
    admin: [
      { name: 'Quản trị Người dùng', page: 'admin_users' },
      { name: 'Quản lý Lớp học', page: 'admin_classes' },
      { name: 'Tính Toán Xếp Hạng', page: 'admin_calculate_ranking' },
    ],
    ban_giam_hieu: [
      { name: 'Sổ Đầu Bài (Toàn trường)', page: 'logbook' }, 
      { name: 'Tính Toán Xếp Hạng', page: 'admin_calculate_ranking' },
    ],
    doan_truong: [
      { name: 'Duyệt Lỗi Vi Phạm', page: 'violation_approval' },
      { name: 'Quản lý Thời Khóa Biểu', page: 'schedule_management' },
    ],
    giao_vien: [
      { name: 'Sổ Đầu Bài (Lịch dạy)', page: 'logbook' },
      { name: 'Lỗi Vi Phạm Lớp (CN)', page: 'class_violations' }, 
    ],
    co_do: [{ name: 'Gửi Báo Cáo Vi Phạm', page: 'violation_form' }],
    bi_thu_chi_doan: [{ name: 'Xác Nhận Vi Phạm Lớp', page: 'violation_confirmation' }],
  };

  const userLinks = links[userRole] || [];

  return (
    <nav className="mt-5 space-y-1">
      <a href="#" onClick={() => onNavigate('dashboard')} className={navClass('dashboard')}>
        Bảng Xếp Hạng (Dashboard)
      </a>
      {userLinks.map((link) => (
        <a
          key={link.page}
          href="#"
          onClick={() => onNavigate(link.page)}
          className={navClass(link.page)}
        >
          {link.name}
        </a>
      ))}
    </nav>
  );
};