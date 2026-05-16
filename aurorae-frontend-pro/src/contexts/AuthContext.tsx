import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { message } from 'antd';
import axios from 'axios';

interface AuthUser {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'aurorae_auth';

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

  const login = (userData: AuthUser) => {
    setUser(userData);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    message.success(`欢迎回来，${userData.username}！`);
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
      localStorage.removeItem(AUTH_STORAGE_KEY);
      message.info('已成功退出登录');
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
