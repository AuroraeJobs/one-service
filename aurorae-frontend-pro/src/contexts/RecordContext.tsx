import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import { recordApi } from '../services/api';

// 定义记录类型
interface RecordItem {
  code: string;
  date: string;
  week: string;
  red: string;
  blue: string;
  sales: string;
  poolmoney: string;
  line?: string;
}

// 定义Context类型
interface RecordContextType {
  records: RecordItem[];
  allRecords: string | string[];
  loading: boolean;
  error: string | null;
  refreshRecords: () => Promise<void>;
}

// 创建Context
const RecordContext = createContext<RecordContextType | undefined>(undefined);

// 定义ProviderProps类型
interface RecordProviderProps {
  children: ReactNode;
}

// 创建Provider组件
export const RecordProvider: React.FC<RecordProviderProps> = ({ children }) => {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [allRecords, setAllRecords] = useState<string | string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 从API获取所有记录
  const fetchAllRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 只调用records接口，获取所有记录
      const allRecordsData = await recordApi.getAllRecords();
      
      // 设置所有记录
      setAllRecords(allRecordsData);
      
      // 初始化为空数组，后续可以根据需要从allRecords中过滤数据
      setRecords([]);
    } catch (err) {
      console.error('获取记录失败:', err);
      setError('获取记录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 刷新记录数据
  const refreshRecords = async () => {
    await fetchAllRecords();
  };

  // 组件初始化时获取数据
  useEffect(() => {
    fetchAllRecords();
  }, []);

  // Context值
  const contextValue: RecordContextType = {
    records,
    allRecords,
    loading,
    error,
    refreshRecords
  };

  return (
    <RecordContext.Provider value={contextValue}>
      {children}
    </RecordContext.Provider>
  );
};

// 自定义Hook，方便组件使用Context
export const useRecordContext = () => {
  const context = useContext(RecordContext);
  if (context === undefined) {
    throw new Error('useRecordContext必须在RecordProvider内部使用');
  }
  return context;
};
