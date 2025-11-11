import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './components/MainLayout';
import HomePage from './pages/HomePage';
import MonitorPage from './pages/MonitorPage';
import SecretaryPage from './pages/SecretaryPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage'; 
import SettingsPage from './pages/SettingsPage'; // <-- Cần import
import ClassLogPage from './pages/ClassLogPage'; // <-- Cần tạo file này
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          
          {/* Route chính sử dụng MainLayout (có Sidebar/Header) */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="monitor" element={<MonitorPage />} />
            <Route path="secretary" element={<SecretaryPage />} />
            <Route path="admin" element={<AdminPage />} />
            
            {/* BỔ SUNG ROUTE MỚI */}
            <Route path="settings" element={<SettingsPage />} />
            <Route path="classlog" element={<ClassLogPage />} />
          </Route>
          
          {/* Trang Đăng nhập (KHÔNG dùng MainLayout) */}
          <Route path="/login" element={<LoginPage />} />
        
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;