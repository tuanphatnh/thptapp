import React, { useState, useEffect, useCallback } from 'react';
import { fetchData } from '../utils/api.js';
import { getWeekNumber, getStartAndEndOfWeek } from '../utils/dateUtils.js';

// --- COMPONENT: RankingDashboard (Trang Dashboard Xếp hạng Công khai) ---
export default function RankingDashboard({ token }) {
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