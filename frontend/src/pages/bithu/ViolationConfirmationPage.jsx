import React, { useState, useEffect, useCallback } from 'react';
import { fetchData } from '../../utils/api.js';
import dayjs from 'dayjs';

// --- COMPONENT: ViolationConfirmationPage (Bí thư) ---
export default function ViolationConfirmationPage({ token, user }) {
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