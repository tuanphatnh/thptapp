import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

function SecretaryPage() {
    const [classes, setClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [violations, setViolations] = useState([]);

    // Lấy danh sách lớp để chọn (giả lập đăng nhập)
    useEffect(() => {
        axios.get(`${API_URL}/classes`)
            .then(res => {
                setClasses(res.data);
                if (res.data.length > 0) setSelectedClassId(res.data[0].id);
            })
            .catch(err => console.error("Lỗi lấy lớp:", err));
    }, []);

    // Khi chọn lớp khác, tải lại danh sách vi phạm của lớp đó
    useEffect(() => {
        if (selectedClassId) {
            fetchViolations();
        }
    }, [selectedClassId]);

    const fetchViolations = () => {
        axios.get(`${API_URL}/violations/class/${selectedClassId}`)
            .then(res => setViolations(res.data))
            .catch(err => console.error("Lỗi lấy vi phạm:", err));
    };

    // Xử lý nút Xác nhận / Khiếu nại
    const handleAction = async (violationId, action) => {
        try {
            await axios.put(`${API_URL}/violations/${violationId}/confirm-dispute`, { action });
            fetchViolations(); // Tải lại danh sách để cập nhật trạng thái mới
        } catch (error) {
            alert("Lỗi cập nhật trạng thái!");
            console.error(error);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">Bí thư Chi đoàn - Xem Vi phạm</h2>

            {/* Chọn lớp (Giả lập) */}
            <div className="mb-6 flex items-center gap-4">
                <label className="font-medium">Chọn lớp của bạn:</label>
                <select
                    className="p-2 border rounded-md"
                    value={selectedClassId}
                    onChange={e => setSelectedClassId(e.target.value)}
                >
                    {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                </select>
            </div>

            {/* Bảng danh sách vi phạm */}
            <table className="min-w-full border-collapse border border-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="border p-3 text-left">Ngày</th>
                        <th className="border p-3 text-left">Học sinh</th>
                        <th className="border p-3 text-left">Lỗi vi phạm</th>
                        <th className="border p-3 text-center">Điểm trừ</th>
                        <th className="border p-3 text-center">Trạng thái</th>
                        <th className="border p-3 text-center">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {violations.map(vio => (
                        <tr key={vio.id} className={vio.status === 'disputed' ? 'bg-red-50' : ''}>
                            <td className="border p-3">{new Date(vio.date).toLocaleDateString('vi-VN')}</td>
                            <td className="border p-3">{vio.student_name || <span className="italic text-gray-500">Tập thể</span>}</td>
                            <td className="border p-3">{vio.violation_name}</td>
                            <td className="border p-3 text-center text-red-600 font-bold">-{vio.points}</td>
                            <td className="border p-3 text-center">
                                {/* Hiển thị trạng thái đẹp hơn */}
                                {vio.status === 'pending_confirmation' && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Chờ xác nhận</span>}
                                {vio.status === 'confirmed' && <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Đã xác nhận</span>}
                                {vio.status === 'disputed' && <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">Đang khiếu nại</span>}
                                {vio.status === 'rejected' && <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs line-through">Đã hủy</span>}
                            </td>
                            <td className="border p-3 text-center">
                                {/* Chỉ hiện nút nếu đang ở trạng thái chờ */}
                                {vio.status === 'pending_confirmation' && (
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => handleAction(vio.id, 'confirm')}
                                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                                        >
                                            Đúng
                                        </button>
                                        <button
                                            onClick={() => handleAction(vio.id, 'dispute')}
                                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                                        >
                                            Sai
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default SecretaryPage;