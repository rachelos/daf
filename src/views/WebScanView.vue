<template>
  <div class="webscan-view">
    <a-tabs default-active-key="create">
      <a-tab-pane key="create" title="创建扫描">
        <a-card title="网站扫描配置" :bordered="false">
          <a-form :model="scanConfig" layout="vertical">
            <a-form-item label="目标网站URL" required>
              <a-input
                v-model="scanConfig.target_url"
                placeholder="https://example.com"
                allow-clear
              />
            </a-form-item>

            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="最大爬取深度">
                  <a-input-number
                    v-model="scanConfig.max_depth"
                    :min="1"
                    :max="10"
                    :default-value="3"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="最大页面数">
                  <a-input-number
                    v-model="scanConfig.max_pages"
                    :min="1"
                    :max="1000"
                    :default-value="100"
                  />
                </a-form-item>
              </a-col>
            </a-row>

            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="超时时间(秒)">
                  <a-input-number
                    v-model="scanConfig.timeout"
                    :min="5"
                    :max="300"
                    :default-value="30"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="并发数">
                  <a-input-number
                    v-model="scanConfig.concurrency"
                    :min="1"
                    :max="20"
                    :default-value="5"
                  />
                </a-form-item>
              </a-col>
            </a-row>

            <a-form-item label="扫描选项">
              <a-space>
                <a-checkbox v-model="scanConfig.enable_sensitive">
                  敏感词检测
                </a-checkbox>
                <a-checkbox v-model="scanConfig.enable_tech_errors">
                  技术错误检测
                </a-checkbox>
                <a-checkbox v-model="scanConfig.enable_security">
                  安全漏洞扫描
                </a-checkbox>
                <a-checkbox v-model="scanConfig.enable_compliance">
                  合规性检查
                </a-checkbox>
              </a-space>
            </a-form-item>

            <a-form-item label="高级检测选项">
              <a-space>
                <a-checkbox v-model="scanConfig.enable_cascade" :disabled="!scanConfig.enable_sensitive">
                  级联检测
                  <a-tooltip content="检测拼音、同音字、形近字、异体字等变形词（需在系统配置中启用）">
                    <icon-question-circle />
                  </a-tooltip>
                </a-checkbox>
                <a-checkbox v-model="scanConfig.enable_ai" :disabled="!scanConfig.enable_sensitive">
                  AI检测
                  <a-tooltip content="使用AI模型进行语义级别的敏感内容检测">
                    <icon-question-circle />
                  </a-tooltip>
                </a-checkbox>
              </a-space>
            </a-form-item>

            <a-form-item label="排除URL模式">
              <a-input-tag
                v-model="scanConfig.exclude_patterns"
                placeholder="输入要排除的URL模式，按回车添加"
              />
            </a-form-item>

            <a-form-item>
              <a-space>
                <a-button type="primary" @click="handleCreateTask" :loading="creating">
                  <template #icon>
                    <icon-plus />
                  </template>
                  创建扫描任务
                </a-button>
              </a-space>
            </a-form-item>
          </a-form>
        </a-card>
      </a-tab-pane>

      <a-tab-pane key="tasks" title="扫描任务">
        <a-card :bordered="false">
          <template #extra>
            <a-button @click="loadTasks">
              <template #icon>
                <icon-refresh />
              </template>
              刷新
            </a-button>
          </template>

          <a-table :data="tasks" :loading="loading" :pagination="false">
            <template #columns>
              <a-table-column title="任务ID" data-index="id" :width="280">
                <template #cell="{ record }">
                  <a-typography-text copyable>{{ record.id }}</a-typography-text>
                </template>
              </a-table-column>
              <a-table-column title="目标网站" data-index="config.target_url" :width="200" />
              <a-table-column title="状态" data-index="status" :width="120">
                <template #cell="{ record }">
                  <a-tag :color="getStatusColor(record.status)">
                    {{ getStatusText(record.status) }}
                  </a-tag>
                </template>
              </a-table-column>
              <a-table-column title="进度" data-index="progress" :width="150">
                <template #cell="{ record }">
                  <a-progress :percent="record.progress/100" :status="getProgressStatus(record.status)" />
                </template>
              </a-table-column>
              <a-table-column title="创建时间" data-index="created_at" :width="180">
                <template #cell="{ record }">
                  {{ formatTime(record.created_at) }}
                </template>
              </a-table-column>
              <a-table-column title="操作" :width="250">
                <template #cell="{ record }">
                  <a-space>
                    <a-button
                      v-if="record.status === 'pending'"
                      size="small"
                      type="primary"
                      @click="handleStartTask(record.id)"
                    >
                      启动
                    </a-button>
                    <a-button
                      v-if="record.status === 'running'"
                      size="small"
                      status="warning"
                      @click="handleCancelTask(record.id)"
                    >
                      取消
                    </a-button>
                    <a-button
                      v-if="record.status === 'completed'"
                      size="small"
                      type="outline"
                      @click="handleViewReport(record.id)"
                    >
                      查看报告
                    </a-button>
                    <a-button
                      size="small"
                      status="danger"
                      @click="handleDeleteTask(record.id)"
                    >
                      删除
                    </a-button>
                  </a-space>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </a-card>
      </a-tab-pane>
    </a-tabs>

    <!-- 报告查看对话框 -->
    <a-modal
      v-model:visible="reportVisible"
      title="扫描报告"
      :width="1200"
      :footer="false"
      unmount-on-close
    >
      <div v-if="report" class="report-content">
        <!-- 基本信息 -->
        <a-descriptions title="基本信息" :column="3" bordered>
          <a-descriptions-item label="目标网站">
            <a-link :href="report.target_url" target="_blank">
              {{ report.target_url }}
            </a-link>
          </a-descriptions-item>
          <a-descriptions-item label="扫描时间">
            {{ formatTime(report.start_time) }}
          </a-descriptions-item>
          <a-descriptions-item label="扫描耗时">
            {{ formatDuration(report.duration) }}
          </a-descriptions-item>
          <a-descriptions-item label="扫描页面数">
            {{ report.total_pages }}
          </a-descriptions-item>
          <a-descriptions-item label="发现问题数">
            <a-tag color="red">{{ report.total_errors }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="链接数量">
            {{ report.total_links }}
          </a-descriptions-item>
        </a-descriptions>

        <!-- 错误统计 -->
        <a-divider />
        <a-row :gutter="16">
          <a-col
            v-for="(count, type) in report.summary.by_type"
            :key="type"
            :span="6"
          >
            <a-statistic
              :title="getErrorTypeText(type)"
              :value="count"
              show-group-separator
            />
          </a-col>
        </a-row>

        <!-- 敏感词摘要 -->
        <div v-if="report.sensitive_summary">
          <a-divider />
          <a-card title="敏感词检测结果">
            <a-statistic title="发现敏感词" :value="report.sensitive_summary.total_words">
              <template #suffix>个</template>
            </a-statistic>
            <a-divider style="margin: 16px 0" />
            <a-table :data="report.sensitive_summary.top_words" :pagination="false">
              <template #columns>
                <a-table-column title="敏感词" data-index="word" />
                <a-table-column title="出现次数" data-index="count" />
              </template>
            </a-table>
          </a-card>
        </div>

        <!-- 安全摘要 -->
        <div v-if="report.security_summary">
          <a-divider />
          <a-card title="安全漏洞检测结果">
            <a-statistic title="发现漏洞" :value="report.security_summary.vulnerabilities">
              <template #suffix>个</template>
            </a-statistic>
            <a-divider style="margin: 16px 0" />
            <a-table :data="report.security_summary.details" :pagination="false">
              <template #columns>
                <a-table-column title="漏洞类型" data-index="type" />
                <a-table-column title="严重程度" data-index="severity">
                  <template #cell="{ record }">
                    <a-tag :color="getSeverityColor(record.severity)">
                      {{ record.severity }}
                    </a-tag>
                  </template>
                </a-table-column>
                <a-table-column title="位置" data-index="url" :width="200" />
                <a-table-column title="描述" data-index="description" />
              </template>
            </a-table>
          </a-card>
        </div>

        <!-- 合规摘要 -->
        <div v-if="report.compliance_summary">
          <a-divider />
          <a-card title="合规性检查结果">
            <a-progress
              :percent="report.compliance_summary.score"
              :status="getComplianceStatus(report.compliance_summary.score)"
            />
            <a-divider style="margin: 16px 0" />
            <a-table :data="report.compliance_summary.issues" :pagination="false">
              <template #columns>
                <a-table-column title="问题类型" data-index="type" />
                <a-table-column title="严重程度" data-index="severity">
                  <template #cell="{ record }">
                    <a-tag :color="getSeverityColor(record.severity)">
                      {{ record.severity }}
                    </a-tag>
                  </template>
                </a-table-column>
                <a-table-column title="描述" data-index="description" />
                <a-table-column title="建议" data-index="suggestion" />
              </template>
            </a-table>
          </a-card>
        </div>

        <!-- 导出按钮 -->
        <a-divider />
        <a-space direction="vertical" style="width: 100%">
          <a-typography-title :heading="6">导出报告</a-typography-title>
          <a-button type="primary" @click="handlePreviewReport">
            <template #icon><icon-edit /></template>
            编辑并导出报告
          </a-button>
        </a-space>
      </div>
    </a-modal>
    
    <!-- 报告编辑预览模态框 -->
    <a-modal
      v-model:visible="previewVisible"
      title="编辑并导出报告"
      :width="1400"
      :footer="true"
      unmount-on-close
    >
      <a-space direction="vertical" style="width: 100%">
        <a-alert type="info">
          可以删除不需要的项目，或修改建议内容。导出时只包含列表中的项目。
        </a-alert>
        
        <a-divider />
        
        <!-- 错误列表 -->
        <a-list
          :data="editableErrors"
          :virtual-list-props="{ height: 500 }"
          bordered
        >
          <template #item="{ item, index }">
            <a-list-item>
              <a-list-item-meta>
                <template #avatar>
                  <a-tag :color="getErrorSeverityColor(item.severity)">
                    {{ item.severity }}
                  </a-tag>
                </template>
                <template #title>
                  <a-space>
                    <a-tag>{{ item.type }}</a-tag>
                    <span>{{ item.title }}</span>
                  </a-space>
                </template>
                <template #description>
                  <a-space direction="vertical" style="width: 100%">
                    <div>{{ item.description }}</div>
                    <div><strong>位置:</strong> {{ item.location }}</div>
                    <div><strong>证据:</strong> {{ item.evidence }}</div>
                    <a-input
                      v-model="item.suggestion"
                      placeholder="修改建议"
                      style="margin-top: 8px"
                    >
                      <template #prepend>建议:</template>
                    </a-input>
                  </a-space>
                </template>
              </a-list-item-meta>
              <template #actions>
                <a-button 
                  type="text" 
                  status="danger"
                  @click="handleRemoveError(index)"
                >
                  <template #icon><icon-delete /></template>
                  删除
                </a-button>
              </template>
            </a-list-item>
          </template>
        </a-list>
        
        <a-divider />
        
        <a-space>
          <a-statistic title="总项目数" :value="editableErrors.length" />
          <a-statistic title="敏感词" :value="getErrorCountByType('sensitive')" />
          <a-statistic title="死链" :value="getErrorCountByType('broken_link')" />
          <a-statistic title="资源错误" :value="getErrorCountByType('resource')" />
          <a-statistic title="HTTP错误" :value="getErrorCountByType('http_error')" />
        </a-space>
      </a-space>
      
      <template #footer>
        <a-space>
          <a-button @click="previewVisible = false">取消</a-button>
          <a-button type="outline" @click="handleExportEdited('json')">
            导出JSON
          </a-button>
          <a-button type="outline" @click="handleExportEdited('html')">
            导出HTML
          </a-button>
          <a-button type="outline" @click="handleExportEdited('markdown')">
            导出Markdown
          </a-button>
          <a-button type="primary" @click="handleExportEdited('excel')">
            导出Excel
          </a-button>
        </a-space>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Message } from '@arco-design/web-vue';
