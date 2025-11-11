import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // <--- Bổ sung

const API_URL = 'http://localhost:5001/api';

function MonitorPage() {
    const { role, ROLES } = useAuth(); // <--- Lấy vai trò người dùng
    const [classes, setClasses] = useState([]);
    const [violationTypes, setViolationTypes] = useState([]);
    const [formData, setFormData] = useState({
        class_id: '',
        student_name: '',
        violation_type_id: '',
        date: new Date().toISOString().split('T')[0],
        reported_by: 1
    });

    useEffect(() => {
        axios.get(`${API_URL}/classes`)
            .then(res => {
                setClasses(res.data);
                if (res.data.length > 0) setFormData(prev => ({ ...prev, class_id: res.data[0].id }));
            })
            .catch(err => console.error("Lỗi lấy lớp:", err));

        // Giả lập dữ liệu loại vi phạm (Bạn nên tạo API cho cái này sau)
        setViolationTypes([
            { id: 1, name: 'Đi học muộn', points: 2 },
            { id: 2, name: 'Không đồng phục / huy hiệu', points: 2 },
            { id: 3, name: 'Nghỉ học không phép', points: 5 },
            { id: 4, name: 'Mất trật tự trong giờ', points: 2 },
            { id: 5, name: 'Vệ sinh lớp bẩn', points: 3 },
        ]);
        setFormData(prev => ({ ...prev, violation_type_id: 1 }));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/violations`, formData);
            alert("✅ Đã ghi nhận vi phạm thành công!");
            setFormData(prev => ({ ...prev, student_name: '' }));
        } catch (error) {
            alert("❌ Lỗi khi gửi vi phạm!");
            console.error(error);
        }
    };

    // Kiểm tra quyền: Cờ đỏ HOẶC Đoàn trường (Admin)
    const isAuthorized = role === ROLES.CO_DO || role === ROLES.DOAN_TRUONG;

    if (!isAuthorized) {
        return (
            <div className="page-container" style={{ textAlign: 'center', marginTop: '50px' }}>
                <h2 className="page-title" style={{ color: '#dc2626' }}>Truy cập bị từ chối!</h2>
                <p>Chỉ Cờ đỏ hoặc Đoàn Trường mới có quyền Ghi nhận Vi phạm.</p>
            </div>
        );
    }


    return (
        <div className="page-container" style={{ maxWidth: '500px' }}>
            <h2 className="page-title" style={{ color: '#dc2626' }}>🚩 Ghi nhận Vi phạm (Cờ đỏ/Đoàn Trường)</h2>
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">Lớp vi phạm:</label>
                    <select
                        className="form-select"
                        value={formData.class_id}
                        onChange={e => setFormData({ ...formData, class_id: e.target.value })}
                    >
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Học sinh (để trống nếu lỗi tập thể):</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="VD: Nguyễn Văn A"
                        value={formData.student_name}
                        onChange={e => setFormData({ ...formData, student_name: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Lỗi vi phạm:</label>
                    <select
                        className="form-select"
                        value={formData.violation_type_id}
                        onChange={e => setFormData({ ...formData, violation_type_id: e.target.value })}
                    >
                        {violationTypes.map(type => (
                            <option key={type.id} value={type.id}>
                                {type.name} (-{type.points}đ)
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Ngày vi phạm:</label>
                    <input
                        type="date"
                        className="form-input"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                    />
                </div>

                <button type="submit" className="btn btn-danger" style={{ width: '100%', marginTop: '1rem' }}>
                    Gửi báo cáo vi phạm
                </button>
            </form>
        </div>
    );
}

export default MonitorPage;