import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

function AdminPage() {
    const [disputedViolations, setDisputedViolations] = useState([]);

    useEffect(() => {
        fetchDisputed();
    }, []);

    const fetchDisputed = () => {
        axios.get(`${API_URL}/violations/disputed`)
            .then(res => setDisputedViolations(res.data))
            .catch(err => console.error("Lỗi lấy danh sách khiếu nại:", err));
    };

    const handleResolve = async (violationId, action) => {
        try {
            // action: 'confirm' (Bác đơn khiếu nại, vẫn trừ điểm) hoặc 'reject' (Chấp nhận khiếu nại, hủy lỗi)
            await axios.put(`${API_URL}/violations/${violationId}/resolve`, { action });
            alert("Đã giải quyết khiếu nại!");
            fetchDisputed(); // Tải lại danh sách
        } catch (error) {
            alert("Lỗi xử lý!");
            console.error(error);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-purple-800">Đoàn trường - Giải quyết Khiếu nại</h2>

            {disputedViolations.length === 0 ? (
                <p className="text-gray-500 italic text-center py-10">Hiện không có khiếu nại nào cần giải quyết.</p>
            ) : (
                <div className="space-y-4">
                    {disputedViolations.map(vio => (
                        <div key={vio.id} className="border border-red-200 bg-red-50 p-4 rounded-lg flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg text-red-700">{vio.class_name} - {vio.violation_name}</h3>
                                <p className="text-gray-700">Học sinh: <strong>{vio.student_name || 'Tập thể'}</strong></p>
                                <p className="text-sm text-gray-500">Ngày vi phạm: {new Date(vio.date).toLocaleDateString('vi-VN')}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => handleResolve(vio.id, 'confirm')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                                >
                                    Bác đơn (Vẫn trừ điểm)
                                </button>
                                <button
                                    onClick={() => handleResolve(vio.id, 'reject')}
                                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-medium"
                                >
                                    Chấp nhận (Hủy lỗi này)
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AdminPage;