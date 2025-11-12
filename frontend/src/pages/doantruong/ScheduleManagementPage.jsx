import React, { useState, useEffect, useCallback } from 'react';
import { fetchData } from '../../utils/api.js';
import dayjs from 'dayjs';

// --- COMPONENT: ScheduleManagementPage (Đoàn Trường) ---
export default function ScheduleManagementPage({ token, classes }) {
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

  // Lọc lại lớp học khi Năm học hoặc danh sách lớp thay đổi
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