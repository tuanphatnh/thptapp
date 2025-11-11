import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

// Định nghĩa các vai trò mới theo yêu cầu của bạn
const ROLES = {
    HT_ADMIN: 'ht_admin',           // 1. ADMIN TỐI CAO (Hiệu trưởng/Quản lý hệ thống: Thêm lớp, GV)
    DOAN_TRUONG: 'doan_truong',      // 2. Bí thư/Phó bí thư Đoàn trường (Quản lý vi phạm, xem điểm)
    GIAM_THI_SDB: 'giam_thi_sdb',    // 3. Giám thị ghi nhận Sổ Đầu Bài
    GIAO_VIEN: 'giao_vien',         // 4. Giáo viên chấm Sổ Đầu Bài
    BI_THU_CD: 'bi_thu_cd',         // 5. Bí thư Chi đoàn (Xác nhận lỗi)
    CO_DO: 'co_do'                  // 6. Đội Cờ đỏ (Ghi lỗi)
};

export const AuthProvider = ({ children }) => {
    // Giả lập trạng thái người dùng ban đầu (CHƯA đăng nhập)
    const [user, setUser] = useState(null); 
    const [role, setRole] = useState(null);

    const isLoggedIn = !!user;

    // --- MOCK API FUNCTIONS (Sau này sẽ thay bằng API thật) ---

    // Giả lập đăng nhập
    const login = (roleFromApi, userObject) => {
        // Sẽ dùng userObject từ API
        setUser(userObject);
        setRole(roleFromApi);
        // ...
    };

    // Đăng xuất
    const logout = () => {
        setUser(null);
        setRole(null);
    };

    // Kiểm tra quyền hạn
    const hasRole = (requiredRoles) => {
        if (!role) return false;
        
        // --- QUYỀN TỐI CAO CỦA HT_ADMIN ---
        if (role === ROLES.HT_ADMIN) {
            return true; // HT_ADMIN có quyền truy cập mọi thứ
        }
        // --- END QUYỀN TỐI CAO ---

        if (Array.isArray(requiredRoles)) {
            return requiredRoles.includes(role);
        }
        
        return role === requiredRoles;
    };

    return (
        <AuthContext.Provider value={{
            user,
            role,
            isLoggedIn,
            ROLES,
            login,
            logout,
            hasRole
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);