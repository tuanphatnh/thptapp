import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchData } from '../../utils/api.js';
import { getWeekNumber } from '../../utils/dateUtils.js';
import dayjs from 'dayjs';

// --- COMPONENT: LogbookPage (Sổ Đầu Bài - Giáo viên, BGH) ---
export default function LogbookPage({ token, user, allRules }) {
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