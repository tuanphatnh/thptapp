// --- TÁI SỬ DỤNG: Hàm gọi API (fetchData) ---
export const fetchData = async (url, method = 'GET', data = null, token = null) => {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }

  const config = {
    method: method,
    headers: headers,
    body: data ? JSON.stringify(data) : null,
  };

  try {
    const response = await fetch(`http://localhost:3001${url}`, config);

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('appUser'); 
      window.location.reload(); 
    }
    
    const result = await response.json().catch(() => {
        if (response.ok) return { success: true, message: 'Hành động thành công' };
        return { message: `Lỗi ${response.status} - Phản hồi không phải JSON.` };
    });

    if (!response.ok) {
      console.error(`Lỗi API (${response.status}) tại ${url}:`, result.message);
      throw new Error(result.message || `Lỗi ${response.status}`);
    }

    return result;

  } catch (error) {
    console.error(`Lỗi mạng hoặc API tại ${url}:`, error.message);
    if (error.message.includes('Failed to fetch')) {
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend (server.js) có đang chạy không.');
    }
    throw error;
  }
};