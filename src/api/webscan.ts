import { api } from './index';

export interface ScanConfig {
  target_url: string;
  max_depth?: number;
  max_pages?: number;
  timeout?: number;
  user_agent?: string;
  concurrency?: number;
  enable_sensitive?: boolean;
  enable_tech_errors?: boolean;
  enable_security?: boolean;
  enable_compliance?: boolean;
  enable_cascade?: boolean;      // 级联检测
  enable_ai?: boolean;           // AI检测
  exclude_patterns?: string[];
  include_patterns?: string[];
  follow_redirects?: boolean;
  max_redirects?: number;
}

export interface ScanTask {
  id: string;
  config: ScanConfig;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  start_time?: string;
  end_time?: string;
  created_at: string;
  created_by: string;
  error?: string;
}

export interface PageError {
  type: string;
  severity: string;
  title: string;
  description: string;
  location: string;
  evidence: string;
  suggestion: string;
}

export interface PageResult {
  url: string;
  title: string;
  status_code: number;
  response_time: number;
  depth: number;
  errors: PageError[];
  links: LinkInfo[];
  resources: ResourceInfo[];
  scanned_at: string;
}

export interface LinkInfo {
  url: string;
  text: string;
  is_external: boolean;
  is_valid: boolean;
  status_code: number;
}

export interface ResourceInfo {
  url: string;
  type: string;
  is_valid: boolean;
  status_code: number;
  size: number;
}

export interface ScanSummary {
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
  top_errors: PageError[];
}

export interface SensitiveSummary {
  total_words: number;
  by_category: Record<string, number>;
  by_page: Record<string, number>;
  top_words: Array<{
    word: string;
    category: string;
    count: number;
  }>;
}

export interface SecuritySummary {
  vulnerabilities: number;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
  details: Array<{
    type: string;
    severity: string;
    url: string;
    description: string;
    evidence: string;
    suggestion: string;
  }>;
}

export interface ComplianceSummary {
  score: number;
  issues: Array<{
    type: string;
    severity: string;
    description: string;
    location: string;
    suggestion: string;
  }>;
  has_privacy_policy: boolean;
  has_icp: boolean;
  has_cookie_consent: boolean;
}

export interface ScanReport {
  task_id: string;
  target_url: string;
  start_time: string;
  end_time: string;
  duration: number;
  total_pages: number;
  total_errors: number;
  total_links: number;
  total_resources: number;
  pages: PageResult[];
  summary: ScanSummary;
  sensitive_summary?: SensitiveSummary;
  security_summary?: SecuritySummary;
  compliance_summary?: ComplianceSummary;
}

// 创建扫描任务
export const createScanTask = async (config: ScanConfig): Promise<ScanTask> => {
  const response = await api.post<ScanTask>('/webscan/tasks', config);
  return response.data;
};

// 获取任务列表
export const getScanTasks = async (): Promise<ScanTask[]> => {
  const response = await api.get<ScanTask[]>('/webscan/tasks');
  return response.data;
};

// 获取任务详情
export const getScanTask = async (taskId: string): Promise<ScanTask> => {
  const response = await api.get<ScanTask>(`/webscan/tasks/${taskId}`);
  return response.data;
};

// 启动扫描
export const startScanTask = async (taskId: string): Promise<void> => {
  await api.post(`/webscan/tasks/${taskId}/start`);
};

// 取消扫描
export const cancelScanTask = async (taskId: string): Promise<void> => {
  await api.post(`/webscan/tasks/${taskId}/cancel`);
};

// 获取扫描进度
export const getScanProgress = async (taskId: string): Promise<{
  task_id: string;
  status: string;
  progress: number;
}> => {
  const response = await api.get<{
    task_id: string;
    status: string;
    progress: number;
  }>(`/webscan/tasks/${taskId}/progress`);
  return response.data;
};

// 获取扫描报告
export const getScanReport = async (taskId: string): Promise<ScanReport> => {
  const response = await api.get<ScanReport>(`/webscan/tasks/${taskId}/report`);
  return response.data;
};

// 导出报告
export const exportScanReport = async (
  taskId: string,
  format: 'json' | 'html' | 'markdown' | 'excel' = 'json',
  filters?: string[]
): Promise<Blob> => {
  // 对于文件下载，需要直接使用 axios，但仍然需要添加认证头
  const token = localStorage.getItem('auth_token');
  
  let url = `/api/v1/webscan/tasks/${taskId}/report/export?format=${format}`;
  if (filters && filters.length > 0) {
    url += `&filter=${filters.join(',')}`;
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.blob();
};

// 删除任务
export const deleteScanTask = async (taskId: string): Promise<void> => {
  await api.delete(`/webscan/tasks/${taskId}`);
};
