import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token to requests - support both 'accessToken' and legacy 'token' keys
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || sessionStorage.getItem('accessToken') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };
    
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = new Date() - response.config.metadata.startTime;
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`);
    
    return response;
  },
  (error) => {
    const { response, request, config } = error;
    
    // Calculate request duration if available
    const duration = config?.metadata ? new Date() - config.metadata.startTime : 0;
    
    if (response) {
      // Server responded with error status
      const { status, data } = response;
      console.error(`❌ API Error ${status}: ${config?.method?.toUpperCase()} ${config?.url} (${duration}ms)`, data);
      
      // Handle specific status codes
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Only redirect if not already on login page
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;
          
        case 403:
          // Forbidden - show access denied message
          console.error('Access denied. Insufficient permissions.');
          break;
          
        case 404:
          // Not Found
          console.error('Resource not found.');
          break;
          
        case 422:
          // Validation Error
          console.error('Validation error:', data.errors || data.message);
          break;
          
        case 429:
          // Too Many Requests
          console.error('Too many requests. Please try again later.');
          break;
          
        case 500:
          // Internal Server Error
          console.error('Server error. Please try again later.');
          break;
          
        default:
          console.error('An unexpected error occurred.');
      }
      
      // Enhance error object with user-friendly message
      const enhancedError = {
        ...error,
        userMessage: getUserFriendlyMessage(status, data),
        statusCode: status,
        serverMessage: data?.message || 'Unknown error',
      };
      
      return Promise.reject(enhancedError);
    } else if (request) {
      // Network error or no response received
      console.error('❌ Network Error:', error.message);
      
      const networkError = {
        ...error,
        userMessage: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.',
        isNetworkError: true,
      };
      
      return Promise.reject(networkError);
    } else {
      // Something else happened
      console.error('❌ Request Setup Error:', error.message);
      return Promise.reject(error);
    }
  }
);

// Helper function to get user-friendly error messages
function getUserFriendlyMessage(status, data) {
  const message = data?.message || '';
  
  switch (status) {
    case 400:
      return 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
    case 401:
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    case 403:
      return 'Bạn không có quyền thực hiện hành động này.';
    case 404:
      return 'Không tìm thấy thông tin yêu cầu.';
    case 422:
      return message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
    case 429:
      return 'Quá nhiều yêu cầu. Vui lòng thử lại sau.';
    case 500:
      return 'Lỗi hệ thống. Vui lòng thử lại sau.';
    case 503:
      return 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.';
    default:
      return message || 'Có lỗi xảy ra. Vui lòng thử lại.';
  }
}

// API helper methods
export const apiHelpers = {
  // Set auth token
  setAuthToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  },
  
  // Clear auth data
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
  
  // Get current user from storage
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },
  
  // Upload file with progress
  uploadFile: (url, formData, onUploadProgress) => {
    return api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onUploadProgress,
    });
  },
  
  // Download file
  downloadFile: (url, filename) => {
    return api.get(url, {
      responseType: 'blob',
    }).then(response => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
  }
};

export default api;