import {
  createScanTask,
  getScanTasks,
  startScanTask,
  cancelScanTask,
  getScanReport,
  exportScanReport,
  deleteScanTask,
  type ScanConfig,
  type ScanTask,
  type ScanReport,
} from '@/api/webscan';

const scanConfig = ref<ScanConfig>({
  target_url: '',
  max_depth: 3,
  max_pages: 100,
  timeout: 30,
  concurrency: 5,
  enable_sensitive: true,
  enable_tech_errors: true,
  enable_security: true,
  enable_compliance: true,
  enable_cascade: false,  // 级联检测默认关闭
  enable_ai: false,       // AI检测默认关闭
  exclude_patterns: [],
  include_patterns: [],
  follow_redirects: true,
  max_redirects: 10,
});

const tasks = ref<ScanTask[]>([]);
const report = ref<ScanReport | null>(null);
const loading = ref(false);
const creating = ref(false);
const reportVisible = ref(false);
const previewVisible = ref(false);
const currentTaskId = ref('');

// 可编辑的错误列表
interface EditableError {
  type: string;
  severity: string;
  title: string;
  description: string;
  location: string;
  evidence: string;
  suggestion: string;
}

const editableErrors = ref<EditableError[]>([]);

// 加载任务列表
const loadTasks = async () => {
  loading.value = true;
  try {
    tasks.value = await getScanTasks();
  } catch (error) {
    Message.error('加载任务列表失败');
  } finally {
    loading.value = false;
  }
};

