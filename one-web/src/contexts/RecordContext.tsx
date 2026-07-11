import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import { lotteryRecordApi, type LotteryDraw } from '../services/api';

const DRAW_PAGE_SIZE = 500;

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
  lotteryDraws: LotteryDraw[];
  loading: boolean;
  error: string | null;
  refreshRecords: () => Promise<void>;
}

// 创建Context
const RecordContext = createContext<RecordContextType | undefined>(undefined);

const compareDrawsAsc = (left: LotteryDraw, right: LotteryDraw) => {
  const leftPeriod = typeof left.period === 'number' ? left.period : Number.NaN;
  const rightPeriod = typeof right.period === 'number' ? right.period : Number.NaN;

  if (Number.isFinite(leftPeriod) && Number.isFinite(rightPeriod) && leftPeriod !== rightPeriod) {
    return leftPeriod - rightPeriod;
  }

  return (left.issue || '').localeCompare(right.issue || '', undefined, { numeric: true });
};

const toCompactRecord = (draw: LotteryDraw) => {
  if (draw.raw && /^\d{14}$/.test(draw.raw)) {
    return draw.raw;
  }

  if (draw.redNumbers?.length !== 6 || !draw.blueNumber) {
    return null;
  }

  return `${draw.redNumbers.join('')}${draw.blueNumber}`;
};

const loadAllDraws = async () => {
  const allDraws: LotteryDraw[] = [];
  let page = 0;

  while (true) {
    const draws = await lotteryRecordApi.draws({ page, size: DRAW_PAGE_SIZE });
    allDraws.push(...draws);

    if (draws.length < DRAW_PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  return allDraws.sort(compareDrawsAsc);
};

// 定义ProviderProps类型
interface RecordProviderProps {
  children: ReactNode;
}

// 创建Provider组件
export const RecordProvider: React.FC<RecordProviderProps> = ({ children }) => {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [allRecords, setAllRecords] = useState<string | string[]>([]);
  const [lotteryDraws, setLotteryDraws] = useState<LotteryDraw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 从API获取所有记录
  const fetchAllRecords = async (throwOnError = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // 新数据源使用标准彩票开奖记录 DTO，兼容层继续输出旧 14 位 compact records 给现有统计页。
      const draws = await loadAllDraws();
      const allRecordsData = draws
        .map(toCompactRecord)
        .filter((record): record is string => Boolean(record));
      
      // 设置所有记录
      setLotteryDraws(draws);
      setAllRecords(allRecordsData);
      
      // 初始化为空数组，后续可以根据需要从allRecords中过滤数据
      setRecords([]);
    } catch (err) {
      console.error('获取记录失败:', err);
      setError('获取记录失败，请稍后重试');
      if (throwOnError) {
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  // 刷新记录数据
  const refreshRecords = async () => {
    await fetchAllRecords(true);
  };

  // 组件初始化时获取数据
  useEffect(() => {
    fetchAllRecords();
  }, []);

  // Context值
  const contextValue: RecordContextType = {
    records,
    allRecords,
    lotteryDraws,
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
// eslint-disable-next-line react-refresh/only-export-components
export const useRecordContext = () => {
  const context = useContext(RecordContext);
  if (context === undefined) {
    throw new Error('useRecordContext必须在RecordProvider内部使用');
  }
  return context;
};
