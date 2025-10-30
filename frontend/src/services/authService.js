import api from './api';

// Auth Service with enhanced authentication features
class AuthService {
  // Login with email or username and password
  async login(credentials, rememberMe = false) {
    try {
      // credentials: { email, username, password }
      let payload = { password: credentials.password, rememberMe };
      if (credentials.email) {
        payload.email = credentials.email.toLowerCase().trim();
      } else if (credentials.username) {
        payload.username = credentials.username;
      }
      const response = await api.post('/auth/login', payload);

      const { token, refreshToken, user, expiresIn } = response.data;

      if (token) {
        // Store tokens and user data
        this.setTokens(token, refreshToken, expiresIn, rememberMe);
        this.setUser(user);
        // Set API header for future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Register new user
  async register(userData) {
    try {
      const response = await api.post('/auth/register', {
        ...userData,
        email: userData.email.toLowerCase().trim()
      });

      const { token, refreshToken, user, expiresIn } = response.data;

      if (token) {
        // Auto-login after successful registration
        this.setTokens(token, refreshToken, expiresIn);
        this.setUser(user);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Logout user
  async logout() {
    try {
      const refreshToken = this.getRefreshToken();
      
      if (refreshToken) {
        // Notify server about logout
        await api.post('/auth/logout', { refreshToken }).catch(console.error);
      }

      // Clear local storage
      this.clearAuth();
      
      // Remove API header
      delete api.defaults.headers.common['Authorization'];
      
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      // Always clear local auth even if server request fails
      this.clearAuth();
      delete api.defaults.headers.common['Authorization'];
      return true;
    }
  }

  // Refresh access token
  async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/auth/refresh', { refreshToken });
      const { token, refreshToken: newRefreshToken, expiresIn } = response.data;

      if (token) {
        const storage = this.isTokenPersistent() ? localStorage : sessionStorage;
        this.setTokens(token, newRefreshToken, expiresIn, this.isTokenPersistent());
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      return response.data;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear auth if refresh fails
      this.clearAuth();
      throw error;
    }
  }

  // Get current user profile
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me');
      this.setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(userData) {
    try {
      const response = await api.put('/auth/profile', userData);
      this.setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  // Forgot password
  async forgotPassword(email) {
    try {
      const response = await api.post('/auth/forgot-password', {
        email: email.toLowerCase().trim()
      });
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  // Reset password
  async resetPassword(token, newPassword) {
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        password: newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  // Verify email
  async verifyEmail(token) {
    try {
      const response = await api.post('/auth/verify-email', { token });
      return response.data;
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  }

  // Resend verification email
  async resendVerificationEmail(email) {
    try {
      const response = await api.post('/auth/resend-verification', {
        email: email.toLowerCase().trim()
      });
      return response.data;
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  }

  // Token and storage management
  setTokens(accessToken, refreshToken, expiresIn, persistent = false) {
    const storage = persistent ? localStorage : sessionStorage;
    const expirationTime = new Date().getTime() + (expiresIn * 1000);
    
    storage.setItem('accessToken', accessToken);
    // Also write legacy key 'token' for compatibility with other helpers
    storage.setItem('token', accessToken);
    storage.setItem('tokenExpiration', expirationTime.toString());
    
    if (refreshToken) {
      storage.setItem('refreshToken', refreshToken);
    }
    
    // Mark if tokens should persist
    if (persistent) {
      localStorage.setItem('tokenPersistent', 'true');
    }
  }

  getAccessToken() {
    // Support both modern 'accessToken' key and legacy 'token' key
    return (
      localStorage.getItem('accessToken') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('accessToken') ||
      sessionStorage.getItem('token') ||
      null
    );
  }

  getRefreshToken() {
    return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
  }

  isTokenPersistent() {
    return localStorage.getItem('tokenPersistent') === 'true';
  }

  isTokenExpired() {
    const expiration = localStorage.getItem('tokenExpiration') || sessionStorage.getItem('tokenExpiration');
    if (!expiration) return true;
    
    return new Date().getTime() > parseInt(expiration);
  }

  // User data management
  setUser(userData) {
    const storage = this.isTokenPersistent() ? localStorage : sessionStorage;
    storage.setItem('user', JSON.stringify(userData));
  }

  getUser() {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Clear all auth data
  clearAuth() {
    // Clear from both storages
    const keysToRemove = ['accessToken', 'refreshToken', 'tokenExpiration', 'user', 'tokenPersistent'];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }

  // Auth status checks
  isAuthenticated() {
    const token = this.getAccessToken();
    const user = this.getUser();
    return !!(token && user && !this.isTokenExpired());
  }

  isAdmin() {
    const user = this.getUser();
    return user && (user.role === 'admin' || user.is_admin);
  }

  getUserRole() {
    const user = this.getUser();
    return user?.role || (user?.is_admin ? 'admin' : 'user');
  }

  // Initialize auth on app start
  initializeAuth() {
    const token = this.getAccessToken();
    const user = this.getUser();

    // If token exists, set Authorization header so subsequent requests (including /auth/me)
    // include the token. We try to populate `user` by fetching /auth/me when missing.
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // If we already have a user and token not expired, return immediately
      if (user && !this.isTokenExpired()) {
        return { token, user };
      }

      // Try to fetch current user to populate local storage
      (async () => {
        try {
          const resp = await api.get('/auth/me');
          if (resp && resp.data) {
            this.setUser(resp.data);
          }
        } catch (err) {
          // If fetching /auth/me fails with 401/403, try refresh once
          try {
            await this.refreshToken();
            const retry = await api.get('/auth/me');
            if (retry && retry.data) this.setUser(retry.data);
          } catch (err2) {
            // final fallback: clear auth if we cannot validate token
            this.clearAuth();
            delete api.defaults.headers.common['Authorization'];
          }
        }
      })();

      return { token, user: user || null };
    }

    return null;
  }

  // Auto-logout on token expiration
  setupTokenExpirationCheck() {
    const checkInterval = 60000; // Check every minute
    
    setInterval(() => {
      if (this.isTokenExpired() && this.getAccessToken()) {
        console.log('Token expired, attempting refresh...');
        this.refreshToken().catch(() => {
          console.log('Token refresh failed, logging out...');
          this.logout();
          // Redirect to login page
          window.location.href = '/login';
        });
      }
    }, checkInterval);
  }
}

// Create singleton instance
const authService = new AuthService();

// Export individual methods for backward compatibility
export const login = (email, password, rememberMe) => authService.login(email, password, rememberMe);
export const register = (userData) => authService.register(userData);
export const logout = () => authService.logout();
export const getCurrentUser = () => authService.getCurrentUser();
export const updateProfile = (userData) => authService.updateProfile(userData);
export const changePassword = (current, newPassword) => authService.changePassword(current, newPassword);
export const forgotPassword = (email) => authService.forgotPassword(email);
export const resetPassword = (token, password) => authService.resetPassword(token, password);
export const verifyEmail = (token) => authService.verifyEmail(token);
export const resendVerificationEmail = (email) => authService.resendVerificationEmail(email);
export const refreshToken = () => authService.refreshToken();
export const isAuthenticated = () => authService.isAuthenticated();
export const isAdmin = () => authService.isAdmin();
export const getUser = () => authService.getUser();
export const getUserRole = () => authService.getUserRole();
export const initializeAuth = () => authService.initializeAuth();

// Export service instance
export default authService;