// 创建任务
const handleCreateTask = async () => {
  if (!scanConfig.value.target_url) {
    Message.warning('请输入目标网站URL');
    return;
  }

  creating.value = true;
  try {
    // 调试日志：显示发送的配置
    console.log('[WebScan] Creating task with config:', {
      enable_cascade: scanConfig.value.enable_cascade,
      enable_ai: scanConfig.value.enable_ai,
      enable_sensitive: scanConfig.value.enable_sensitive
    });
    
    const task = await createScanTask(scanConfig.value);
    Message.success('任务创建成功');
    await loadTasks();
    // 自动启动任务
    await startScanTask(task.id);
    Message.info('任务已启动');
    // 开始轮询进度
    pollProgress(task.id);
  } catch (error) {
    Message.error('创建任务失败');
  } finally {
    creating.value = false;
  }
};

// 轮询进度
const pollProgress = async (taskId: string) => {
  const interval = setInterval(async () => {
    try {
      const task = tasks.value.find(t => t.id === taskId);
      if (!task || task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
        clearInterval(interval);
        return;
      }
      await loadTasks();
    } catch (error) {
      clearInterval(interval);
    }
  }, 2000);
};

// 启动任务
const handleStartTask = async (taskId: string) => {
  try {
    await startScanTask(taskId);
    Message.success('任务已启动');
    await loadTasks();
    pollProgress(taskId);
  } catch (error) {
    Message.error('启动任务失败');
  }
};

