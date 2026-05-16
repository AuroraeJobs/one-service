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
  line: string;
}

interface RecordListResponse {
  code: string;
  date: string;
  week: string;
  red: string;
  blue: string;
  sales: string;
  poolmoney: string;
  line: string;
}

interface ChatResponse {
  response: string;
}

// 创建axios实例
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 180000, // 3分钟
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
  find: (params: { issueStart?: string; issueEnd?: string; lineStart?: string; lineEnd?: string; dayStart?: string; dayEnd?: string; name?: string }): Promise<RecordListResponse[]> => {
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
  // 更新记录
  update: (): Promise<void> => {
    return apiClient.get('/record/update');
  },
};

// AI聊天相关API
export const aiApi = {
  // 调用本地AI模型聊天
  chat: async (content: string, model: string = 'qwen3:8b'): Promise<string> => {
    try {
      const data = await apiClient.post('/chat/local/completions', {
        prompt: content,
        model: model
      }) as { response?: string };
      
      if (data && data.response) {
        return data.response;
      }
      return 'AI模型未返回有效响应';
    } catch (error) {
      console.error('AI聊天请求失败:', error);
      return 'AI模型请求失败，请稍后重试';
    }
  },
  
  // 通过我们的后端服务调用AI模型（备选方案）
  chatThroughBackend: async (content: string): Promise<string> => {
    try {
      const data = await apiClient.post('/chat/local/completions', {
        prompt: content
      }) as ChatResponse;
      return data.response;
    } catch (error) {
      console.error('后端AI聊天请求失败:', error);
      return '后端服务请求失败，请稍后重试';
    }
  },
  
  // 获取本地可调用的模型列表
  getModelList: async (): Promise<any[]> => {
    try {
      const data = await apiClient.get('/chat/local/models') as { models?: any[] };
      return data.models || [];
    } catch (error) {
      console.error('获取模型列表失败:', error);
      return [];
    }
  }
};

// 认证相关API
export const authApi = {
  // 登录
  login: async (username: string, password: string): Promise<{ success: boolean; message?: string; user?: any }> => {
    try {
      const response = await apiClient.post('/auth/login', {
        username,
        password
      }) as any;
      
      if (response.code === 200) {
        return {
          success: true,
          user: response.data,
          message: response.message
        };
      } else {
        return {
          success: false,
          message: response.message || '登录失败'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || '登录失败'
      };
    }
  },

  // 注册
  register: async (userData: { username: string; password: string; email?: string; phone?: string }): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiClient.post('/auth/register', userData) as any;
      
      if (response.code === 200) {
        return {
          success: true,
          message: response.message
        };
      } else {
        return {
          success: false,
          message: response.message || '注册失败'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || '注册失败'
      };
    }
  },

  // 获取当前用户信息
  getCurrentUser: async (): Promise<any> => {
    try {
      const response = await apiClient.get('/auth/me') as any;
      if (response.code === 200) {
        return response.data;
      }
      throw new Error(response.message);
    } catch (error) {
      throw error;
    }
  },

  // 登出
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('登出失败:', error);
    }
  }
};

// 充电记录相关API
export interface ChargeRecord {
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  chargerType: string;
  chargeDuration: number;
  chargeAmount: number;
  electricityCost: number;
  serviceCost: number;
  discountAmount?: number;
  notes?: string;
  batteryCapacity?: number;
  provider?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface ChargeLocationOption {
  label: string;
  value: string;
  provider?: string;
}

export interface ChargeProviderOption {
  label: string;
  value: string;
}

export interface ChargeStatistics {
  totalCharges: number;
  totalEnergy: number;
  totalCost: number;
  totalElectricityCost: number;
  totalServiceCost: number;
  avgDuration: number;
}

export const chargeRecordApi = {
  // 添加充电记录
  save: (record: Omit<ChargeRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChargeRecord> => {
    return apiClient.post('/charge-record', record);
  },

  // 更新充电记录
  update: (record: ChargeRecord): Promise<ChargeRecord> => {
    return apiClient.put('/charge-record', record);
  },

  // 删除充电记录
  delete: (id: string): Promise<void> => {
    return apiClient.delete(`/charge-record/${id}`);
  },

  // 根据ID查询
  findById: (id: string): Promise<ChargeRecord> => {
    return apiClient.get(`/charge-record/${id}`);
  },

  // 查询所有记录
  findAll: (): Promise<ChargeRecord[]> => {
    return apiClient.get('/charge-record');
  },

  // 按日期范围查询
  findByDateRange: (startDate: string, endDate: string): Promise<ChargeRecord[]> => {
    return apiClient.get('/charge-record/date-range', {
      params: { startDate, endDate }
    });
  },

  // 按充电方式查询
  findByChargerType: (chargerType: string): Promise<ChargeRecord[]> => {
    return apiClient.get('/charge-record/charger-type', {
      params: { chargerType }
    });
  },

  // 按地点查询
  findByLocation: (location: string): Promise<ChargeRecord[]> => {
    return apiClient.get('/charge-record/location', {
      params: { location }
    });
  },

  // 获取统计数据
  getStatistics: (): Promise<ChargeStatistics> => {
    return apiClient.get('/charge-record/statistics');
  },
  
  // 获取充电地点列表
  getLocations: (): Promise<ChargeLocationOption[]> => {
    return apiClient.get('/charge-record/locations');
  },

  // 获取充电提供方列表
  getProviders: (): Promise<ChargeProviderOption[]> => {
    return apiClient.get('/charge-record/providers');
  }
};

// 导出axios实例，方便其他地方使用
export default apiClient;