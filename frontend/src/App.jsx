// --- Hệ thống Thi đua THPT - React Frontend (Nâng cấp V5.11 - Đầy đủ) ---
// SỬA LỖI (V5.10): Xóa mảng 'ROLES' bị lỗi bên trong UserManagementPage
// SỬA LỖI (V5.11): Hoán đổi 2 cột 'Vai trò' và 'Chức vụ' trong bảng Admin

import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import jwt_decode from 'jwt-decode'; // Đã xóa
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';

// Cài đặt Day.js
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);
dayjs.locale('vi');

// --- TÁI SỬ DỤNG: Hàm gọi API (fetchData) ---
const fetchData = async (url, method = 'GET', data = null, token = null) => {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }

  const config = {
    method: method,
    headers: headers,
    body: data ? JSON.stringify(data) : null,
  };

  try {
    const response = await fetch(`http://localhost:3001${url}`, config);

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('appUser'); 
      window.location.reload(); 
    }
    
    const result = await response.json().catch(() => {
        if (response.ok) return { success: true, message: 'Hành động thành công' };
        return { message: `Lỗi ${response.status} - Phản hồi không phải JSON.` };
    });

    if (!response.ok) {
      console.error(`Lỗi API (${response.status}) tại ${url}:`, result.message);
      throw new Error(result.message || `Lỗi ${response.status}`);
    }

    return result;

  } catch (error) {
    console.error(`Lỗi mạng hoặc API tại ${url}:`, error.message);
    if (error.message.includes('Failed to fetch')) {
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend (server.js) có đang chạy không.');
    }
    throw error;
  }
};

// --- TÁI SỬ DỤNG: Hàm lấy số tuần và ngày ---
const getWeekNumber = (date) => {
  return dayjs(date).isoWeek();
};

const getStartAndEndOfWeek = (weekNumber, year = dayjs().year()) => {
  const startDate = dayjs().year(year).isoWeek(weekNumber).startOf('isoWeek');
  const endDate = dayjs().year(year).isoWeek(weekNumber).endOf('isoWeek');
  return {
    start: startDate.format('DD/MM/YYYY'),
    end: endDate.format('DD/MM/YYYY'),
  };
};

// (MỚI V5.1) Hook tùy chỉnh để tải 55 quy tắc
const useRules = (token) => {
    const [allRules, setAllRules] = useState([]);
    const [rulesError, setRulesError] = useState(null);
    const [isLoadingRules, setIsLoadingRules] = useState(true);

    useEffect(() => {
        if (!token) return;

        const loadRules = async () => {
            try {
                const data = await fetchData('/api/rules', 'GET', null, token);
                setAllRules(data.rules || []);
            } catch (err) {
                setRulesError(err.message);
            } finally {
                setIsLoadingRules(false);
            }
        };
        loadRules();
    }, [token]);

    // Trả về các quy tắc đã được lọc sẵn
    const categorizedRules = useMemo(() => {
        return {
            inClassRules: allRules.filter(r => r.is_in_class_violation === 0), // Lỗi trong giờ (SĐB)
            outOfClassRules: allRules.filter(r => r.is_in_class_violation === 1), // Lỗi ngoài giờ (Cờ đỏ)
            bonusRules: allRules.filter(r => r.is_in_class_violation === 2), // Thưởng
        };
    }, [allRules]);

    return { allRules, ...categorizedRules, rulesError, isLoadingRules };
};

// (MỚI V5.7) Hook tải Lớp học
const useClasses = (token) => {
    const [classes, setClasses] = useState([]);
    const [classesError, setClassesError] = useState(null);
    const [isLoadingClasses, setIsLoadingClasses] = useState(true);

    const loadClasses = useCallback(async () => {
        if (!token) return;
        setIsLoadingClasses(true);
        try {
            const data = await fetchData('/api/classes', 'GET', null, token);
            setClasses(data.classes || []);
        } catch (err) {
            setClassesError(err.message);
        } finally {
            setIsLoadingClasses(false);
        }
    }, [token]);

    useEffect(() => {
        loadClasses();
    }, [loadClasses]);

    return { classes, classesError, isLoadingClasses, refreshClasses: loadClasses };
};

// (MỚI V5.8) SỬA LỖI: Thêm lại hằng số ROLES đã bị xóa
const ROLES = [
  { value: 'admin', label: 'Admin (Quản trị hệ thống)' },
  { value: 'ban_giam_hieu', label: 'Ban Giám Hiệu' },
  { value: 'doan_truong', label: 'Đoàn Trường' },
  { value: 'co_do', label: 'Cờ Đỏ' },
  { value: 'bi_thu_chi_doan', label: 'Bí Thư Chi Đoàn' },
  { value: 'giao_vien', label: 'Giáo Viên' },
];