// 取消任务
const handleCancelTask = async (taskId: string) => {
  try {
    await cancelScanTask(taskId);
    Message.success('任务已取消');
    await loadTasks();
  } catch (error) {
    Message.error('取消任务失败');
  }
};

// 查看报告
const handleViewReport = async (taskId: string) => {
  currentTaskId.value = taskId;
  try {
    report.value = await getScanReport(taskId);
    reportVisible.value = true;
  } catch (error) {
    Message.error('获取报告失败');
  }
};

// 预览并编辑报告
const handlePreviewReport = async () => {
  try {
    // 获取完整报告
    const reportData = await getScanReport(currentTaskId.value);
    
    // 提取所有错误到可编辑列表
    const errors: EditableError[] = [];
    for (const page of reportData.pages) {
      for (const err of page.errors) {
        errors.push({
          type: err.type,
          severity: err.severity,
          title: err.title,
          description: err.description,
          location: err.location,
          evidence: err.evidence,
          suggestion: err.suggestion
        });
      }
    }
    
    editableErrors.value = errors;
    previewVisible.value = true;
  } catch (error) {
    Message.error('加载报告失败');
  }
};

// 删除错误项
const handleRemoveError = (index: number) => {
  editableErrors.value.splice(index, 1);
  Message.success('已删除');
};

