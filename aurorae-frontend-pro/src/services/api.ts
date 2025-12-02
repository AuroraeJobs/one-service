// API服务配置
import axios from 'axios';

// 类型定义
interface LastRecordResponse {
  code: string;
  date: string;
  week: string;
  red: string;
  blue: string;
  sales: string;
  poolmoney: string;
}

interface RecordListResponse {
  code: string;
  date: string;
  week: string;
  red: string;
  blue: string;
  sales: string;
  poolmoney: string;
}

// 创建axios实例
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证信息等
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API请求失败:', error);
    return Promise.reject(error);
  }
);

// 记录相关API
export const recordApi = {
  // 查询记录列表
  find: (params: any): Promise<RecordListResponse[]> => {
    return apiClient.post('/record/find', params);
  },
  // 获取最新记录
  getLast: (): Promise<LastRecordResponse> => {
    return apiClient.get('/record/last');
  },
  // 获取第一条记录
  getFirst: (): Promise<LastRecordResponse> => {
    return apiClient.get('/record/first');
  },
  // 获取所有记录（用于统计分析）
  getAllRecords: (): Promise<string | string[]> => {
    return apiClient.get('/record/records');
  },
};

// 导出axios实例，方便其他地方使用
export default apiClient;