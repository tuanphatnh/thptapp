import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './MainLayout.css';

function MainLayout() {
  const location = useLocation();
  const { isLoggedIn, role, logout, ROLES, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Logic kiểm tra xem link có nên hiển thị không (Role-Based Visibility)
  const isLinkVisible = (requiredRoles) => {
    if (!isLoggedIn) return false;
    
    // --- QUYỀN TỐI CAO CỦA HT_ADMIN ---
    if (role === ROLES.HT_ADMIN) return true; 
    // --- END QUYỀN TỐI CAO ---

    if (Array.isArray(requiredRoles)) {
        return requiredRoles.includes(role);
    }
    return role === requiredRoles;
  }
  
  const getLinkClass = (path) => location.pathname === path ? 'active' : '';

  // --- LOGIC XỬ LÝ CHUYỂN HƯỚNG/KHÔNG ĐĂNG NHẬP ---
  if (!isLoggedIn && location.pathname !== '/login') {
    return (
        <div className="page-container" style={{ padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '100px auto' }}>
            <h1 className="page-title" style={{ color: '#dc2626' }}>Bạn cần đăng nhập để truy cập hệ thống!</h1>
            <p style={{ marginTop: '20px' }}>
                Vui lòng 
                <Link to="/login" style={{ color: '#2563eb', fontWeight: 'bold', marginLeft: '5px' }}>
                    Chuyển đến trang Đăng nhập
                </Link>
            </p>
        </div>
    );
  }
  // --- END LOGIC CHUYỂN HƯỚNG ---


  return (
    <div className="main-layout">
      {/* Header cho Mobile (Chứa nút 3 gạch) */}
      <header className="mobile-header">
        <div className="mobile-brand">Smart School</div>
        <button 
          className="menu-toggle" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Navbar (Sidebar) */}
      <nav className={`navbar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="navbar-brand">Smart School</div>
        
        {isLoggedIn && (
            <div className="user-info">
                <p>Xin chào, {user.name}!</p>
                <p className="role-tag">Vai trò: {role}</p>
            </div>
        )}

        <ul className="navbar-menu">
          {/* Trang chủ/Dashboard - Dành cho tất cả khi đã đăng nhập */}
          {isLoggedIn && (
            <li>
              <Link to="/" className={getLinkClass('/')} onClick={closeMobileMenu}>📊 Tổng quan (Dashboard)</Link>
            </li>
          )}

          {/* HIỂN THỊ CHỨC NĂNG CỜ ĐỎ */}
          {isLinkVisible([ROLES.CO_DO]) && (
            <li>
              <Link to="/monitor" className={getLinkClass('/monitor')} onClick={closeMobileMenu}>🚩 Ghi lỗi (Cờ đỏ)</Link>
            </li>
          )}
          
          {/* HIỂN THỊ CHỨC NĂNG BÍ THƯ CHI ĐOÀN */}
          {isLinkVisible([ROLES.BI_THU_CD]) && (
            <li>
              <Link to="/secretary" className={getLinkClass('/secretary')} onClick={closeMobileMenu}>✅ Xác nhận Lỗi (Bí thư CD)</Link>
            </li>
          )}

          {/* HIỂN THỊ CHỨC NĂNG SỔ ĐẦU BÀI (cho GV và Giám thị SĐB) */}
          {isLinkVisible([ROLES.GIAO_VIEN, ROLES.GIAM_THI_SDB]) && (
            <li>
              <Link to="/classlog" className={getLinkClass('/classlog')} onClick={closeMobileMenu}>📖 Sổ Đầu Bài (GV)</Link>
            </li>
          )}

          {/* CHỨC NĂNG DUYỆT LỖI CUỐI CÙNG (Đoàn trường) */}
          {isLinkVisible([ROLES.DOAN_TRUONG]) && (
            <li>
              <Link to="/admin" className={getLinkClass('/admin')} onClick={closeMobileMenu}>⚖️ Duyệt Khiếu nại (Đoàn tr.)</Link>
            </li>
          )}

           {/* CHỨC NĂNG ADMIN TỐI CAO (HT_ADMIN) */}
          {isLinkVisible([ROLES.HT_ADMIN]) && (
            <li>
              <Link to="/settings" className={getLinkClass('/settings')} onClick={closeMobileMenu}>⚙️ Quản trị Hệ thống</Link>
            </li>
          )}
          
          {/* Menu Đăng xuất */}
          {isLoggedIn && (
            <li>
              <button className="logout-btn" onClick={() => { logout(); closeMobileMenu(); }}>Đăng xuất</button>
            </li>
          )}

        </ul>
      </nav>

      {isMobileMenuOpen && <div className="mobile-overlay" onClick={closeMobileMenu}></div>}

      <main className="content-area">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;