// 获取错误数量（按类型）
const getErrorCountByType = (type: string) => {
  return editableErrors.value.filter(e => e.type === type).length;
};

// 获取错误严重程度颜色
const getErrorSeverityColor = (severity: string) => {
  const colors: Record<string, string> = {
    critical: 'red',
    high: 'orangered',
    medium: 'orange',
    low: 'gold',
    info: 'blue'
  };
  return colors[severity] || 'gray';
};

// 导出编辑后的报告
const handleExportEdited = async (format: 'json' | 'html' | 'markdown' | 'excel') => {
  try {
    // 调用新的API导出编辑后的报告
    const response = await fetch(`/api/v1/webscan/tasks/${currentTaskId.value}/report/export-edited?format=${format}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({
        errors: editableErrors.value
      })
    });
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const extension = format === 'excel' ? 'xlsx' : format;
    a.download = `webscan-report-${currentTaskId.value}.${extension}`;
    a.click();
    window.URL.revokeObjectURL(url);
    Message.success('导出成功');
  } catch (error) {
    Message.error('导出报告失败');
  }
};

// 删除任务
const handleDeleteTask = async (taskId: string) => {
  try {
    await deleteScanTask(taskId);
    Message.success('任务已删除');
    await loadTasks();
  } catch (error) {
    Message.error('删除任务失败');
  }
};

// 辅助函数
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'gray',
    running: 'blue',
    completed: 'green',
    failed: 'red',
    cancelled: 'orange',
  };
  return colors[status] || 'gray';
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待扫描',
    running: '扫描中',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消',
  };
  return texts[status] || status;
};

const getProgressStatus = (status: string) => {
  if (status === 'completed') return 'success';
  if (status === 'failed') return 'danger';
  return 'normal';
};

const getSeverityColor = (severity: string) => {
  const colors: Record<string, string> = {
    critical: 'red',
    high: 'orange',
    medium: 'gold',
    low: 'green',
    info: 'blue',
  };
  return colors[severity] || 'gray';
};

const getErrorTypeText = (type: string) => {
  const texts: Record<string, string> = {
    sensitive: '敏感词',
    http: 'HTTP错误',
    broken_link: '链接失效',
    resource: '资源错误',
    security: '安全漏洞',
    compliance: '合规问题',
  };
  return texts[type] || type;
};

const getComplianceStatus = (score: number) => {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'danger';
};

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN');
};

const formatDuration = (duration: number) => {
  const seconds = Math.floor(duration / 1000000000);
  if (seconds < 60) return `${seconds}秒`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}分${secs}秒`;
};

onMounted(() => {
  loadTasks();
});
</script>

<style scoped lang="less">
.webscan-view {
  padding: 20px;
}

.report-content {
  max-height: 70vh;
  overflow-y: auto;
}

.html-preview {
  max-height: 70vh;
  overflow-y: auto;
  padding: 20px;
  background: #fff;

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }

  :deep(th),
  :deep(td) {
    border: 1px solid #e5e6eb;
    padding: 8px 12px;
    text-align: left;
  }

  :deep(th) {
    background: #f7f8fa;
    font-weight: 600;
  }

  :deep(h1),
  :deep(h2),
  :deep(h3) {
    margin: 20px 0 10px 0;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 20px;
    margin: 10px 0;
  }
}
</style>
