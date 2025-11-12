import React, { useState, useEffect, useCallback } from 'react';
import { fetchData } from '../../utils/api.js';
import { ROLES } from '../../constants.js'; // Import ROLES toàn cục

// --- COMPONENT: UserManagementPage (Admin) ---
// (SỬA V5.13) Chuyển Form thành Modal và Tự động hóa 'chuc_vu'
export default function UserManagementPage({ token, onNavigate, classes }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // (MỚI V5.13) State cho Modal
  const [isModalOpen, setIsModalOpen] = useState(false); 

  // State cho form (Thêm/Sửa)
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [editUserId, setEditUserId] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [role, setRole] = useState('giao_vien');
  const [chuc_vu, setChucVu] = useState('Giáo Viên'); // (SỬA V5.13) Mặc định
  const [classId, setClassId] = useState('');

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
    setChucVu('Giáo Viên'); // (SỬA V5.13) Reset về mặc định
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
    setPassword(''); 
  };

  // (MỚI V5.13) Hàm mở/đóng modal
  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };
  
  const openEditModal = (user) => {
    handleEditClick(user);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // (MỚI V5.13) Xóa lỗi cũ
    
    // (SỬA LỖI V5.13) Tự động gán Chức vụ dựa trên Role
    const selectedRoleLabel = ROLES.find(r => r.value === role)?.label || role;
    
    const userData = { 
        username, 
        password, 
        fullname, 
        role, 
        chuc_vu: selectedRoleLabel, // (SỬA V5.13) Luôn dùng Label
        class_id: classId || null 
    };
    
    if (!userData.password) delete userData.password; 
    if (!userData.class_id) userData.class_id = null; 
    
    try {
        if (formMode === 'add') {
            await fetchData('/api/admin/users', 'POST', userData, token);
        } else {
            await fetchData(`/api/admin/users/${editUserId}`, 'PUT', userData, token);
        }
        closeModal(); // (SỬA V5.13) Đóng modal
        loadUsers(); // Tải lại danh sách
    } catch (err) {
        setError(err.message); // Hiển thị lỗi (ví dụ: Tên đăng nhập trùng, Lớp đã có Bí thư)
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Bạn có chắc muốn xóa người dùng này?')) {
        try {
            await fetchData(`/api/admin/users/${userId}`, 'DELETE', null, token);
            loadUsers(); // Tải lại danh sách
        } catch (err) {
            setError(err.message); // (SỬA V5.13) Hiển thị lỗi (ví dụ: Không thể xóa)
        }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">
          Quản trị Người dùng
        </h2>
        {/* (MỚI V5.13) Nút Thêm Mới */}
        <button
          onClick={openAddModal}
          className="py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
          + Thêm Người Dùng Mới
        </button>
      </div>
      
      {error && <p className="text-red-600 bg-red-100 p-3 rounded-md mb-4">{error}</p>}

      {/* (SỬA V5.13) Bỏ grid-cols-3, chỉ giữ lại bảng */}
      <div className="bg-white p-6 rounded-lg shadow overflow-x-auto">
        <h3 className="text-xl font-semibold mb-4">Danh sách Người dùng</h3>
        {isLoading && <p>Đang tải...</p>}
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên đăng nhập</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Họ tên</th>
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
                  <td className="px-4 py-4 whitespace-nowrap">{user.chuc_vu}</td> 
                  <td className="px-4 py-4 whitespace-nowrap">{user.role}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{classes.find(c => c.class_id === user.class_id)?.class_name || 'N/A'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {/* (SỬA V5.13) Nút Sửa gọi openEditModal */}
                    <button onClick={() => openEditModal(user)} className="text-indigo-600 hover:text-indigo-900">Sửa</button>
                    {/* (SỬA V5.13) Logic safeguard của Admin */}
                    {user.role !== 'admin' && (
                        <button onClick={() => handleDelete(user.user_id)} className="text-red-600 hover:text-red-900">Xóa</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
        </table>
      </div>

      {/* (MỚI V5.13) Modal Thêm/Sửa Người dùng */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
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
                  disabled={formMode === 'edit'}
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
                  // (SỬA LỖI V5.13) Tự động cập nhật Chức vụ khi Role thay đổi
                  onChange={(e) => {
                      const selectedRoleValue = e.target.value;
                      const selectedRoleLabel = ROLES.find(r => r.value === selectedRoleValue)?.label || '';
                      setRole(selectedRoleValue);
                      setChucVu(selectedRoleLabel); // Tự động điền chức vụ
                  }}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm">
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              
              {/* (SỬA LỖI V5.13) Xóa ô nhập Chức vụ (đã tự động) */}
              
              <div>
                <label>Lớp (nếu là Bí thư/Giáo viên CN)</label>
                <select
                  value={classId || ''} 
                  onChange={(e) => setClassId(e.target.value)}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm">
                  <option value="">Không áp dụng</option>
                  {classes.map(c => (
                    <option key={c.class_id} value={c.class_id}>{c.class_name} ({c.school_year})</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-2 mt-4">
                {/* (SỬA V5.13) Nút Hủy gọi closeModal */}
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                    Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                  {formMode === 'add' ? 'Thêm' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};