import React, { useState, useEffect, useCallback } from 'react';
import { fetchData } from '../../utils/api.js';
import dayjs from 'dayjs';

// --- COMPONENT: ViolationApprovalPage (Đoàn trường) ---
export default function ViolationApprovalPage({ token }) {
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