import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom'; // Thêm Link cho chuyển hướng

const API_URL = 'http://localhost:5001/api';

// MOCK DATA để mô phỏng bảng xếp hạng
const mockRankings = [
    { id: 1, name: '10A1', points: 98, violations: 1, grade: 10 },
    { id: 2, name: '11B3', points: 95, violations: 3, grade: 11 },
    { id: 3, name: '12C1', points: 88, violations: 6, grade: 12 },
    { id: 4, name: '10A5', points: 82, violations: 8, grade: 10 },
    { id: 5, name: '11B1', points: 75, violations: 12, grade: 11 },
].sort((a, b) => b.points - a.points); // Sắp xếp giảm dần

function HomePage() {
    const { isLoggedIn } = useAuth();
    const [rankings, setRankings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Tương lai: Gọi API để lấy bảng xếp hạng từ Backend
        // axios.get(`${API_URL}/dashboard/rankings`).then(...)
        
        // Hiện tại: Dùng mock data
        setTimeout(() => {
            setRankings(mockRankings);
            setLoading(false);
        }, 500); 

    }, []);

    if (!isLoggedIn) {
         return (
            <div className="page-container" style={{ textAlign: 'center', marginTop: '50px' }}>
                <h2 className="page-title" style={{ color: '#2563eb' }}>Chào mừng!</h2>
                <p>Vui lòng <Link to="/login" style={{ color: '#dc2626', fontWeight: 'bold' }}>Đăng nhập</Link> để xem Dashboard.</p>
            </div>
        );
    }
    
    if (loading) {
        return <div className="page-container" style={{textAlign: 'center', padding: '50px'}}>Đang tải dữ liệu xếp hạng...</div>;
    }

    return (
        <div className="page-container">
            <h2 className="page-title" style={{ color: '#2563eb' }}>📊 Tổng quan Thi đua Tuần/Tháng</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '2rem' }}>
                {/* Thẻ hiển thị điểm lớp hạng nhất */}
                <RankCard rank={rankings[0]} title="Hạng 1 Tuần" icon="🥇" color="#fbbf24" />
                {/* Thẻ hiển thị số lỗi đang khiếu nại */}
                 <RankCard rank={{points: 5}} title="Lỗi đang Khiếu nại" icon="⚖️" color="#7e22ce" />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>Bảng xếp hạng chi tiết</h3>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '50px' }}>Hạng</th>
                            <th style={{ width: '80px' }}>Khối</th>
                            <th>Chi đoàn</th>
                            <th className="text-center">Số lỗi (đã duyệt)</th>
                            <th style={{ width: '100px', textAlign: 'center' }}>Điểm Nề nếp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rankings.map((cls, index) => (
                            <tr key={cls.id} style={index < 3 ? { backgroundColor: '#fffbe3' } : {}}>
                                <td style={{ textAlign: 'center', fontWeight: 'bold', color: index === 0 ? '#fbbf24' : '#6b7280' }}>
                                    {index + 1}
                                </td>
                                <td>{cls.grade}</td>
                                <td style={{ fontWeight: 'bold' }}>{cls.name}</td>
                                <td style={{ textAlign: 'center' }}>{cls.violations}</td>
                                <td style={{ textAlign: 'center', fontWeight: 'bold', color: cls.points > 90 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                                    {cls.points}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
}

// Component Thẻ (Card) nhỏ cho Dashboard
const RankCard = ({ rank, title, icon, color }) => (
    <div style={{ padding: '1.5rem', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.5rem' }}>{title}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: color }}>
                {rank.points}
                {title.includes("Hạng") && 'đ'}
            </span>
            <span style={{ fontSize: '2rem' }}>{icon}</span>
        </div>
        {title.includes("Hạng") && <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#374151' }}>Chi đoàn: {rank.name}</p>}
    </div>
);


export default HomePage;