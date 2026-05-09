<template>
  <div class="logs-container">
    <div class="page-header">
      <h2>检测日志列表</h2>
      <div class="header-actions">
        <a-button type="primary" @click="handleExport" :loading="exporting">
          <template #icon><icon-export /></template>
          导出CSV
        </a-button>
        <a-button @click="loadLogs">
          <template #icon><icon-refresh /></template>
          刷新
        </a-button>
      </div>
    </div>

    <div class="search-filters">
      <a-form :model="searchForm" layout="inline">
        <a-form-item label="时间范围">
          <a-range-picker
            v-model="dateRange"
            show-time
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DDTHH:mm:ssZ"
            style="width: 320px"
          />
        </a-form-item>
        <a-form-item label="分类">
          <a-select v-model="searchForm.category" placeholder="全部" style="width: 120px" allow-clear>
            <a-option value="">全部</a-option>
            <a-option v-for="cat in categories" :key="cat.key" :value="cat.key">
              {{ cat.name }}
            </a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="敏感词">
          <a-select v-model="searchForm.has_sensitive" placeholder="全部" style="width: 100px" allow-clear>
            <a-option value="">全部</a-option>
            <a-option :value="true">有</a-option>
            <a-option :value="false">无</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="关键词">
          <a-input v-model="searchForm.keyword" placeholder="搜索文本内容" style="width: 200px" allow-clear />
        </a-form-item>
        <a-form-item v-if="userStore.isAdmin" label="AK用户">
          <a-input v-model="searchForm.access_key_id" placeholder="AccessKey ID" style="width: 200px" allow-clear />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button @click="resetSearch" style="margin-left: 8px">重置</a-button>
        </a-form-item>
      </a-form>
    </div>

    <div class="logs-table">
      <a-card :bordered="false">
        <a-table
          :columns="columns"
          :data="logs"
          :loading="loading"
          :pagination="pagination"
          :scroll="{ x: 1200 }"
          row-key="id"
          @page-change="handlePageChange"
          @page-size-change="handlePageSizeChange"
        >
          <template #hasSensitive="{ record }">
            <a-tag :color="record.has_sensitive ? 'red' : 'green'">
              {{ record.has_sensitive ? '有' : '无' }}
            </a-tag>
          </template>
          <template #text="{ record }">
            <div class="text-preview">
              <a-tooltip :content="record.text">
                <div class="text-ellipsis">{{ record.text }}</div>
              </a-tooltip>
            </div>
          </template>
          <template #sensitiveWords="{ record }">
            <div v-if="record.sensitive_words && record.sensitive_words.length > 0">
              <a-tag v-for="word in record.sensitive_words.slice(0, 3)" :key="word.word" color="red" size="small">
                {{ word.word }}({{ word.category }})
              </a-tag>
              <span v-if="record.sensitive_words.length > 3"> +{{ record.sensitive_words.length - 3 }} </span>
            </div>
            <span v-else>-</span>
          </template>
          <template #processingTime="{ record }">
            {{ record.processing_time }}ms
          </template>
          <template #createdAt="{ record }">
            {{ formatTime(record.created_at) }}
          </template>
          <template #actions="{ record }">
            <a-button type="text" size="small" @click="handleViewDetail(record)">
              详情
            </a-button>
          </template>
        </a-table>
      </a-card>
    </div>

    <!-- 日志详情模态框 -->
    <a-modal
      v-model:visible="detailVisible"
      title="日志详情"
      :footer="false"
      width="600px"
    >
      <a-descriptions :data="detailData" :column="1" v-if="currentLog" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { Message } from '@arco-design/web-vue';
import { IconExport, IconRefresh } from '@arco-design/web-vue/es/icon';

interface DetectionLog {
  id: string;
  text: string;
  category: string;
  has_sensitive: boolean;
  sensitive_words: Array<{ word: string; category: string; reason: string }>;
  filtered_text: string;
  request_ip: string;
  user_id: string;
  access_key_id: string;
  processing_time: number;
  created_at: string;
}

const userStore = useUserStore();
const loading = ref(false);
const exporting = ref(false);
const logs = ref<DetectionLog[]>([]);

const dateRange = ref<string[]>([]);
const searchForm = reactive({
  category: '',
  has_sensitive: undefined as boolean | undefined,
  keyword: '',
  access_key_id: '',
});

