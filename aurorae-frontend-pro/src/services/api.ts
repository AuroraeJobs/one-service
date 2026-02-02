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

// 导出axios实例，方便其他地方使用
export default apiClient;