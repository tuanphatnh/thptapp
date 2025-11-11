import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css'; 

const API_URL = 'http://localhost:5001/api';

function LoginPage() {
    const { login, ROLES } = useAuth();
    const navigate = useNavigate();
    
    // State cho form
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_URL}/auth/login`, { username, password });
            
            // Nếu đăng nhập thành công, gọi hàm login từ Context để lưu trạng thái
            const user = response.data.user;
            
            if (user && user.role) {
                login(user.role, user); 
                navigate('/');
            } else {
                 setError('Dữ liệu trả về không hợp lệ.');
            }

        } catch (err) {
            console.error(err);
            // Lấy thông báo lỗi từ backend (ví dụ: "Mật khẩu không đúng")
            const errMsg = err.response?.data?.message || 'Lỗi kết nối server hoặc sai thông tin.';
            setError(errMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container" style={{ maxWidth: '400px', marginTop: '80px' }}>
            <h1 className="page-title" style={{ marginBottom: '1.5rem', textAlign: 'center', color: 'var(--primary-color)' }}>
                Đăng nhập Hệ thống
            </h1>
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">Tên đăng nhập:</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Nhập username..."
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                        autoFocus
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Mật khẩu:</label>
                    <input
                        type="password"
                        className="form-input"
                        placeholder="Nhập mật khẩu..."
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                </div>

                {error && (
                    <div style={{ 
                        color: '#991b1b', 
                        backgroundColor: '#fee2e2', 
                        padding: '0.75rem', 
                        borderRadius: '6px', 
                        marginBottom: '1rem',
                        fontSize: '0.875rem',
                        border: '1px solid #fecaca'
                    }}>
                        ⚠️ {error}
                    </div>
                )}
                
                <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
                    disabled={loading}
                >
                    {loading ? 'Đang kiểm tra...' : 'Đăng nhập'}
                </button>
            </form>

            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', fontSize: '0.85rem', color: '#6b7280' }}>
                <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Gợi ý tài khoản test (Mật khẩu chung: 123456):</p>
                <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                    <li>Admin tối cao: <code>htadmin</code></li>
                    <li>Đoàn trường: <code>doantruong</code></li>
                    <li>Cờ đỏ: <code>codo</code></li>
                    <li>Bí thư 10A1: <code>bt10a1</code></li>
                    <li>Giáo viên: <code>gvtoan</code></li>
                </ul>
            </div>

        </div>
    );
}

export default LoginPage;