const pagination = reactive({
  total: 0,
  current: 1,
  pageSize: 10,
  showTotal: true,
  showJumper: true,
  showPageSize: true,
});

const columns = [
  // { title: 'ID', dataIndex: 'id', width: 120, ellipsis: true },
  { title: '检测文本', dataIndex: 'text', slotName: 'text', width: 200 },
  { title: '分类', dataIndex: 'category', width: 100 },
  { title: '敏感词', dataIndex: 'sensitiveWordsJSON', slotName: 'sensitiveWords', width: 200 },
  { title: '客户端IP', dataIndex: 'request_ip', width: 120 },
  // { title: '用户ID', dataIndex: 'user_id', width: 100, ellipsis: true },
  { title: '处理时间', dataIndex: 'processingTime', slotName: 'processingTime', width: 100, align: 'right' as const },
  { title: '创建时间', dataIndex: 'createdAt', slotName: 'createdAt', width: 160 },
  { title: '包含敏感词', dataIndex: 'hasSensitive', slotName: 'hasSensitive', width: 100, align: 'center' as const },
  { title: '操作', slotName: 'actions', width: 80, fixed: 'right' as const },
];

const categories = [
  { key: 'politics', name: '政治' },
  { key: 'violence', name: '暴恐' },
  { key: 'porn', name: '色情' },
  { key: 'fraud', name: '诈骗' },
  { key: 'gamble', name: '赌博' },
  { key: 'drug', name: '毒品' },
  { key: 'all', name: '全部' },
];

// 详情模态框
const detailVisible = ref(false);
const currentLog = ref<DetectionLog | null>(null);
const detailData = computed(() => {
  if (!currentLog.value) return [];
  const log = currentLog.value;
  return [
    { label: 'ID', value: log.id },
    { label: '检测文本', value: log.text },
    { label: '分类', value: log.category },
    { label: '包含敏感词', value: log.has_sensitive ? '是' : '否' },
    {
      label: '敏感词',
      value:
        log.sensitive_words && log.sensitive_words.length > 0
          ? log.sensitive_words.map(w => `${w.word}(${w.category})`).join(', ')
          : '无',
    },
    { label: '过滤后文本', value: log.filtered_text || '无' },
    { label: '客户端IP', value: log.request_ip || '未知' },
    { label: '用户ID', value: log.user_id || '匿名' },
    { label: 'AccessKey ID', value: log.access_key_id || '无' },
    { label: '处理时间', value: `${log.processing_time}ms` },
    { label: '创建时间', value: formatTime(log.created_at) },
  ];
});

const loadLogs = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: String(pagination.current),
      page_size: String(pagination.pageSize),
    });

    if (dateRange.value && dateRange.value.length === 2) {
      params.append('start_time', new Date(dateRange.value[0]).toISOString());
      params.append('end_time', new Date(dateRange.value[1]).toISOString());
    }

    if (searchForm.category) {
      params.append('category', searchForm.category);
    }

    if (searchForm.has_sensitive !== undefined) {
      params.append('has_sensitive', String(searchForm.has_sensitive));
    }

    if (searchForm.keyword) {
      params.append('keyword', searchForm.keyword);
    }

    if (userStore.isAdmin && searchForm.access_key_id) {
      params.append('access_key_id', searchForm.access_key_id);
    }

    const response = await fetch(`/api/v1/logs?${params}`, {
      headers: {
        Authorization: `Bearer ${userStore.token}`,
      },
    });

    if (!response.ok) {
      throw new Error('获取日志失败');
    }

    const result = await response.json();
    if (result.success) {
      logs.value = result.data.logs || [];
      pagination.total = result.data.total || 0;
    }
  } catch (error) {
    Message.error('加载日志失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.current = 1;
  loadLogs();
};

const resetSearch = () => {
  dateRange.value = [];
  searchForm.category = '';
  searchForm.has_sensitive = undefined;
  searchForm.keyword = '';
  searchForm.access_key_id = '';
  pagination.current = 1;
  loadLogs();
};

const handlePageChange = (page: number) => {
  pagination.current = page;
  loadLogs();
};

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize;
  pagination.current = 1;
  loadLogs();
};

