import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { message } from 'antd';
import axios from 'axios';

export interface AuthUser {
  id: string;
  username: string;
  avatar?: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  authChecking: boolean;
  login: (user: AuthUser) => void;
  updateUser: (user: AuthUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'aurorae_auth';

const isAuthRejected = (status?: number, code?: number | string) => {
  const normalizedCode = Number(code);
  return status === 401 || status === 403 || normalizedCode === 401 || normalizedCode === 403;
};

// 同步从localStorage读取认证信息
const getStoredAuth = (): AuthUser | null => {
  try {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedAuth) {
      return JSON.parse(storedAuth);
    }
  } catch (error) {
    console.error('解析认证信息失败:', error);
  }
  return null;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 初始化时立即从localStorage读取，不等待useEffect
  const [user, setUser] = useState<AuthUser | null>(getStoredAuth);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const verifyStoredAuth = async () => {
      const storedUser = getStoredAuth();
      if (!storedUser) {
        setAuthChecking(false);
        return;
      }

      try {
        const { data: response } = await axios.get('/auth/me', {
          withCredentials: true
        });
        if (cancelled) return;

        if (response?.code === 200 && response.data) {
          setUser(response.data);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response.data));
        } else if (isAuthRejected(undefined, response?.code)) {
          setUser(null);
          localStorage.removeItem(AUTH_STORAGE_KEY);
        } else {
          setUser(storedUser);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(storedUser));
        }
      } catch (error) {
        if (cancelled) return;
        console.warn('登录状态校验失败:', error);
        if (axios.isAxiosError(error) && isAuthRejected(error.response?.status, error.response?.data?.code)) {
          setUser(null);
          localStorage.removeItem(AUTH_STORAGE_KEY);
        } else {
          setUser(storedUser);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(storedUser));
        }
      } finally {
        if (!cancelled) {
          setAuthChecking(false);
        }
      }
    };

    verifyStoredAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = (userData: AuthUser) => {
    setUser(userData);
    setAuthChecking(false);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    message.success(`欢迎回来，${userData.username}！`);
  };

  const updateUser = (userData: AuthUser) => {
    setUser(userData);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout', {}, {
        withCredentials: true
      });
    } catch (error) {
      console.error('登出请求失败:', error);
    } finally {
      setUser(null);
      setAuthChecking(false);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      message.info('已成功退出登录');
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    authChecking,
    login,
    updateUser,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
