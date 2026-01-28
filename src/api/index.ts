import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { isEncryptionEnabled, createEncryption } from '../utils/encryption-optional';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

class ApiClient {
  private client: AxiosInstance;
  private encryption: any = null;

  constructor() {
    // 调试：检查加密配置
    console.log('=== 加密配置调试 ===');

    // 初始化加密（从后端获取密钥）
    this.initializeEncryption();

    this.client = axios.create({
      baseURL: '/api/v1',
      timeout: 30000,
    });

    this.client.interceptors.request.use(async (config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // 调试：输出请求信息
      console.log('=== 请求拦截器 ===');
      console.log('URL:', config.url);
      console.log('Method:', config.method);
      console.log('Data:', config.data);
      console.log('DataType:', typeof config.data);
      console.log('Has encryption:', !!this.encryption);

      // 加密请求体（如果启用加密且存在data）
      // 只有当真正加密了请求体时，才设置 X-Encrypted: true
      // 这样可以避免后端尝试解密未加密的数据

      // 情况1: 启用了加密且有需要加密的请求体（非 GET 请求，data 是对象）
      if (this.encryption && config.data && typeof config.data === 'object' && config.method !== 'get') {
        console.log('尝试加密请求体...');
        try {
          const encrypted = this.encryption.encryptJSON(config.data);
          console.log('加密成功，原始长度:', JSON.stringify(config.data).length, '加密后长度:', encrypted.length);
          config.data = encrypted;
          config.headers['X-Encrypted'] = 'true';
          console.log('已设置 X-Encrypted: true（请求体已加密）');
        } catch (error) {
          console.warn('加密请求失败，使用未加密请求:', error);
          // 加密失败，不设置加密头，继续发送未加密的请求
        }
      }
      // 情况2: 启用了加密但没有需要加密的请求体（GET 请求或无请求体或非对象类型）
      else if (this.encryption && (!config.data || config.method === 'get' || typeof config.data !== 'object')) {
        // 设置加密头但不加密请求体，只让后端知道需要加密响应
        config.headers['X-Encrypted'] = 'true';
        console.log('已设置 X-Encrypted: true（仅加密响应，请求体未加密）');
      }
      // 情况3: 加密未启用
      else {
        console.log('加密未启用，跳过加密处理');
      }

      return config;
    });

    this.client.interceptors.response.use(
      (response) => {
        // 调试：输出响应信息
        console.log('=== 响应拦截器 ===');
        console.log('URL:', response.config.url);
        console.log('Status:', response.status);
        console.log('Has encryption:', !!this.encryption);
        console.log('Response headers:', JSON.stringify(response.headers, null, 2));
        console.log('x-encrypted value:', response.headers['x-encrypted']);
        console.log('Response data type:', typeof response.data);

        // 解密响应体（如果启用加密且响应头标记为加密）
        if (this.encryption && response.headers['x-encrypted'] === 'true') {
          console.log('检测到加密响应，开始解密...');
          try {
            const decrypted = this.encryption.decryptJSON(response.data);
            console.log('解密成功');
            response.data = decrypted;
          } catch (error) {
            console.warn('解密响应失败:', error);
          }
        } else {
          console.log('未检测到加密响应头，跳过解密');
        }
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('current_user');
          window.location.reload();
        }
        return Promise.reject(new Error(error.response?.data?.message || error.message));
      }
    );
  }

  /**
   * 初始化加密（从后端获取密钥）
   */
  private async initializeEncryption() {
    try {
      const enabled = await isEncryptionEnabled();
      console.log('后端加密启用状态:', enabled);

      if (enabled) {
        this.encryption = await createEncryption();
        if (this.encryption) {
          console.log('✓ API加密已启用（密钥从后端获取）');
        } else {
          console.log('✗ 创建加密实例失败');
        }
      } else {
        console.log('✗ 后端未启用加密');
      }
    } catch (error) {
      console.error('初始化加密失败:', error);
      this.encryption = null;
    }
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async getPublic<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, {
      ...config,
      headers: {
        ...config?.headers,
        // 不添加 Authorization header，保持公开访问
      }
    });
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }
}