// --- COMPONENT: Header (Chung) ---
const Header = ({ user, onLogout, onNavigate }) => {
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
const Sidebar = ({ userRole, onNavigate, currentPage }) => {
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
      { name: 'Sổ Đầu Bài (Toàn trường)', page: 'logbook' }, // (Chưa implement V5.1)
      { name: 'Tính Toán Xếp Hạng', page: 'admin_calculate_ranking' },
    ],
    doan_truong: [
      { name: 'Duyệt Lỗi Vi Phạm', page: 'violation_approval' },
      { name: 'Quản lý Thời Khóa Biểu', page: 'schedule_management' },
    ],
    giao_vien: [
      { name: 'Sổ Đầu Bài (Lịch dạy)', page: 'logbook' },
      { name: 'Lỗi Vi Phạm Lớp (CN)', page: 'class_violations' }, // (Chưa implement)
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

// --- COMPONENT: LoginPage (Trang Đăng nhập) ---
const LoginPage = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await fetchData('/api/login', 'POST', { username, password });
      if (data.success && data.token) {
        onLoginSuccess(data.token, data.user);
      } else {
        setError(data.message || 'Đăng nhập thất bại');
      }
    } catch (err) {
      setError(err.message || 'Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 pt-12">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          Đăng nhập Hệ thống Thi đua
        </h2>
        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Tên đăng nhập
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// --- COMPONENT: RankingDashboard (Trang Dashboard Xếp hạng Công khai) ---
const RankingDashboard = ({ token }) => {
  const [rankings, setRankings] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(getWeekNumber(new Date()));
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);

  const loadRankings = useCallback(async (week) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchData(`/api/rankings?week_number=${week}`, 'GET', null, token);
      setRankings(data.rankings || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]); 

  useEffect(() => {
    loadRankings(selectedWeek);
  }, [selectedWeek, loadRankings]); 

  const weekOptions = Array.from({ length: 52 }, (_, i) => i + 1);
  const weekDates = getStartAndEndOfWeek(selectedWeek);

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold text-gray-800">
          Bảng Xếp Hạng Thi Đua Tuần
        </h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-600">
            Chọn tuần:
          </span>
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(Number(e.target.value))}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            {weekOptions.map(week => (
              <option key={week} value={week}>Tuần {week}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="mb-6 text-lg text-gray-600">
        Hiển thị kết quả cho Tuần <strong>{selectedWeek}</strong> ({weekDates.start} - {weekDates.end}).
      </p>

      {isLoading && <p>Đang tải dữ liệu...</p>}
      {error && <p className="text-red-600">Lỗi: {error}</p>}

      {!isLoading && !error && (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-indigo-600">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Hạng
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Tên Lớp
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Tổng Điểm
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Điểm SĐB
                </th>
                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Điểm VP/Thưởng
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rankings.length > 0 ? (
                  rankings.map((team, index) => (
                    <tr key={team.class_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-indigo-700">
                          {team.rank_position}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{team.ten_lop}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{team.total_score}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${team.logbook_points < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {team.logbook_points}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${team.violation_points < 0 ? 'text-red-600' : 'text-green-600'}`}>
                           {team.violation_points}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      Chưa có dữ liệu xếp hạng cho tuần này.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};


// --- COMPONENT: UserManagementPage (Admin) ---
// (SỬA V5.11) Nhận 'classes' từ App (Hook)
const UserManagementPage = ({ token, onNavigate, classes }) => {
  const [users, setUsers] = useState([]);
  // const [classes, setClasses] = useState([]); // (SỬA V5.7) Không dùng state nội bộ
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State cho form (Thêm/Sửa)
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [editUserId, setEditUserId] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [role, setRole] = useState('giao_vien');
  const [chuc_vu, setChucVu] = useState('Giáo viên');
  const [classId, setClassId] = useState('');

  // (SỬA LỖI V5.10) XÓA DÒNG NÀY: const ROLES = ['admin', ...]; 
  // Nó đã được định nghĩa ở global (dòng 161)

  // Tải Users
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const usersData = await fetchData('/api/admin/users', 'GET', null, token);
      setUsers(usersData.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const resetForm = () => {
    setFormMode('add');
    setEditUserId(null);
    setUsername('');
    setPassword('');
    setFullname('');
    setRole('giao_vien');
    setChucVu('Giáo viên');
    setClassId('');
  };

  const handleEditClick = (user) => {
    setFormMode('edit');
    setEditUserId(user.user_id);
    setUsername(user.username);
    setFullname(user.fullname);
    setRole(user.role);
    setChucVu(user.chuc_vu || '');
    setClassId(user.class_id || '');
    setPassword(''); // Mật khẩu luôn trống khi sửa
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userData = { username, password, fullname, role, chuc_vu, class_id: classId || null };
    
    if (!userData.password) delete userData.password; 
    if (!userData.class_id) userData.class_id = null; 
    
    try {
        if (formMode === 'add') {
            await fetchData('/api/admin/users', 'POST', userData, token);
        } else {
            await fetchData(`/api/admin/users/${editUserId}`, 'PUT', userData, token);
        }
        resetForm();
        loadUsers(); // Tải lại danh sách
    } catch (err) {
        setError(err.message); // Hiển thị lỗi (ví dụ: Tên đăng nhập trùng)
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Bạn có chắc muốn xóa người dùng này?')) {
        try {
            await fetchData(`/api/admin/users/${userId}`, 'DELETE', null, token);
            loadUsers(); // Tải lại danh sách
        } catch (err) {
            setError(err.message);
        }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">
          Quản trị Người dùng
        </h2>
        <a
          href="#"
          onClick={() => onNavigate('admin_classes')}
          className="text-indigo-600 hover:text-indigo-800 font-medium">
          Quản lý Lớp học &rarr;
        </a>
      </div>
      
      {error && <p className="text-red-600 bg-red-100 p-3 rounded-md mb-4">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Thêm/Sửa */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">
            {formMode === 'add' ? 'Thêm Người Dùng Mới' : 'Cập nhật Người Dùng'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label>Tên đăng nhập</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={formMode === 'edit'} // Không cho sửa username
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100"/>
            </div>
            <div>
              <label>Mật khẩu {formMode === 'edit' && '(Để trống nếu không đổi)'}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm"/>
            </div>
            <div>
              <label>Họ và Tên</label>
              <input
                type="text"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm"/>
            </div>
            <div>
              <label>Vai trò (Role)</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm">
                {/* (SỬA LỖI V5.8) Dùng ROLES (toàn cục) */}
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label>Chức vụ (Hiển thị)</label>
              <input
                type="text"
                value={chuc_vu}
                onChange={(e) => setChucVu(e.target.value)}
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm"/>
            </div>
            <div>
              <label>Lớp (nếu là Bí thư/Giáo viên CN)</label>
              <select
                value={classId || ''} // Đảm bảo value không phải là null
                onChange={(e) => setClassId(e.target.value)}
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm">
                <option value="">Không áp dụng</option>
                {classes.map(c => (
                  <option key={c.class_id} value={c.class_id}>{c.class_name} ({c.school_year})</option>
                ))}
              </select>
            </div>
            <div className="flex space-x-2 mt-4">
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                {formMode === 'add' ? 'Thêm' : 'Cập nhật'}
              </button>
              {formMode === 'edit' && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                    Hủy
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Bảng Danh sách */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow overflow-x-auto">
          <h3 className="text-xl font-semibold mb-4">Danh sách Người dùng</h3>
          {isLoading && <p>Đang tải...</p>}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên đăng nhập</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Họ tên</th>
                {/* (SỬA LỖI V5.11) Hoán đổi 2 cột này */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chức vụ</th> 
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vai trò (Role)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lớp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.user_id}>
                  <td className="px-4 py-4 whitespace-nowrap">{user.username}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{user.fullname}</td>
                  {/* (SỬA LỖI V5.11) Hoán đổi 2 cột này */}
                  <td className="px-4 py-4 whitespace-nowrap">{user.chuc_vu}</td> 
                  <td className="px-4 py-4 whitespace-nowrap">{user.role}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{classes.find(c => c.class_id === user.class_id)?.class_name || 'N/A'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onClick={() => handleEditClick(user)} className="text-indigo-600 hover:text-indigo-900">Sửa</button>
                    <button onClick={() => handleDelete(user.user_id)} className="text-red-600 hover:text-red-900">Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: ClassManagementPage (Admin) ---
// (SỬA V5.7) Nhận 'classes' và 'loadClasses' từ App (Hook)
const ClassManagementPage = ({ token, onNavigate, classes, loadClasses }) => {
  const [isLoading, setIsLoading] = useState(false); 
  const [error, setError] = useState(null);

  // Form state
  const [className, setClassName] = useState('');
  const [gradeLevel, setGradeLevel] = useState(10);
  const [schoolYear, setSchoolYear] = useState(dayjs().format('YYYY') + '-' + (dayjs().year() + 1)); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
        await fetchData('/api/admin/classes', 'POST', { 
            class_name: className, 
            grade_level: gradeLevel,
            school_year: schoolYear 
        }, token);
        setClassName('');
        setGradeLevel(10);
        setError(null); // Xóa lỗi cũ
        loadClasses(); // (SỬA V5.7) Gọi hàm refresh từ App
    } catch (err) {
        setError(err.message); // Hiển thị lỗi (ví dụ: Trùng lặp)
    } finally {
        setIsLoading(false);
    }
  };

  const handleDelete = async (classId) => {
    if (window.confirm('Bạn có chắc muốn xóa lớp này? (Tất cả TKB và Lỗi liên quan sẽ bị xóa!)')) {
        try {
            await fetchData(`/api/admin/classes/${classId}`, 'DELETE', null, token);
            loadClasses(); // (SỬA V5.7) Gọi hàm refresh từ App
        } catch (err) {
            setError(err.message);
        }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">
          Quản lý Lớp học
        </h2>
        <a
          href="#"
          onClick={() => onNavigate('admin_users')}
          className="text-indigo-600 hover:text-indigo-800 font-medium">
          &larr; Quay lại Quản trị Người dùng
        </a>
      </div>
      
      {error && <p className="text-red-600 bg-red-100 p-3 rounded-md mb-4">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Thêm */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Thêm Lớp Mới</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label>Tên Lớp (VD: 10A1)</label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm" required/>
            </div>
            <div>
              <label>Năm học (VD: 2024-2025)</label>
              <input
                type="text"
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm" required/>
            </div>
            <div>
              <label>Khối</label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(Number(e.target.value))}
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm" required>
                <option value={10}>Khối 10</option>
                <option value={11}>Khối 11</option>
                <option value={12}>Khối 12</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
                {isLoading ? 'Đang xử lý...' : 'Thêm Lớp'}
            </button>
          </form>
        </div>

        {/* Bảng Danh sách Lớp học */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow overflow-x-auto">
          <h3 className="text-xl font-semibold mb-4">Danh sách Lớp học</h3>
          {/* (SỬA V5.7) Bỏ isLoading (đã chuyển ra App) */}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên Lớp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khối</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Năm học</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {classes.map(c => (
                <tr key={c.class_id}>
                  <td className="px-4 py-4 whitespace-nowrap">{c.class_name}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{c.grade_level}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{c.school_year}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => handleDelete(c.class_id)} className="text-red-600 hover:text-red-900">Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


// --- COMPONENT: ScheduleManagementPage (Đoàn Trường) ---
// (SỬA V5.7) Nhận 'classes' từ App (Hook)
const ScheduleManagementPage = ({ token, classes }) => {
  const [users, setUsers] = useState([]); // Danh sách giáo viên
  const [schedules, setSchedules] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [currentSchoolYear, setCurrentSchoolYear] = useState(dayjs().format('YYYY') + '-' + (dayjs().year() + 1));
  const [semester, setSemester] = useState(1);
  const [filteredClasses, setFilteredClasses] = useState([]);

  // State cho form
  const [dayOfWeek, setDayOfWeek] = useState(2); // Thứ Hai
  const [periodNumber, setPeriodNumber] = useState(1);
  const [subjectName, setSubjectName] = useState('');
  const [teacherId, setTeacherId] = useState('');

  // Tải Users (Teachers)
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const userData = await fetchData('/api/admin/users', 'GET', null, token); // Lấy tất cả user
      setUsers(userData.users.filter(u => u.role === 'giao_vien' || u.role === 'ban_giam_hieu' || u.role === 'admin') || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // (SỬA V5.7) Lọc lại lớp học khi Năm học hoặc danh sách lớp thay đổi
  useEffect(() => {
    const filtered = classes.filter(c => c.school_year === currentSchoolYear);
    setFilteredClasses(filtered);
    if (filtered.length > 0 && !filtered.find(c => c.class_id === selectedClass)) {
      setSelectedClass(filtered[0].class_id);
    } else if (filtered.length === 0) {
      setSelectedClass('');
    }
  }, [classes, currentSchoolYear, selectedClass]);


  const loadSchedule = useCallback(async () => {
    if (!selectedClass) {
        setSchedules([]); // Xóa TKB cũ nếu không chọn lớp
        return;
    };
    try {
      const data = await fetchData(`/api/schedules/class/${selectedClass}?semester=${semester}&school_year=${currentSchoolYear}`, 'GET', null, token);
      setSchedules(data.schedules || []);
    } catch (err) {
      setError(err.message);
    }
  }, [token, selectedClass, semester, currentSchoolYear]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]); 

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teacherId) {
        setError("Vui lòng chọn giáo viên.");
        return;
    }
    try {
        await fetchData('/api/schedules', 'POST', {
            class_id: selectedClass,
            semester,
            school_year: currentSchoolYear,
            day_of_week: dayOfWeek,
            period_number: periodNumber,
            subject_name: subjectName,
            teacher_id: teacherId
        }, token);
        loadSchedule(); // Tải lại TKB
    } catch (err) {
        setError(err.message);
    }
  };

  const handleDelete = async (timetableId) => {
    try {
        await fetchData(`/api/schedules/${timetableId}`, 'DELETE', null, token);
        loadSchedule();
    } catch (err) {
        setError(err.message);
    }
  };

  const TKB_GRID = Array.from({ length: 10 }, (_, period) => // 10 tiết
    Array.from({ length: 7 }, (_, day) => { // 7 ngày (CN-T7)
      const dayOfWeekIdx = day + 1; // 1 (CN) -> 7 (T7)
      const periodNumIdx = period + 1;
      return schedules.find(s => s.day_of_week === dayOfWeekIdx && s.period_number === periodNumIdx) || null;
    })
  );
  
  const DAY_NAMES = ["", "CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
          Quản lý Thời Khóa Biểu
      </h2>
      
      {error && <p className="text-red-600 bg-red-100 p-3 rounded-md mb-4">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Thêm TKB */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow h-fit">
          <h3 className="text-xl font-semibold mb-4">Thêm Tiết học</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Năm học</label>
                <input type="text" value={currentSchoolYear} onChange={(e) => setCurrentSchoolYear(e.target.value)} className="mt-1 w-full rounded-md border-gray-300 shadow-sm"/>
              </div>
              <div>
                <label>Học kỳ</label>
                <select value={semester} onChange={(e) => setSemester(Number(e.target.value))} className="mt-1 w-full rounded-md border-gray-300 shadow-sm">
                  <option value={1}>Học Kỳ 1</option>
                  <option value={2}>Học Kỳ 2</option>
                </select>
              </div>
            </div>
            <div>
              <label>Lớp (theo năm học trên)</label>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="mt-1 w-full rounded-md border-gray-300 shadow-sm">
                {filteredClasses.length > 0 ? 
                    filteredClasses.map(c => <option key={c.class_id} value={c.class_id}>{c.class_name}</option>) :
                    <option>Không có lớp cho năm học này</option>
                }
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Thứ</label>
                <select value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))} className="mt-1 w-full rounded-md border-gray-300 shadow-sm">
                  {DAY_NAMES.map((name, index) => index > 1 ? <option key={index} value={index}>{name}</option> : null)}
                </select>
              </div>
              <div>
                <label>Tiết</label>
                <select value={periodNumber} onChange={(e) => setPeriodNumber(Number(e.target.value))} className="mt-1 w-full rounded-md border-gray-300 shadow-sm">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(p => <option key={p} value={p}>Tiết {p}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label>Môn học</label>
              <input type="text" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} className="mt-1 w-full rounded-md border-gray-300 shadow-sm" required/>
            </div>
            <div>
              <label>Giáo viên</label>
              <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="mt-1 w-full rounded-md border-gray-300 shadow-sm" required>
                <option value="">Chọn giáo viên</option>
                {users.map(u => <option key={u.user_id} value={u.user_id}>{u.fullname}</option>)}
              </select>
            </div>
            <button type="submit" className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                Lưu Tiết học
            </button>
          </form>
        </div>

        {/* Bảng TKB */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow overflow-x-auto">
          <h3 className="text-xl font-semibold mb-4">TKB Lớp: {classes.find(c => c.class_id === parseInt(selectedClass))?.class_name}</h3>
          {isLoading && <p>Đang tải...</p>}
          <table className="min-w-full border-collapse border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-300 px-2 py-2">Tiết</th>
                {DAY_NAMES.map((name, index) => index > 1 ? <th key={index} className="border border-gray-300 px-2 py-2">{name}</th> : null)}
              </tr>
            </thead>
            <tbody className="text-center">
              {TKB_GRID.map((row, periodIdx) => (
                <tr key={periodIdx}>
                  <td className="border border-gray-300 px-2 py-2 font-bold">Tiết {periodIdx + 1}</td>
                  {row.slice(2).map((cell, dayIdx) => ( // Bỏ qua CN (0), T2 (1) -> slice(2)
                    <td key={dayIdx} className="border border-gray-300 px-2 py-2 h-20 relative">
                      {cell && (
                        <div className="text-sm">
                          <p className="font-bold">{cell.subject_name}</p>
                          <p className="text-xs">{users.find(u => u.user_id === cell.teacher_id)?.fullname}</p>
                          <button
                            onClick={() => handleDelete(cell.timetable_id)}
                            className="absolute top-1 right-1 text-red-500 hover:text-red-700 text-xs opacity-50 hover:opacity-100">
                            (Xóa)
                          </button>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


// --- COMPONENT: LogbookPage (Sổ Đầu Bài - Giáo viên, BGH) ---
const LogbookPage = ({ token, user, allRules }) => {
  const [mySchedule, setMySchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(getWeekNumber(new Date()));
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);

  // State cho Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [lessonContent, setLessonContent] = useState('');
  const [notes, setNotes] = useState('');
  const [attendance, setAttendance] = useState('');
  const [selectedRuleIds, setSelectedRuleIds] = useState(new Set()); 

  const inClassRules = useMemo(() => {
    return allRules.filter(r => r.is_in_class_violation === 0);
  }, [allRules]);

  // Tải Lịch dạy (Logbook)
  const loadMyLogbook = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchData(`/api/logbook/my-schedule?week_number=${selectedWeek}`, 'GET', null, token);
      setMySchedule(data.schedule || []);
    } catch (err) { 
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token, selectedWeek]);

  useEffect(() => {
    loadMyLogbook();
  }, [loadMyLogbook]);

  const openModal = (entry) => {
    setSelectedEntry(entry);
    setLessonContent(entry.lesson_content || '');
    setNotes(entry.notes || '');
    setAttendance(entry.attendance || '');
    setSelectedRuleIds(new Set(entry.violations.map(v => v.rule_id)));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEntry(null);
  };

  const handleCheckboxChange = (ruleId) => {
      setSelectedRuleIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(ruleId)) {
              newSet.delete(ruleId);
          } else {
              newSet.add(ruleId);
          }
          return newSet;
      });
  };

  const handleSubmitLog = async (e) => {
    e.preventDefault();
    const logData = {
      timetable_id: selectedEntry.timetable_id,
      week_number: selectedWeek,
      lesson_content,
      notes,
      attendance,
      selectedRuleIds: Array.from(selectedRuleIds), 
    };
    try {
        await fetchData('/api/logbook/sign', 'POST', logData, token);
        closeModal();
        loadMyLogbook(); // Tải lại
    } catch (err) {
        setError(err.message);
    }
  };

  const weekOptions = Array.from({ length: 52 }, (_, i) => i + 1);

  const scheduleByDay = useMemo(() => {
    return mySchedule.reduce((acc, entry) => {
      const day = entry.day_of_week;
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(entry);
      return acc;
    }, {});
  }, [mySchedule]);

  const DAY_NAMES = ["", "Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">
          Sổ Đầu Bài (Lịch dạy của tôi)
        </h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-600">
            Chọn tuần:
          </span>
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(Number(e.target.value))}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            {weekOptions.map(week => (
              <option key={week} value={week}>Tuần {week}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && <p>Đang tải...</p>}
      {error && <p className="text-red-600 bg-red-100 p-3 rounded-md mb-4">{error}</p>}

      {!isLoading && !error && (
        <div className="space-y-6">
          {Object.keys(scheduleByDay).sort((a, b) => a - b).map(dayIndex => (
            <div key={dayIndex}>
              <h3 className="text-xl font-semibold mb-2 text-indigo-700">
                {DAY_NAMES[dayIndex]}
              </h3>
              <div className="overflow-x-auto rounded-lg shadow bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiết</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lớp</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Môn học</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {scheduleByDay[dayIndex].sort((a, b) => a.period_number - b.period_number).map(entry => (
                      <tr key={entry.timetable_id}>
                        <td className="px-4 py-4">Tiết {entry.period_number}</td>
                        <td className="px-4 py-4">{entry.class_name}</td>
                        <td className="px-4 py-4">{entry.subject_name}</td>
                        <td className="px-4 py-4">
                          {entry.is_signed ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Đã ký (GV: {entry.signer_fullname})
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Chưa ký
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => openModal(entry)}
                            // (SỬA V5.7) Sửa logic kiểm tra: grader_id
                            disabled={entry.is_signed && entry.grader_id !== user.user_id && user.role !== 'ban_giam_hieu' && user.role !== 'admin'}
                            className="py-2 px-4 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
                            {entry.is_signed ? 'Xem/Sửa' : 'Ký sổ & Đánh giá'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {Object.keys(scheduleByDay).length === 0 && (
            <p className="text-center text-gray-500 mt-10">
                Không có lịch dạy trong tuần này.
            </p>
          )}
        </div>
      )}

      {/* Modal Ký Sổ (SỬA V5.1 - Dùng Checkbox) */}
      {isModalOpen && selectedEntry && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
                Đánh giá Tiết học (Tuần {selectedWeek})
            </h3>
            <p className="mb-4">
                Lớp <strong>{selectedEntry.class_name}</strong> - Tiết <strong>{selectedEntry.period_number}</strong> - Môn <strong>{selectedEntry.subject_name}</strong>
            </p>
            <form onSubmit={handleSubmitLog} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Sĩ số / Vắng</label>
                <input
                  type="text"
                  value={attendance}
                  onChange={(e) => setAttendance(e.target.value)}
                  placeholder="VD: 30/30 (Vắng: A, B)"
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm"/>
              </div>
              <div>
                <label className="block text-sm font-medium">Nội dung bài dạy</label>
                <textarea
                  rows="3"
                  value={lessonContent}
                  onChange={(e) => setLessonContent(e.target.value)}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm">
                </textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium">Xếp loại / Vi phạm trong giờ (Loại 0)</label>
                <div className="mt-2 p-3 border rounded-md max-h-48 overflow-y-auto bg-gray-50 space-y-2">
                    {inClassRules.length > 0 ? inClassRules.map(rule => (
                        <label key={rule.violation_type_id} className="flex items-center">
                            <input 
                                type="checkbox"
                                checked={selectedRuleIds.has(rule.violation_type_id)}
                                onChange={() => handleCheckboxChange(rule.violation_type_id)}
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                                {rule.description} ({rule.points_deducted} điểm)
                            </span>
                        </label>
                    )) : <p className="text-sm text-gray-500">Không tìm thấy quy tắc (Loại 0) trong CSDL.</p>}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium">Ghi chú thêm</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm">
                </textarea>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                    Hủy
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    Xác nhận Ký sổ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENT: ViolationForm (Cờ Đỏ) ---
// (SỬA V5.4) Hoàn tác: Dùng 1 Dropdown Lớp (hiển thị cả năm học)
const ViolationForm = ({ token, user, allRules, classes }) => {
  // const [classes, setClasses] = useState([]); // (SỬA V5.7) Xóa
  const [isLoading, setIsLoading] = useState(false); // (SỬA V5.7) Xóa
  const [error, setError] = useState(null);

  // (MỚI V5.1) Lọc quy tắc Cờ Đỏ (Loại 1 và 2)
  const violationRules = useMemo(() => {
    return allRules.filter(r => r.is_in_class_violation === 1 || r.is_in_class_violation === 2);
  }, [allRules]);

  // Form state
  const [classId, setClassId] = useState(classes.length > 0 ? classes[0].class_id : ''); // (SỬA V5.7) Set mặc định
  const [violationRuleId, setViolationRuleId] = useState(''); // (SỬA V5.1) Dùng ID
  const [description, setDescription] = useState('');
  const [violationDate, setViolationDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [weekNumber, setWeekNumber] = useState(getWeekNumber(new Date()));

  // (SỬA V5.7) Xóa loadClassesData (đã chuyển ra App)

  // (MỚI V5.1) Set ID mặc định khi quy tắc được tải
  useEffect(() => {
      if (violationRules.length > 0 && !violationRuleId) {
          setViolationRuleId(violationRules[0].violation_type_id);
      }
  }, [violationRules, violationRuleId]);
  
  // (MỚI V5.7) Set classId mặc định khi classes tải xong
  useEffect(() => {
      if (classes.length > 0 && !classId) {
          setClassId(classes[0].class_id);
      }
  }, [classes, classId]);

  const handleDateChange = (date) => {
    setViolationDate(date);
    setWeekNumber(getWeekNumber(date));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // (MỚI V5.7) Xóa lỗi cũ
    if (!violationRuleId) {
        setError("Vui lòng chọn một loại lỗi vi phạm.");
        return;
    }
    if (!classId) {
        setError("Vui lòng chọn lớp.");
        return;
    }
    const reportData = {
      class_id: classId,
      violation_type_id: violationRuleId, // (SỬA V5.1) Gửi ID
      description,
      violation_date: violationDate,
      week_number: weekNumber,
    };
    try {
        await fetchData('/api/violations/report', 'POST', reportData, token);
        alert('Đã gửi báo cáo thành công!');
        // Reset form
        setDescription('');
    } catch (err) {
        setError(err.message);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-lg shadow mt-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
          Gửi Báo Cáo Vi Phạm (Cờ Đỏ/Thưởng)
      </h2>
      {isLoading && <p>Đang tải...</p>}
      {error && <p className="text-red-600 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* (SỬA V5.4) Hoàn tác Dropdown Lớp */}
        <div>
          <label className="block text-sm font-medium">Lớp vi phạm</label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="mt-1 w-full rounded-md border-gray-300 shadow-sm"
            disabled={isLoading || classes.length === 0}>
            {classes.length > 0 ?
                classes.map(c => <option key={c.class_id} value={c.class_id}>{c.class_name} ({c.school_year})</option>) :
                <option value="">Đang tải lớp...</option>
            }
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium">Ngày vi phạm</label>
          <input
            type="date"
            value={violationDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="mt-1 w-full rounded-md border-gray-300 shadow-sm"/>
        </div>
        <p className="text-sm text-gray-500">Tuần {weekNumber}</p>
        
        {/* (SỬA V5.1) Dropdown động */}
        <div>
          <label className="block text-sm font-medium">Loại vi phạm (Lỗi Ngoài giờ & Thưởng)</label>
          <select
            value={violationRuleId}
            onChange={(e) => setViolationRuleId(e.target.value)}
            className="mt-1 w-full rounded-md border-gray-300 shadow-sm">
            {violationRules.length > 0 ? violationRules.map(rule => (
                <option key={rule.violation_type_id} value={rule.violation_type_id}>
                    {rule.description} ({rule.points_deducted} điểm)
                </option>
            )) : <option>Đang tải quy tắc...</option>}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium">Mô tả chi tiết (Tên HS, địa điểm...)</label>
          <textarea
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="VD: Em A, Em B đi trễ 5 phút..."
            className="mt-1 w-full rounded-md border-gray-300 shadow-sm">
          </textarea>
        </div>
        <button type="submit" className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
          Gửi Báo Cáo
        </button>
      </form>
    </div>
  );
};

// --- COMPONENT: ViolationConfirmationPage (Bí thư) ---
// (SỬA V5.1) Hiển thị tên lỗi động
const ViolationConfirmationPage = ({ token, user }) => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMyClassReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchData('/api/violations/my-class', 'GET', null, token);
      setReports(data.reports || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadMyClassReports();
  }, [loadMyClassReports]);

  const handleAction = async (reportId, action) => {
    const feedback = action === 'deny' ? prompt('Lý do từ chối (bắt buộc):') : null;
    if (action === 'deny' && !feedback) {
      return; // Hủy nếu không nhập lý do
    }
    try {
        await fetchData(`/api/violations/${reportId}/confirm`, 'POST', { action, feedback }, token);
        loadMyClassReports();
    } catch (err) {
        setError(err.message);
    }
  };

  if (!user.class_id) {
    return <p className="p-6 text-red-600">Tài khoản của bạn chưa được gán vào lớp nào. Vui lòng liên hệ Admin.</p>
  }

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
          Xác nhận Vi phạm Lớp
      </h2>
      {isLoading && <p>Đang tải...</p>}
      {error && <p className="text-red-600 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
      
      <div className="space-y-4">
        {reports.length > 0 ? (
          reports.map(report => (
            <div key={report.report_id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">
                  {dayjs(report.report_date).format('DD/MM/YYYY')} (Tuần {report.week_number}) - CĐ: {report.reporter_name}
                </p>
                <p className="text-lg font-semibold">
                    {report.rule_description} 
                    <span className="text-base font-normal text-red-600"> ({report.rule_points} điểm)</span>
                </p>
                <p className="text-gray-700">{report.description_details}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleAction(report.report_id, 'confirm')}
                  className="py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm">
                  Đúng
                </button>
                <button
                  onClick={() => handleAction(report.report_id, 'deny')}
                  className="py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm">
                  Sai
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">Lớp bạn không có báo cáo vi phạm nào cần xác nhận.</p>
        )}
      </div>
    </div>
  );
};

// --- COMPONENT: ViolationApprovalPage (Đoàn trường) ---
// (SỬA V5.1) Hiển thị tên lỗi động
const ViolationApprovalPage = ({ token }) => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('pending_approval'); // 'pending_approval' or 'denied_by_monitor'

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = filter === 'pending_approval' ? '/api/violations/pending-approval' : '/api/violations/denied-by-monitor';
      const data = await fetchData(url, 'GET', null, token);
      setReports(data.reports || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token, filter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleApproval = async (reportId, action) => {
    try {
        await fetchData(`/api/violations/${reportId}/approve`, 'POST', { action }, token);
        loadReports();
    } catch (err) {
        setError(err.message);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
          Duyệt Lỗi Vi Phạm
      </h2>
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setFilter('pending_approval')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              filter === 'pending_approval' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}>
            Chờ duyệt (Đã xác nhận)
          </button>
          <button
            onClick={() => setFilter('denied_by_monitor')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              filter === 'denied_by_monitor' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}>
            Bí thư Từ chối (Cần xem xét)
          </button>
        </nav>
      </div>

      {isLoading && <p>Đang tải...</p>}
      {error && <p className="text-red-600 bg-red-100 p-3 rounded-md mb-4">{error}</p>}

      <div className="space-y-4">
        {reports.length > 0 ? (
          reports.map(report => (
            <div key={report.report_id} className="bg-white p-4 rounded-lg shadow flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">
                  {dayjs(report.report_date).format('DD/MM/YYYY')} (Tuần {report.week_number}) - Lớp <strong>{report.class_name}</strong>
                </p>
                <p className="text-lg font-semibold">
                    {report.rule_description} 
                    <span className="text-base font-normal text-red-600"> ({report.rule_points} điểm)</span>
                </p>
                <p className="text-gray-700 mb-2">CĐ báo cáo: {report.description_details}</p>
                {report.secretary_response && (
                  <p className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded">
                    Phản hồi Bí thư: {report.secretary_response}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 flex-shrink-0 mt-2 sm:mt-0">
                <button
                  onClick={() => handleApproval(report.report_id, 'approve')}
                  className="py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm">
                  Duyệt (Trừ/Cộng điểm)
                </button>
                <button
                  onClick={() => handleApproval(report.report_id, 'reject')}
                  className="py-2 px-4 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm">
                  Hủy lỗi
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">Không có báo cáo nào trong mục này.</p>
        )}
      </div>
    </div>
  );
};


// --- COMPONENT: RankingCalculationPage (Admin/BGH) ---
const RankingCalculationPage = ({ token }) => {
  const [weekNumber, setWeekNumber] = useState(getWeekNumber(new Date()));
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type, text }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    try {
      const data = await fetchData('/api/calculate-ranking', 'POST', { week_number: weekNumber }, token);
      setMessage({ type: 'success', text: data.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-lg shadow mt-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
          Tính Toán Xếp Hạng Tuần
      </h2>
      
      {message && (
        <p className={`p-3 rounded-md mb-4 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Chọn Tuần để Tính toán</label>
          <input
            type="number"
            min="1"
            max="53"
            value={weekNumber}
            onChange={(e) => setWeekNumber(Number(e.target.value))}
            className="mt-1 w-full rounded-md border-gray-300 shadow-sm"/>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
          {isLoading ? 'Đang tính toán...' : 'Bắt đầu Tính Toán & Chốt Điểm'}
        </button>
      </form>
      <p className="text-sm text-gray-500 mt-4">
          Lưu ý: Hành động này sẽ tính toán lại toàn bộ điểm SĐB và Vi phạm (đã duyệt) của tuần đã chọn, sau đó lưu kết quả vào Bảng Xếp Hạng.
      </p>
    </div>
  );
};


// --- COMPONENT CHÍNH: App ---
export default function App() {
  // 1. State Xác thực (Auth)
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try {
        return JSON.parse(localStorage.getItem('appUser'));
    } catch {
        return null;
    }
  });
  
  // 2. State Điều hướng (Navigation)
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // 3. (MỚI V5.1) State Chung cho Quy tắc
  const { allRules, inClassRules, outOfClassRules, bonusRules, rulesError, isLoadingRules } = useRules(token);
  // (MỚI V5.7) State Chung cho Lớp học
  const { classes, classesError, isLoadingClasses, refreshClasses } = useClasses(token);

  // 4. Xử lý Đăng nhập / Đăng xuất
  const handleLoginSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('appUser', JSON.stringify(newUser)); 
    setCurrentPage('dashboard'); 
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('appUser');
    setCurrentPage('login'); 
  };

  // 5. Bộ định tuyến (Router)
  const renderPage = () => {
    // Nếu chưa đăng nhập, chỉ cho phép xem trang Login
    if (!token || !user) {
      return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }
    
    // Nếu đang tải quy tắc (lần đầu), hiển thị loading
    if (isLoadingRules || isLoadingClasses) {
        return <div className="p-6">Đang tải dữ liệu cốt lõi (Quy tắc, Lớp học)...</div>
    }
    
    // Nếu lỗi tải quy tắc
    if (rulesError || classesError) {
        return <div className="p-6 text-red-600">Lỗi nghiêm trọng: Không thể tải Quy tắc hoặc Lớp học. {rulesError || classesError}</div>
    }

    // Đã đăng nhập
    switch (currentPage) {
      // Chung
      case 'dashboard':
        return <RankingDashboard token={token} />;
      
      // Admin
      case 'admin_users':
        return <UserManagementPage token={token} onNavigate={setCurrentPage} classes={classes} />;
      case 'admin_classes':
        // (SỬA V5.7) Truyền 'classes' và 'refreshClasses' từ Hook
        return <ClassManagementPage token={token} onNavigate={setCurrentPage} classes={classes} loadClasses={refreshClasses} />;
      case 'admin_calculate_ranking':
        return <RankingCalculationPage token={token} />;
        
      // Đoàn Trường
      case 'schedule_management':
        return <ScheduleManagementPage token={token} classes={classes} />;
      case 'violation_approval':
        return <ViolationApprovalPage token={token} />;
        
      // Giáo viên / BGH
      case 'logbook':
        return <LogbookPage token={token} user={user} allRules={allRules} />;
        
      // Cờ Đỏ
      case 'violation_form':
        return <ViolationForm token={token} user={user} allRules={allRules} classes={classes} />; 
        
      // Bí thư
      case 'violation_confirmation':
        return <ViolationConfirmationPage token={token} user={user} />;
        
      // Trang không tồn tại
      default:
        return <RankingDashboard token={token} />;
    }
  };

  // Nếu chưa đăng nhập, chỉ hiển thị trang Login
  if (!token || !user) {
      return (
          <div className="min-h-screen bg-gray-100">
              <Header user={null} onLogout={handleLogout} onNavigate={setCurrentPage} />
              <LoginPage onLoginSuccess={handleLoginSuccess} />
          </div>
      );
  }

  // Giao diện khi đã đăng nhập
  return (
    <div className="flex min-h-screen">
      {/* Sidebar (Bên trái) */}
      <div className="w-64 bg-white shadow-lg p-4 h-screen sticky top-0">
        <Sidebar
          userRole={user.role}
          onNavigate={setCurrentPage}
          currentPage={currentPage}
        />
      </div>

      {/* Nội dung chính (Bên phải) */}
      <div className="flex-1 bg-gray-100">
        <Header user={user} onLogout={handleLogout} onNavigate={setCurrentPage} />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}