const handleViewDetail = (log: DetectionLog) => {
  currentLog.value = log;
  detailVisible.value = true;
};

const handleExport = async () => {
  exporting.value = true;
  try {
    const params = new URLSearchParams();

    if (dateRange.value && dateRange.value.length === 2) {
      params.append('start_time', new Date(dateRange.value[0]).toISOString());
      params.append('end_time', new Date(dateRange.value[1]).toISOString());
    }

    if (searchForm.category) {
      params.append('category', searchForm.category);
    }

    if (searchForm.keyword) {
      params.append('keyword', searchForm.keyword);
    }

    const response = await fetch(`/api/v1/logs/export?${params}`, {
      headers: {
        Authorization: `Bearer ${userStore.token}`,
      },
    });

    if (!response.ok) {
      throw new Error('导出失败');
    }

    // 下载文件
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detection_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    Message.success('导出成功');
  } catch (error) {
    Message.error('导出失败');
  } finally {
    exporting.value = false;
  }
};

const formatTime = (time: string | undefined) => {
  if (!time) return '-';
  const date = new Date(time);
  if (isNaN(date.getTime())) return '-'; // 检查是否为无效日期
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

onMounted(() => {
  loadLogs();
});
</script>

<style scoped>
.logs-container {
  padding: 20px;
}

@media (max-width: 768px) {
  .logs-container {
    padding: 12px;
  }
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 16px 0;
  color: var(--color-text-1);
}

@media (max-width: 768px) {
  .page-header h2 {
    font-size: 18px;
    margin-bottom: 12px;
  }
}

.header-actions {
  display: flex;
  gap: 12px;
}

@media (max-width: 768px) {
  .header-actions {
    width: 100%;
  }
  
  .header-actions :deep(.arco-btn) {
    flex: 1;
  }
}

.stats-overview {
  margin-bottom: 20px;
  padding: 20px;
  background: var(--color-bg-2);
  border-radius: 8px;
}

.search-filters {
  margin-bottom: 20px;
  padding: 12px 16px;
  background: var(--color-bg-2);
  border-radius: 8px;
}

@media (max-width: 768px) {
  .search-filters {
    padding: 12px;
  }
}

.search-filters :deep(.arco-form) {
  display: flex;
  flex-direction: column;
}

@media (min-width: 769px) {
  .search-filters :deep(.arco-form) {
    flex-direction: row;
    flex-wrap: wrap;
  }
}

.search-filters :deep(.arco-form-item) {
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .search-filters :deep(.arco-form-item) {
    width: 100%;
    margin-bottom: 12px;
  }
  
  .search-filters :deep(.arco-form-item) :deep(.arco-select) {
    width: 100% !important;
  }
  
  .search-filters :deep(.arco-form-item) :deep(.arco-input),
  .search-filters :deep(.arco-form-item) :deep(.arco-picker) {
    width: 100% !important;
  }
  
  .search-filters :deep(.arco-range-picker) {
    width: 100% !important;
  }
}

@media (max-width: 768px) {
  .search-filters :deep(.arco-form-item:last-child) {
    display: flex;
    gap: 8px;
  }
  
  .search-filters :deep(.arco-form-item:last-child) :deep(.arco-btn) {
    flex: 1;
  }
}

.charts-section {
  margin-bottom: 20px;
}

.logs-table {
  background: var(--color-bg-2);
  border-radius: 8px;
}

.text-preview {
  max-width: 200px;
}

@media (max-width: 768px) {
  .text-preview {
    max-width: 150px;
  }
}

.text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logs-table :deep(.arco-table) {
  font-size: 13px;
}

@media (max-width: 768px) {
  .logs-table :deep(.arco-table) {
    font-size: 12px;
  }
}

.logs-table :deep(.arco-table-td) {
  padding: 0px !important;
}

@media (max-width: 768px) {
  .logs-table :deep(.arco-table-td) {
    padding: 4px 8px !important;
  }
}

.logs-table :deep(.arco-table-th) {
  padding: 10px 12px;
}

@media (max-width: 768px) {
  .logs-table :deep(.arco-table-th) {
    padding: 8px 6px;
    font-size: 12px;
  }
}

@media (max-width: 768px) {
  .logs-table :deep(.arco-tag) {
    font-size: 11px;
    padding: 0 4px;
  }
}
</style>