export const api = new ApiClient();

// API 方法定义
export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ token: string; user: any }>('/auth/login', { username, password }),
  getCurrentUser: () => api.get<any>('/auth/me'),
  changePassword: (oldPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { old_password: oldPassword, new_password: newPassword }),
};

export const detectApi = {
  detect: (text: string, category?: string, withPos: boolean = true, useAI: boolean = false) =>
    api.post('/detect', { text, category: category || undefined, with_pos: withPos, use_ai: useAI }),
  detectAll: (text: string, withPos: boolean = true, useAI: boolean = false) =>
    api.post('/detect/all', { text, with_pos: withPos, use_ai: useAI }),
  filter: (text: string, category?: string) =>
    api.post('/filter', { text, category: category || undefined }),
  suggest: (text: string) => api.post('/suggest', { text }),
  suggestWord: (word: string) => api.post('/suggest/word', { word }),
};

export const wordsApi = {
  get: (params?: { page?: number; page_size?: number; category?: string; keyword?: string }) =>
    api.get<{ total_count: number; page: number; page_size: number; total_pages: number; has_next: boolean; has_prev: boolean; category_count: Record<string, number>; words: Array<{ word: string; category: string; reason?: string }> }>('/words', { params }),
  add: (words: Record<string, string>, reasons?: Record<string, string>) =>
    api.post<{ added_count: number }>('/words', { words, reasons: reasons || undefined }),
  delete: (words: string[]) => api.delete<{ removed_count: number }>('/words', { data: { words } }),
  clear: () => api.delete<number>('/words/clear'),
};

export const categoriesApi = {
  get: () => api.get<Record<string, string>>('/categories'),
};

export const configApi = {
  get: () => api.get<any>('/config'),
  getSystemTitle: () => api.getPublic<{ title: string; show_default_password: boolean }>('/system/title'),
  update: (data: any) => api.post('/config/update', data),
  reloadConfig: () => api.post('/config/reload'),
  restart: () => api.post('/config/restart'),
};

export const usersApi = {
  list: (params?: { page?: number; page_size?: number }) =>
    api.get<any>('/users', { params }),
  create: (data: { username: string; password: string; roles: string[]; is_active: boolean }) =>
    api.post('/users', data),
  delete: (userId: string) => api.delete(`/users/${userId}`),
  update: (userId: string, data: any) => api.put(`/users/${userId}`, data),
  getMyLoginLogs: (params?: { limit?: number }) =>
    api.get<{ logs: any[]; total: number }>('/auth/login-logs', { params }),
  getAllLoginLogs: (params?: { page?: number; page_size?: number; username?: string }) =>
    api.get<{ logs: any[]; total: number; page: number; page_size: number }>('/admin/login-logs', { params }),
};

export const accessKeysApi = {
  list: () => api.get<any>('/access-keys'),
  create: (data: {
    name: string;
    description?: string;
    permissions?: Array<{ resource: string; actions: string[] }>;
    ip_whitelist?: string[];
    rate_limit?: number;
    expires_at?: string | null;
  }) => api.post<any>('/access-keys', data),
  get: (id: string) => api.get<any>(`/access-keys/${id}`),
  update: (id: string, data: any) => api.put<any>(`/access-keys/${id}`, data),
  delete: (id: string) => api.delete<any>(`/access-keys/${id}`),
  disable: (id: string) => api.post<any>(`/access-keys/${id}/disable`),
  enable: (id: string) => api.post<any>(`/access-keys/${id}/enable`),
};

export const healthApi = {
  check: () => api.get('/health'),
};

export const logsApi = {
  getStats: (startTime: string, endTime: string, groupBy?: string) =>
    api.get<{ total_requests: number; sensitive_requests: number; category_stats: Record<string, number> }>('/logs/stats', {
      params: { start_time: startTime, end_time: endTime, group_by: groupBy }
    }),
};
