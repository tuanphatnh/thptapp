import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// 1. Lấy phần tử root
const rootElement = document.getElementById('root');

// 2. Kiểm tra xem nó có tồn tại không (an toàn hơn)
if (rootElement) {
  // 3. Xóa dấu '!' ở đây
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} else {
  console.error("Không tìm thấy phần tử 'root' trong HTML. Hãy kiểm tra tệp index.html.");
}