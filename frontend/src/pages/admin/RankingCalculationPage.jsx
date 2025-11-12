import React, { useState } from 'react';
import { fetchData } from '../../utils/api.js';
import { getWeekNumber } from '../../utils/dateUtils.js';

// --- COMPONENT: RankingCalculationPage (Admin/BGH) ---
export default function RankingCalculationPage({ token }) {
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