// --- Frontend React: Hệ thống Thi đua THPT (Nâng cấp) ---
import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, BookOpen, Flag, CheckSquare, BarChart2, 
  Calendar, UserCheck, XCircle, LogIn, LogOut, Home, Edit3, Settings,
  Loader2, AlertCircle, PlusCircle, Trash2, Save, X, RefreshCw, Layers, Clock, Check // Thêm icon mới
} from 'lucide-react';

// --- Cấu hình API ---
const API_BASE_URL = 'http://localhost:3001/api';

// --- Danh sách vai trò để dùng cho form ---
const ROLES = [
  { value: 'admin', label: 'Admin (Quản trị hệ thống)' },
  { value: 'ban_giam_hieu', label: 'Ban Giám Hiệu' },
  { value: 'doan_truong', label: 'Đoàn Trường' },
  { value: 'co_do', label: 'Cờ Đỏ' },
  { value: 'bi_thu', label: 'Bí Thư Chi Đoàn' },
  { value: 'giao_vien', label: 'Giáo Viên' },
];

// --- Component Chính: App ---
export default function App() {
  // Lấy token và user từ localStorage khi app khởi động (giữ phiên)
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('appUser');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  }); 
  const [token, setToken] = useState(() => localStorage.getItem('authToken')); 
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [rankings, setRankings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState(null);
  const [rankingError, setRankingError] = useState(null);

  // --- Đồng bộ hóa trạng thái với localStorage ---
  useEffect(() => {
    if (user && token) {
      localStorage.setItem('appUser', JSON.stringify(user));
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('appUser');
      localStorage.removeItem('authToken');
    }
  }, [user, token]);

  // --- Lấy Bảng Xếp Hạng (Public) ---
  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setIsLoading(true);
        setRankingError(null);
        const response = await fetch(`${API_BASE_URL}/rankings`);
        
        if (!response.ok) {
          throw new Error(`Lỗi HTTP status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setRankings(data.rankings);
        } else {
          setRankingError(data.message || 'Không thể tải bảng xếp hạng.');
        }
      } catch (err) {
        setRankingError('Không thể kết nối tới máy chủ backend. Hãy đảm bảo backend đang chạy!');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRankings();
  }, []);

  // --- Hàm Đăng nhập (Gọi API) ---
  const handleLogin = async (username, password) => {
    setIsLoading(true);
    setLoginError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setToken(data.token);
        setCurrentPage('dashboard');
      } else {
        setLoginError(data.message || 'Đăng nhập thất bại.');
      }
    } catch (err) {
      setLoginError('Lỗi kết nối. Không thể đăng nhập.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Hàm Đăng xuất ---
  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setCurrentPage('dashboard');
    setLoginError(null);
  };

  // --- Hiển thị Lỗi (Error) và Thông báo (Success) ---
  const DisplayMessage = ({ message, type, onClose }) => {
    const isError = type === 'error';
    const bgColor = isError ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700';
    const Icon = isError ? AlertCircle : CheckSquare;
    const title = isError ? 'Đã xảy ra lỗi:' : 'Thành công:';

    return (
      <div className={`my-4 p-4 border rounded-lg flex items-center gap-2 ${bgColor}`}>
        <Icon size={20} />
        <div>
          <span className="font-semibold">{title}</span> {message}
        </div>
        <button onClick={onClose} className="ml-auto font-bold">&times;</button>
      </div>
    );
  };


  // --- Giao diện (Render) ---
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 font-inter">
        <Header user={null} onLogout={handleLogout} />
        {rankingError && <DisplayMessage message={rankingError} type="error" onClose={() => setRankingError(null)} />}
        
        {isLoading && rankings.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-blue-500" size={48} />
          </div>
        ) : (
          <PublicDashboard rankings={rankings} />
        )}
        
        <LoginPage onLogin={handleLogin} isLoading={isLoading} loginError={loginError} setLoginError={setLoginError} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 font-inter">
      <Sidebar user={user} currentPage={currentPage} setCurrentPage={setCurrentPage} />

      <div className="flex-1 p-8">
        <Header user={user} onLogout={handleLogout} />
        <MainContent 
          user={user} 
          token={token}
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage}
          rankings={rankings} 
        />
      </div>
    </div>
  );
}

// --- Component Header ---
function Header({ user, onLogout }) {
  return (
    <header className="flex justify-between items-center pb-6 border-b border-gray-200 mb-6">
      <h1 className="text-3xl font-bold text-gray-800">Hệ thống Thi đua THPT</h1>
      {user && (
        <div className="flex items-center gap-4">
          <span className="text-gray-700 text-sm">
            Đăng nhập với: <strong className="font-semibold">{user.fullname}</strong> ({user.role})
          </span>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      )}
    </header>
  );
}

// --- Component Trang Đăng nhập ---
function LoginPage({ onLogin, isLoading, loginError, setLoginError }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // Sử dụng component DisplayMessage để hiển thị lỗi
  const DisplayMessage = ({ message, type, onClose }) => {
    const isError = type === 'error';
    const bgColor = isError ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700';
    const Icon = isError ? AlertCircle : CheckSquare;
    const title = isError ? 'Đã xảy ra lỗi:' : 'Thành công:';

    return (
      <div className={`my-4 p-4 border rounded-lg flex items-center gap-2 ${bgColor}`}>
        <Icon size={20} />
        <div>
          <span className="font-semibold">{title}</span> {message}
        </div>
        <button onClick={onClose} className="ml-auto font-bold">&times;</button>
      </div>
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setLoginError('Vui lòng nhập tên đăng nhập và mật khẩu.');
      return;
    }
    onLogin(username, password);
  };

  return (
    <div className="mt-10 bg-white p-8 rounded-xl shadow-2xl max-w-md mx-auto border border-gray-200">
      <h2 className="text-3xl font-bold mb-6 text-center text-blue-700">Đăng nhập Hệ thống</h2>
      {loginError && <DisplayMessage message={loginError} type="error" onClose={() => setLoginError(null)} />}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="username">Tên đăng nhập</label>
          <div className="relative">
            <UserCheck size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="ví dụ: admin"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Mật khẩu</label>
          <div className="relative">
            <Shield size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="••••••••"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg shadow-lg font-semibold hover:bg-blue-700 transition duration-200 disabled:bg-gray-400"
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
          {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
        </button>
      </form>
      <p className="text-center text-xs text-gray-500 mt-6">
        Lưu ý: Bạn phải tạo tài khoản admin đầu tiên bằng Postman qua API /api/register.
      </p>
    </div>
  );
}


// --- Component Sidebar ---
function Sidebar({ user, currentPage, setCurrentPage }) {
  const { role } = user;

  const allLinks = [
    { name: 'Dashboard (BXH)', icon: BarChart2, page: 'dashboard', roles: ['public', 'admin', 'ban_giam_hieu', 'doan_truong', 'co_do', 'bi_thu', 'giao_vien'] },
    { name: 'Sổ Đầu Bài', icon: BookOpen, page: 'logbook', roles: ['giao_vien', 'ban_giam_hieu'] },
    { name: 'Gửi Báo cáo (Cờ đỏ)', icon: Flag, page: 'report_violation', roles: ['co_do'] },
    { name: 'Xác nhận VP (Bí thư)', icon: CheckSquare, page: 'approve_violation', roles: ['bi_thu'] },
    { name: 'Quản lý VP (Đoàn trường)', icon: Edit3, page: 'manage_violation', roles: ['doan_truong'] },
    { name: 'Quản lý Thời Khóa Biểu', icon: Calendar, page: 'manage_schedule', roles: ['doan_truong'] }, // Đổi tên từ 'schedule' thành 'manage_schedule'
    { name: 'Thời Khóa Biểu Lớp/GV', icon: Clock, page: 'view_schedule', roles: ['giao_vien', 'bi_thu', 'ban_giam_hieu'] }, 
    { name: 'Quản lý Giáo viên', icon: UserCheck, page: 'manage_teachers', roles: ['ban_giam_hieu'] },
    { name: 'Quản trị Người dùng', icon: Settings, page: 'admin', roles: ['admin'] },
  ];

  const adminLinks = [
    { name: 'Quản lý Người dùng', icon: Settings, page: 'admin', roles: ['admin'] },
    { name: 'Quản lý Lớp học', icon: Layers, page: 'manage_classes', roles: ['admin'] },
  ];

  const getFilteredLinks = () => {
    let links = allLinks.filter(link => 
      link.roles.includes(role)
    );
    
    // Nếu là admin, hiển thị link quản trị chi tiết
    if (role === 'admin') {
      links = [...links.filter(link => link.page !== 'admin'), ...adminLinks];
    }
    
    return links;
  };
  
  const filteredLinks = getFilteredLinks();

  return (
    <div className="w-64 bg-white p-6 shadow-xl h-screen sticky top-0 border-r border-gray-200">
      <h2 className="text-xl font-bold text-blue-800 mb-8">Xin chào, {user.fullname.split(' ')[0]}!</h2>
      <nav className="space-y-2">
        {filteredLinks.map(link => {
          const Icon = link.icon;
          const isActive = currentPage === link.page;
          return (
            <button
              key={link.page}
              onClick={() => setCurrentPage(link.page)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-md'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <Icon size={20} />
              {link.name}
            </button>
          );
        })}
      </nav>
      {user.role === 'admin' && (
        <p className="mt-8 text-sm text-gray-500 border-t pt-4">Phiên làm việc: {user.role.toUpperCase()}</p>
      )}
    </div>
  );
}

// --- Component Nội dung chính (Chuyển trang) ---
function MainContent({ user, token, currentPage, rankings }) {
  switch (currentPage) {
    case 'dashboard':
      return <PublicDashboard rankings={rankings} />;
    case 'logbook':
      return <LogbookPage user={user} token={token} />;
    case 'report_violation':
      return <CoDoReportPage user={user} token={token} />;
    case 'approve_violation':
      return <BiThuApprovePage user={user} token={token} />;
    case 'manage_violation':
      return <DoanTruongManagePage user={user} token={token} />;
    case 'manage_schedule':
      return <ScheduleManagementPage user={user} token={token} />;
    case 'view_schedule':
        return <SchedulePage user={user} token={token} />;
    case 'manage_teachers':
      return <BGHManagePage user={user} token={token} />;
    case 'admin':
      return <AdminPage user={user} token={token} />; 
    case 'manage_classes':
      return <ClassManagementPage user={user} token={token} />; // Trang quản lý lớp học mới
    default:
      return <PublicDashboard rankings={rankings} />;
  }
}

// --- Component hiển thị thông báo ---
const DisplayMessage = ({ message, type, onClose }) => {
  const isError = type === 'error';
  const bgColor = isError ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700';
  const Icon = isError ? AlertCircle : CheckSquare;
  const title = isError ? 'Lỗi:' : 'Thành công:';

  return (
    <div className={`my-4 p-4 border rounded-lg flex items-center gap-2 ${bgColor}`}>
      <Icon size={20} />
      <div>
        <span className="font-semibold">{title}</span> {message}
      </div>
      <button onClick={onClose} className="ml-auto font-bold">&times;</button>
    </div>
  );
};


// --- TRANG: ADMIN - QUẢN TRỊ NGƯỜI DÙNG (Giữ nguyên) ---
function AdminPage({ user, token }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null); // null = thêm mới

    // --- Hàm Tải danh sách người dùng ---
    const fetchUsers = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setUsers(data.users);
            } else {
                setMessage({ type: 'error', text: data.message });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Lỗi kết nối hoặc server: Không thể tải danh sách người dùng.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchUsers();
        }
    }, [token]);

    // --- Hàm Thêm/Sửa người dùng ---
    const handleSaveUser = async (formData) => {
        setMessage(null);
        setLoading(true);
        const method = formData.user_id ? 'PUT' : 'POST';
        const url = formData.user_id 
          ? `${API_BASE_URL}/admin/users/${formData.user_id}` 
          : `${API_BASE_URL}/admin/users`;
        
        // Loại bỏ password nếu là PUT và không có giá trị
        const bodyData = { ...formData };
        if (method === 'PUT' && !bodyData.password) {
            delete bodyData.password;
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bodyData),
            });
            const data = await response.json();
            
            if (data.success) {
                setMessage({ type: 'success', text: data.message });
                setIsModalOpen(false);
                fetchUsers(); // Tải lại danh sách
            } else {
                setMessage({ type: 'error', text: data.message });
            }
        } catch (error) {
            setMessage({ type: 'error', text: `Lỗi kết nối khi ${method === 'POST' ? 'thêm' : 'cập nhật'} người dùng.` });
        } finally {
            setLoading(false);
        }
    };

    // --- Hàm Xóa người dùng ---
    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return;
        setMessage(null);
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: data.message });
                fetchUsers(); // Tải lại danh sách
            } else {
                setMessage({ type: 'error', text: data.message });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Lỗi kết nối khi xóa người dùng.' });
        } finally {
            setLoading(false);
        }
    };

    // --- Xử lý mở/đóng Modal ---
    const openAddModal = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };
    const openEditModal = (user) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold mb-4 text-blue-700 flex items-center justify-between">
                Quản trị Người dùng
                <button 
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition"
                >
                    <PlusCircle size={20} />
                    Thêm Người Dùng Mới
                </button>
            </h2>
            
            {message && <DisplayMessage type={message.type} message={message.text} onClose={() => setMessage(null)} />}

            <div className="flex justify-end mb-4">
                <button onClick={fetchUsers} disabled={loading} className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Tải lại
                </button>
            </div>

            {loading && users.length === 0 ? (
                <div className="text-center py-10">
                    <Loader2 className="animate-spin text-blue-500 mx-auto" size={32} />
                    <p className="mt-2 text-gray-600">Đang tải dữ liệu người dùng...</p>
                </div>
            ) : (
                <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-blue-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Tên Đăng Nhập</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Họ Tên</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Vai Trò (Role)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Chức Vụ</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Lớp CN/PT</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {users.map((u) => (
                                <tr key={u.user_id} className={u.role === 'admin' ? 'bg-yellow-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.user_id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{u.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{u.fullname}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">{u.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{u.chuc_vu}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">{u.class_id || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex gap-2 justify-center">
                                            <button 
                                                onClick={() => openEditModal(u)}
                                                className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            {u.role !== 'admin' && ( // Không cho phép xóa Admin
                                                <button 
                                                    onClick={() => handleDeleteUser(u.user_id)}
                                                    className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                                                    title="Xóa"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {/* Modal Thêm/Sửa Người dùng */}
            {isModalOpen && (
                <UserFormModal 
                    user={editingUser} 
                    onSave={handleSaveUser} 
                    onClose={() => setIsModalOpen(false)} 
                    isLoading={loading}
                />
            )}
        </div>
    );
}

// --- Component Modal Form Thêm/Sửa Người dùng ---
function UserFormModal({ user, onSave, onClose, isLoading }) {
    const isEditing = !!user;
    const initialFormState = {
        user_id: user?.user_id || null,
        username: user?.username || '',
        password: '',
        fullname: user?.fullname || '',
        role: user?.role || 'giao_vien',
        chuc_vu: user?.chuc_vu || 'Giáo viên bộ môn',
        class_id: user?.class_id || '',
    };
    const [formData, setFormData] = useState(initialFormState);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value === "" ? null : value, // Lưu rỗng thành null
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Kiểm tra validation cơ bản
        if (!formData.username || !formData.fullname || !formData.role || (!isEditing && !formData.password)) {
            alert("Vui lòng nhập Tên đăng nhập, Họ tên, Vai trò và Mật khẩu (khi thêm mới).");
            return;
        }
        onSave(formData);
    };

    // Danh sách lớp học giả định để Bí thư/Giáo viên chủ nhiệm chọn
    const mockClasses = ['10A1', '10A2', '11A1', '12A1', 'N/A']; 

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-bold text-blue-700">{isEditing ? 'Chỉnh Sửa Người Dùng' : 'Thêm Người Dùng Mới'}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Họ Tên</label>
                        <input type="text" name="fullname" value={formData.fullname || ''} onChange={handleChange} className="w-full p-2 border rounded-lg bg-gray-50" required />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tên Đăng Nhập</label>
                        <input type="text" name="username" value={formData.username || ''} onChange={handleChange} className="w-full p-2 border rounded-lg bg-gray-50" required disabled={isEditing} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Mật khẩu {isEditing ? '(Bỏ trống nếu không thay đổi)' : '*'}</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full p-2 border rounded-lg bg-gray-50" required={!isEditing} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Vai Trò (Role)</label>
                        <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border rounded-lg bg-gray-50" required>
                            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Chức Vụ</label>
                        <input type="text" name="chuc_vu" value={formData.chuc_vu || ''} onChange={handleChange} className="w-full p-2 border rounded-lg bg-gray-50" required />
                    </div>

                    {(formData.role === 'giao_vien' || formData.role === 'bi_thu') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Lớp Chủ nhiệm/Phụ trách (CN/PT)</label>
                            <select name="class_id" value={formData.class_id || ''} onChange={handleChange} className="w-full p-2 border rounded-lg bg-gray-50">
                                {mockClasses.map(c => <option key={c} value={c === 'N/A' ? '' : c}>{c}</option>)}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Chỉ cần thiết cho Giáo viên chủ nhiệm và Bí thư Chi đoàn.
                            </p>
                        </div>
                    )}
                    
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition">Hủy</button>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition disabled:bg-gray-400"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            {isEditing ? (isLoading ? 'Đang cập nhật...' : 'Lưu Thay Đổi') : (isLoading ? 'Đang thêm...' : 'Thêm Người Dùng')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- TRANG: ADMIN - QUẢN LÝ LỚP HỌC (MỚI) ---
function ClassManagementPage({ token }) {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null); 
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState(null);

    const fetchClasses = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/classes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setClasses(data.classes);
            } else {
                setMessage({ type: 'error', text: data.message });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Lỗi kết nối: Không thể tải danh sách lớp học.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchClasses();
        }
    }, [token]);
    
    // Thêm/Sửa Lớp học
    const handleSaveClass = async (formData) => {
        setMessage(null);
        setLoading(true);
        const method = formData.class_id ? 'PUT' : 'POST';
        const url = formData.class_id 
          ? `${API_BASE_URL}/admin/classes/${formData.class_id}` 
          : `${API_BASE_URL}/admin/classes`;

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            
            if (data.success) {
                setMessage({ type: 'success', text: data.message });
                setIsModalOpen(false);
                fetchClasses();
            } else {
                setMessage({ type: 'error', text: data.message });
            }
        } catch (error) {
            setMessage({ type: 'error', text: `Lỗi kết nối khi ${method === 'POST' ? 'thêm' : 'cập nhật'} lớp học.` });
        } finally {
            setLoading(false);
        }
    };

    // Xóa Lớp học
    const handleDeleteClass = async (classId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa lớp học này?")) return;
        setMessage(null);
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/admin/classes/${classId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: data.message });
                fetchClasses();
            } else {
                setMessage({ type: 'error', text: data.message });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Lỗi kết nối khi xóa lớp học.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold mb-4 text-blue-700 flex items-center justify-between">
                <Layers size={30} className="mr-2"/> Quản lý Danh sách Lớp Học
                <button 
                    onClick={() => { setEditingClass(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition"
                >
                    <PlusCircle size={20} />
                    Thêm Lớp Mới
                </button>
            </h2>
            
            {message && <DisplayMessage type={message.type} message={message.text} onClose={() => setMessage(null)} />}

            <div className="flex justify-end mb-4">
                <button onClick={fetchClasses} disabled={loading} className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Tải lại
                </button>
            </div>

            {loading && classes.length === 0 ? (
                <div className="text-center py-10">
                    <Loader2 className="animate-spin text-blue-500 mx-auto" size={32} />
                    <p className="mt-2 text-gray-600">Đang tải dữ liệu lớp học...</p>
                </div>
            ) : (
                <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-blue-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Tên Lớp (class_name)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Khối (grade)</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {classes.map((cls) => (
                                <tr key={cls.class_id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cls.class_id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">{cls.class_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{cls.grade}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex gap-2 justify-center">
                                            <button 
                                                onClick={() => { setEditingClass(cls); setIsModalOpen(true); }}
                                                className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteClass(cls.class_id)}
                                                className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                                                title="Xóa"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

             {isModalOpen && (
                <ClassFormModal 
                    classData={editingClass} 
                    onSave={handleSaveClass} 
                    onClose={() => setIsModalOpen(false)} 
                    isLoading={loading}
                />
            )}
        </div>
    );
}

// --- Component Modal Form Thêm/Sửa Lớp học ---
function ClassFormModal({ classData, onSave, onClose, isLoading }) {
    const isEditing = !!classData;
    const initialFormState = {
        class_id: classData?.class_id || null,
        class_name: classData?.class_name || '',
        grade: classData?.grade || 10,
    };
    const [formData, setFormData] = useState(initialFormState);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'grade' ? parseInt(value) : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.class_name || !formData.grade) {
            alert("Vui lòng nhập đầy đủ Tên lớp và Khối.");
            return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-bold text-blue-700">{isEditing ? 'Chỉnh Sửa Lớp Học' : 'Thêm Lớp Học Mới'}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tên Lớp (Ví dụ: 10A1)</label>
                        <input type="text" name="class_name" value={formData.class_name || ''} onChange={handleChange} className="w-full p-2 border rounded-lg bg-gray-50" required />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Khối Học (Grade)</label>
                        <select name="grade" value={formData.grade} onChange={handleChange} className="w-full p-2 border rounded-lg bg-gray-50" required>
                            <option value={10}>10</option>
                            <option value={11}>11</option>
                            <option value={12}>12</option>
                        </select>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition">Hủy</button>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition disabled:bg-gray-400"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            {isEditing ? (isLoading ? 'Đang cập nhật...' : 'Lưu Thay Đổi') : (isLoading ? 'Đang thêm...' : 'Thêm Lớp')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- TRANG: ĐOÀN TRƯỜNG - QUẢN LÝ THỜI KHÓA BIỂU (MỚI) ---
function ScheduleManagementPage({ token }) {
    const [timetables, setTimetables] = useState([]);
    const [classes, setClasses] = useState([]); // Danh sách lớp để chọn
    const [users, setUsers] = useState([]); // Danh sách giáo viên/admin để chọn
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null); 
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTKB, setEditingTKB] = useState(null);

    // Fetch Classes và Users để tạo form TKB
    useEffect(() => {
        if (token) {
            const fetchData = async () => {
                const [classRes, userRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/admin/classes`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_BASE_URL}/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                const classData = await classRes.json();
                if (classData.success) setClasses(classData.classes);
                
                const userData = await userRes.json();
                if (userData.success) setUsers(userData.users);

                fetchTimetables();
            };
            fetchData();
        }
    }, [token]);

    const fetchTimetables = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const response = await fetch(`${API_BASE_URL}/doantruong/timetables`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                // Sắp xếp theo lớp, sau đó theo thứ, sau đó theo tiết
                const sortedData = data.timetables.sort((a, b) => {
                    if (a.class_id !== b.class_id) return a.class_id - b.class_id;
                    if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
                    return a.lesson_number - b.lesson_number;
                });
                setTimetables(sortedData);
            } else {
                setMessage({ type: 'error', text: data.message });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Lỗi kết nối: Không thể tải danh sách Thời khóa biểu.' });
        } finally {
            setLoading(false);
        }
    };
    
    // Thêm/Sửa TKB
    const handleSaveTKB = async (formData) => {
        setMessage(null);
        setLoading(true);
        const method = formData.timetable_id ? 'PUT' : 'POST';
        const url = formData.timetable_id 
          ? `${API_BASE_URL}/doantruong/timetables/${formData.timetable_id}` 
          : `${API_BASE_URL}/doantruong/timetables`;

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            
            if (data.success) {
                setMessage({ type: 'success', text: data.message });
                setIsModalOpen(false);
                fetchTimetables();
            } else {
                setMessage({ type: 'error', text: data.message });
            }
        } catch (error) {
            setMessage({ type: 'error', text: `Lỗi kết nối khi ${method === 'POST' ? 'thêm' : 'cập nhật'} TKB.` });
        } finally {
            setLoading(false);
        }
    };
    
    // Xóa TKB
    const handleDeleteTKB = async (timetableId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa tiết học này khỏi TKB?")) return;
        setMessage(null);
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/doantruong/timetables/${timetableId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: data.message });
                fetchTimetables();
            } else {
                setMessage({ type: 'error', text: data.message });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Lỗi kết nối khi xóa TKB.' });
        } finally {
            setLoading(false);
        }
    };

    // Hàm chuyển day_of_week (1-7) thành tên (T2 - CN)
    const getDayName = (day) => {
        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        return days[day % 7]; // 1=T2, 7=CN, 0=CN
    };

    // Map teacher_id to fullname
    const getTeacherName = (teacherId) => {
        const teacher = users.find(u => u.user_id === teacherId);
        return teacher ? teacher.fullname : 'N/A';
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold mb-4 text-purple-700 flex items-center justify-between">
                <Calendar size={30} className="mr-2"/> Quản lý Thời Khóa Biểu Học Kỳ
                <button 
                    onClick={() => { setEditingTKB(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition"
                >
                    <PlusCircle size={20} />
                    Thêm Tiết Học
                </button>
            </h2>
            
            {message && <DisplayMessage type={message.type} message={message.text} onClose={() => setMessage(null)} />}

            <div className="flex justify-end mb-4">
                <button onClick={fetchTimetables} disabled={loading} className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Tải lại
                </button>
            </div>

            {loading && timetables.length === 0 ? (
                 <div className="text-center py-10">
                    <Loader2 className="animate-spin text-blue-500 mx-auto" size={32} />
                    <p className="mt-2 text-gray-600">Đang tải TKB...</p>
                </div>
            ) : (
                <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-purple-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Lớp</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Thứ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Tiết</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Môn Học</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Giáo Viên</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {timetables.map((tkb) => (
                                <tr key={tkb.timetable_id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tkb.class_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">{getDayName(tkb.day_of_week)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{tkb.lesson_number}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{tkb.subject_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{getTeacherName(tkb.teacher_id)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex gap-2 justify-center">
                                            <button 
                                                onClick={() => { setEditingTKB(tkb); setIsModalOpen(true); }}
                                                className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteTKB(tkb.timetable_id)}
                                                className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                                                title="Xóa"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <TKBFormModal 
                    tkbData={editingTKB} 
                    onSave={handleSaveTKB} 
                    onClose={() => setIsModalOpen(false)} 
                    isLoading={loading}
                    classes={classes}
                    teachers={users.filter(u => u.role === 'giao_vien' || u.role === 'admin')} // Chỉ chọn giáo viên hoặc admin
                />
            )}
        </div>
    );
}

// --- Component Modal Form Thêm/Sửa TKB ---
function TKBFormModal({ tkbData, onSave, onClose, isLoading, classes, teachers }) {
    const isEditing = !!tkbData;
    const initialFormState = {
        timetable_id: tkbData?.timetable_id || null,
        class_id: tkbData?.class_id || (classes[0]?.class_id || ''), // Default to first class
        day_of_week: tkbData?.day_of_week || 1, // Default T2
        lesson_number: tkbData?.lesson_number || 1, // Default tiết 1
        subject_name: tkbData?.subject_name || '',
        teacher_id: tkbData?.teacher_id || (teachers[0]?.user_id || ''), // Default to first teacher
    };
    const [formData, setFormData] = useState(initialFormState);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'class_id' || name === 'teacher_id' ? parseInt(value) : (name === 'day_of_week' || name === 'lesson_number' ? parseInt(value) : value),
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.class_id || !formData.day_of_week || !formData.lesson_number || !formData.subject_name || !formData.teacher_id) {
            alert("Vui lòng nhập đầy đủ thông tin tiết học.");
            return;
        }
        onSave(formData);
    };

    // Tạo mảng Tiết học (1-10)
    const lessonNumbers = Array.from({ length: 10 }, (_, i) => i + 1);
    // Tạo mảng Thứ (1-7)
    const daysOfWeek = [
        { id: 1, name: 'Thứ Hai' },
        { id: 2, name: 'Thứ Ba' },
        { id: 3, name: 'Thứ Tư' },
        { id: 4, name: 'Thứ Năm' },
        { id: 5, name: 'Thứ Sáu' },
        { id: 6, name: 'Thứ Bảy' },
        { id: 7, name: 'Chủ Nhật' }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-bold text-blue-700">{isEditing ? 'Chỉnh Sửa Tiết Học TKB' : 'Thêm Tiết Học Mới'}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Lớp Học (*)</label>
                            <select name="class_id" value={formData.class_id || ''} onChange={handleChange} className="w-full p-2 border rounded-lg bg-gray-50" required>
                                <option value="" disabled>Chọn Lớp</option>
                                {classes.map(cls => <option key={cls.class_id} value={cls.class_id}>{cls.class_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Giáo Viên (*)</label>
                            <select name="teacher_id" value={formData.teacher_id || ''} onChange={handleChange} className="w-full p-2 border rounded-lg bg-gray-50" required>
                                <option value="" disabled>Chọn Giáo Viên</option>
                                {teachers.map(t => <option key={t.user_id} value={t.user_id}>{t.fullname}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Thứ (*)</label>
                            <select name="day_of_week" value={formData.day_of_week} onChange={handleChange} className="w-full p-2 border rounded-lg bg-gray-50" required>
                                {daysOfWeek.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Tiết (*)</label>
                            <select name="lesson_number" value={formData.lesson_number} onChange={handleChange} className="w-full p-2 border rounded-lg bg-gray-50" required>
                                {lessonNumbers.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Buổi sáng: 1-5, Buổi chiều: 6-10</p>
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Môn Học (*)</label>
                            <input type="text" name="subject_name" value={formData.subject_name} onChange={handleChange} className="w-full p-2 border rounded-lg bg-gray-50" required />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition">Hủy</button>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition disabled:bg-gray-400"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            {isEditing ? (isLoading ? 'Đang cập nhật...' : 'Lưu Thay Đổi') : (isLoading ? 'Đang thêm...' : 'Thêm Tiết Học')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- TRANG: XEM THỜI KHÓA BIỂU (GIÁO VIÊN/BÍ THƯ/BGH) ---
function SchedulePage({ user, token }) {
    const [schedule, setSchedule] = useState({}); // TKB theo lớp/cá nhân
    const [classes, setClasses] = useState([]); // Danh sách lớp để chọn (nếu là BGH/GV bộ môn)
    const [selectedClass, setSelectedClass] = useState(user.class_id || ''); // Lớp mặc định
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null); 
    const [isPersonal, setIsPersonal] = useState(user.role === 'giao_vien' || user.role === 'ban_giam_hieu');

    // Fetch Classes và TKB
    useEffect(() => {
        if (token) {
            const fetchData = async () => {
                const classRes = await fetch(`${API_BASE_URL}/admin/classes`, { headers: { 'Authorization': `Bearer ${token}` } });
                const classData = await classRes.json();
                if (classData.success) {
                    setClasses(classData.classes);
                }
                // Nếu là GVCN/Bí thư, set lớp mặc định, nếu không thì lấy lớp đầu tiên (hoặc để trống)
                if (user.class_id) {
                    setSelectedClass(user.class_id);
                } else if (classData.classes.length > 0 && user.role !== 'giao_vien') {
                    setSelectedClass(classData.classes[0].class_id);
                }
            };
            fetchData();
        }
    }, [token, user.class_id, user.role]);

    useEffect(() => {
        if (token && (selectedClass || isPersonal)) {
            fetchSchedule();
        }
    }, [token, selectedClass, isPersonal]);


    const fetchSchedule = async () => {
        setLoading(true);
        setMessage(null);
        let url;
        if (isPersonal) {
             // Lấy TKB cá nhân (dựa trên teacher_id = user_id)
            url = `${API_BASE_URL}/schedule/teacher/${user.user_id}`;
        } else if (selectedClass) {
             // Lấy TKB theo lớp
            url = `${API_BASE_URL}/schedule/class/${selectedClass}`;
        } else {
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setSchedule(formatSchedule(data.timetables));
            } else {
                setMessage({ type: 'error', text: data.message });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Lỗi kết nối: Không thể tải Thời khóa biểu.' });
        } finally {
            setLoading(false);
        }
    };

    // Định dạng lại dữ liệu TKB thành object: { day_of_week: { lesson_number: item, ... }, ... }
    const formatSchedule = (timetables) => {
        const structured = {};
        timetables.forEach(item => {
            const day = item.day_of_week;
            if (!structured[day]) {
                structured[day] = {};
            }
            structured[day][item.lesson_number] = item;
        });
        return structured;
    };

    const lessonNumbers = Array.from({ length: 10 }, (_, i) => i + 1); // 1-10 tiết
    const daysOfWeek = Array.from({ length: 6 }, (_, i) => i + 1); // Thứ 2 (1) -> Thứ 7 (6)
    const getDayName = (day) => {
        const names = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        return names[day];
    };
    
    // Tên lớp hiện tại
    const currentClassName = classes.find(c => c.class_id === selectedClass)?.class_name || 'Chọn Lớp';
    const isSubjectTeacher = user.role === 'giao_vien' && !user.class_id;

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold mb-4 text-orange-700 flex items-center gap-3">
                <Clock size={30} /> Thời Khóa Biểu 
                <span className="text-xl font-medium text-gray-700 ml-4">
                     {isPersonal && `Cá nhân (${user.fullname})`}
                     {!isPersonal && `Lớp ${currentClassName}`}
                </span>
            </h2>

            <div className="mb-6 flex gap-4 items-center">
                {/* Selector cho BGH và GV bộ môn (nếu không chủ nhiệm) */}
                {(user.role === 'ban_giam_hieu' || isSubjectTeacher) && (
                     <select 
                        value={selectedClass || ''} 
                        onChange={(e) => setSelectedClass(parseInt(e.target.value))}
                        className="p-2 border rounded-lg bg-white shadow-sm"
                     >
                        <option value="" disabled>Chọn Lớp cần xem</option>
                        {classes.map(cls => <option key={cls.class_id} value={cls.class_id}>{cls.class_name}</option>)}
                    </select>
                )}

                {/* Nút chuyển đổi giữa TKB cá nhân và TKB lớp (Chỉ cho GV và BGH) */}
                {(user.role === 'giao_vien' || user.role === 'ban_giam_hieu') && (
                    <button
                        onClick={() => setIsPersonal(!isPersonal)}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
                    >
                        <Check size={16}/> Chuyển sang TKB {isPersonal ? 'Lớp' : 'Cá nhân'}
                    </button>
                )}
            </div>

            {message && <DisplayMessage type={message.type} message={message.text} onClose={() => setMessage(null)} />}

            {loading ? (
                <div className="text-center py-10">
                    <Loader2 className="animate-spin text-blue-500 mx-auto" size={32} />
                    <p className="mt-2 text-gray-600">Đang tải TKB...</p>
                </div>
            ) : (
                <div className="overflow-x-auto border rounded-lg shadow-xl">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-orange-100 sticky top-0">
                            <tr>
                                <th className="px-4 py-3 text-center text-sm font-bold text-gray-800 border-r">Tiết / Thứ</th>
                                {daysOfWeek.map(day => (
                                    <th key={day} className="px-4 py-3 text-center text-sm font-bold text-gray-800 border-r">{getDayName(day)}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {lessonNumbers.map(lesson => (
                                <tr key={lesson}>
                                    <td className={`px-4 py-3 text-center text-sm font-bold text-gray-900 border-r ${lesson > 5 ? 'bg-orange-50' : ''}`}>
                                        {lesson} {lesson === 5 && <span className="text-xs font-normal text-gray-500 block">(Giải lao)</span>}
                                        {lesson === 10 && <span className="text-xs font-normal text-gray-500 block">(Kết thúc)</span>}
                                    </td>
                                    {daysOfWeek.map(day => {
                                        const item = schedule[day]?.[lesson];
                                        const content = item ? (
                                            <>
                                                <div className="font-semibold text-blue-700">{item.subject_name}</div>
                                                <div className="text-xs text-gray-600">Lớp: {item.class_name}</div>
                                                <div className="text-xs text-gray-500">GV: {item.teacher_fullname}</div>
                                            </>
                                        ) : (
                                            <span className="text-gray-400 text-xs">-</span>
                                        );
                                        return (
                                            <td key={`${day}-${lesson}`} className="px-4 py-3 text-center text-sm border-r h-20 hover:bg-gray-50 transition">
                                                {content}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// --- CÁC TRANG MOCKUP KHÁC (GIỮ NGUYÊN) ---
function PublicDashboard({ rankings }) { 
    if (!rankings || rankings.length === 0) {
        return (
          <div className="p-6 bg-white rounded-lg shadow-md text-center text-gray-500">
            Không có dữ liệu bảng xếp hạng tuần này hoặc đang tải...
          </div>
        );
    }

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-blue-700">
            Bảng Xếp Hạng Thi Đua Tuần
            <select className="ml-4 p-2 border rounded-lg bg-white text-base font-normal shadow-sm">
                <option>Tuần hiện tại (30)</option>
                <option>Tuần trước (29)</option>
            </select>
          </h2>
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hạng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Lớp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm Tổng</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rankings.map((lop, index) => (
                  <tr key={lop.ten_lop} className={index < 3 ? 'bg-yellow-50 font-bold' : (index % 2 === 0 ? 'bg-white' : 'bg-gray-50')}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lop.rank_position}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{lop.ten_lop}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{lop.total_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
}

const MOCK_TKB_GV = {
  thu: "Thứ Ba",
  ngay: "11/11/2025",
  tiet: [
    { id: 1, mon: "Toán", lop: "12A1", trang_thai: "Chưa ký" },
    { id: 2, mon: "Toán", lop: "12A1", trang_thai: "Chưa ký" },
    { id: 3, mon: "Vật Lý", lop: "11A5", trang_thai: "Đã ký" },
  ]
};
function LogbookPage({ user }) {
  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">Sổ Đầu Bài Điện Tử</h2>
      <p className="text-gray-600 mb-4">Danh sách tiết dạy hôm nay ({MOCK_TKB_GV.ngay})</p>
      {MOCK_TKB_GV.tiet.map(tiet => (
        <div key={tiet.id} className="flex justify-between items-center p-4 border rounded-lg mb-3 bg-gray-50 hover:bg-white transition">
          <div>
            <span className="font-bold text-lg text-blue-600">Tiết {tiet.id}: {tiet.mon}</span>
            <span className="text-gray-700 ml-4">Lớp {tiet.lop}</span>
          </div>
          <button className={`px-4 py-2 rounded-lg font-semibold shadow-md ${tiet.trang_thai === 'Đã ký' ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>
            {tiet.trang_thai === 'Đã ký' ? 'Xem & Chỉnh sửa' : 'Ký sổ & Đánh giá'}
          </button>
        </div>
      ))}
       <p className="mt-6 text-sm text-gray-500">Lưu ý: Chỉ người chấm tiết mới có quyền sửa kết quả sau khi ký.</p>
    </div>
  );
}

function CoDoReportPage({ user }) {
  return (
    <div className="p-6 bg-white rounded-xl shadow-lg max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-red-700">Gửi Báo Cáo Vi Phạm</h2>
      <p className="text-gray-600 mb-6">Đội Cờ đỏ ({user.fullname}) ghi nhận vi phạm tại đây.</p>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Chọn Lớp Vi Phạm</label>
          <select className="w-full p-3 border rounded-lg bg-gray-50 mt-1">
            <option>10A1</option><option>10A2</option><option>12A8</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Chọn Lỗi Vi Phạm</label>
          <select className="w-full p-3 border rounded-lg bg-gray-50 mt-1">
            <option>Đi trễ</option><option>Không đồng phục</option><option>Vứt rác không đúng nơi</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Thời gian & Địa điểm</label>
           <input type="text" placeholder="Ví dụ: 7h05 tại cổng trường" className="w-full p-3 border rounded-lg bg-gray-50 mt-1" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Ghi chú chi tiết</label>
          <textarea className="w-full p-3 border rounded-lg bg-gray-50 mt-1" rows="3"></textarea>
        </div>
        <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg shadow-lg font-semibold hover:bg-red-700 transition">
          <Flag size={20} /> Gửi Báo Cáo Vi Phạm
        </button>
      </form>
    </div>
  );
}
const MOCK_VIOLATIONS = [
  { id: 1, loi: "Đi trễ", nguoi_bao_cao: "Cờ đỏ A", status: "Chờ xác nhận" },
  { id: 2, loi: "Không đồng phục", nguoi_bao_cao: "Cờ đỏ B", status: "Chờ xác nhận" },
];
function BiThuApprovePage({ user }) {
  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-green-700">Xác Nhận Vi Phạm Lớp {user.class_id || 'Chủ nhiệm'}</h2>
      <p className="text-gray-600 mb-6">Bí thư Chi đoàn xác nhận hoặc phản hồi các vi phạm được Cờ đỏ báo cáo.</p>
      {MOCK_VIOLATIONS.map(v => (
        <div key={v.id} className="flex justify-between items-center p-4 border rounded-lg mb-3 bg-yellow-50">
          <div>
            <span className="font-bold text-lg">{v.loi}</span>
            <span className="text-gray-600 text-sm ml-4">(Báo cáo bởi: {v.nguoi_bao_cao})</span>
            <p className="text-xs text-red-500 mt-1">Trạng thái: {v.status}</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"><CheckSquare size={16}/> Xác nhận Đúng</button>
            <button className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"><XCircle size={16}/> Phản hồi Sai</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function DoanTruongManagePage({ user }) {
   return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-purple-700">Quản lý Lỗi Vi Phạm & Duyệt Phản Hồi</h2>
      <p className="text-gray-600">Đoàn trường có quyền xem/sửa/xóa danh sách lỗi. Đồng thời duyệt hoặc hủy các phản hồi từ Bí thư Chi đoàn.</p>
    </div>
  );
}

function BGHManagePage({ user }) {
   return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-indigo-700">Quản lý Giáo Viên & Ký Sổ Thay</h2>
      <p className="text-gray-600">Ban Giám Hiệu có thể:</p>
      <ul className="list-disc list-inside ml-4 mt-2 text-gray-700">
        <li>Xem, sửa thông tin các Giáo viên (Giáo viên bộ môn, Giáo viên chủ nhiệm).</li>
        <li>Chấm tiết thay cho Giáo viên vắng.</li>
      </ul>
    </div>
  );
}