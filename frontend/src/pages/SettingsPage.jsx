import React from 'react';
import { useAuth } from '../context/AuthContext';

function SettingsPage() {
    const { role, ROLES } = useAuth();
    
    // Chỉ HT_ADMIN mới có quyền truy cập
    if (role !== ROLES.HT_ADMIN) {
        return (
            <div className="page-container" style={{ textAlign: 'center', marginTop: '50px' }}>
                <h2 className="page-title" style={{ color: '#dc2626' }}>Truy cập bị từ chối!</h2>
                <p>Chỉ Admin Tối Cao mới có quyền quản lý hệ thống.</p>
            </div>
        );
    }

    return (
        <div className="page-container">
            <h2 className="page-title" style={{ color: '#7e22ce' }}>⚙️ Quản trị Hệ thống (Admin Tối Cao)</h2>
            <p style={{ color: '#6b7280' }}>Đây là nơi Hiệu trưởng hoặc Ban quản trị có thể thiết lập các thông số gốc của hệ thống.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
                
                {/* Quản lý Lớp học */}
                <div style={{ border: '1px solid #e5e7eb', padding: '1.5rem', borderRadius: '8px', backgroundColor: '#fff' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Quản lý Lớp học</h3>
                    <p style={{ marginBottom: '1.5rem' }}>Thêm mới, sửa tên, hoặc xóa các chi đoàn (10A1, 11B2...).</p>
                    <button className="btn btn-primary">Thêm Lớp mới</button>
                </div>

                {/* Quản lý Tài khoản */}
                <div style={{ border: '1px solid #e5e7eb', padding: '1.5rem', borderRadius: '8px', backgroundColor: '#fff' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Quản lý Tài khoản (User)</h3>
                    <p style={{ marginBottom: '1.5rem' }}>Cấp tài khoản và phân quyền cho Giáo viên, Bí thư Chi đoàn, v.v.</p>
                    <button className="btn btn-primary">Tạo Tài khoản</button>
                </div>

                 {/* Cấu hình lỗi vi phạm */}
                 <div style={{ border: '1px solid #e5e7eb', padding: '1.5rem', borderRadius: '8px', backgroundColor: '#fff' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Cấu hình Lỗi Vi phạm</h3>
                    <p style={{ marginBottom: '1.5rem' }}>Thêm/sửa loại lỗi và điểm trừ cố định.</p>
                    <button className="btn btn-primary">Quản lý Lỗi</button>
                </div>

                {/* Cấu hình Sổ Đầu Bài */}
                <div style={{ border: '1px solid #e5e7eb', padding: '1.5rem', borderRadius: '8px', backgroundColor: '#fff' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Cấu hình Sổ Đầu Bài</h3>
                    <p style={{ marginBottom: '1.5rem' }}>Cài đặt số tiết, quy tắc xếp loại tiết học (A, B, C, D).</p>
                    <button className="btn btn-primary">Cấu hình</button>
                </div>

            </div>
        </div>
    );
}

export default SettingsPage;