import React from 'react';
import { useAuth } from '../context/AuthContext';

function ClassLogPage() {
    const { role, ROLES } = useAuth();
    
    // Kiểm tra quyền: Giáo viên HOẶC Giám thị SĐB
    const isAuthorized = role === ROLES.GIAO_VIEN || role === ROLES.GIAM_THI_SDB;

    if (!isAuthorized) {
        return (
            <div className="page-container" style={{ textAlign: 'center', marginTop: '50px' }}>
                <h2 className="page-title" style={{ color: '#dc2626' }}>Truy cập bị từ chối!</h2>
                <p>Chỉ Giáo viên hoặc Giám thị Sổ Đầu Bài mới có quyền truy cập.</p>
            </div>
        );
    }

    return (
        <div className="page-container">
            <h2 className="page-title" style={{ color: '#d97706' }}>📖 Sổ Đầu Bài Điện Tử</h2>
            <p>Nội dung ghi chép và chấm điểm từng tiết học sẽ được xây dựng tại đây.</p>
        </div>
    );
}

export default ClassLogPage;