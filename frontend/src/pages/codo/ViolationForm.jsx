import React, { useState, useEffect, useMemo } from 'react';
import { fetchData } from '../../utils/api.js';
import { getWeekNumber } from '../../utils/dateUtils.js';
import dayjs from 'dayjs';

// --- COMPONENT: ViolationForm (Cờ Đỏ) ---
export default function ViolationForm({ token, user, allRules, classes }) {
  const [isLoading, setIsLoading] = useState(false); 
  const [error, setError] = useState(null);

  // Lọc quy tắc Cờ Đỏ (Loại 1 và 2)
  const violationRules = useMemo(() => {
    return allRules.filter(r => r.is_in_class_violation === 1 || r.is_in_class_violation === 2);
  }, [allRules]);

  // Form state
  const [classId, setClassId] = useState(classes.length > 0 ? classes[0].class_id : ''); 
  const [violationRuleId, setViolationRuleId] = useState(''); 
  const [description, setDescription] = useState('');
  const [violationDate, setViolationDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [weekNumber, setWeekNumber] = useState(getWeekNumber(new Date()));


  // Set ID mặc định khi quy tắc được tải
  useEffect(() => {
      if (violationRules.length > 0 && !violationRuleId) {
          setViolationRuleId(violationRules[0].violation_type_id);
      }
  }, [violationRules, violationRuleId]);
  
  // Set classId mặc định khi classes tải xong
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
    setError(null); 
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
      violation_type_id: violationRuleId, 
      description,
      violation_date: violationDate,
      week_number: weekNumber,
    };
    try {
        await fetchData('/api/violations/report', 'POST', reportData, token);
        alert('Đã gửi báo cáo thành công!');
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