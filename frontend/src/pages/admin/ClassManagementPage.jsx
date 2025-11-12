import React, { useState } from 'react';
import { fetchData } from '../../utils/api.js';
import dayjs from 'dayjs';

// --- COMPONENT: ClassManagementPage (Admin) ---
export default function ClassManagementPage({ token, onNavigate, classes, loadClasses }) {
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
        setError(null); 
        loadClasses(); 
    } catch (err) {
        setError(err.message); 
    } finally {
        setIsLoading(false);
    }
  };

  const handleDelete = async (classId) => {
    if (window.confirm('Bạn có chắc muốn xóa lớp này? (Tất cả TKB và Lỗi liên quan sẽ bị xóa!)')) {
        try {
            await fetchData(`/api/admin/classes/${classId}`, 'DELETE', null, token);
            loadClasses(); 
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