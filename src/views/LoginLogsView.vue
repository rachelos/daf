<template>
  <div class="logs-container">
    <div class="page-header">
      <h2>登录日志</h2>
      <div class="header-actions">
        <a-button @click="loadLogs">
          <template #icon><icon-refresh /></template>
          刷新
        </a-button>
      </div>
    </div>

    <div class="search-filters">
      <a-form :model="searchForm" layout="inline">
        <a-form-item label="用户名" v-if="userStore.isAdmin">
          <a-input v-model="searchForm.username" placeholder="搜索用户名" style="width: 150px" allow-clear />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model="searchForm.status" placeholder="全部" style="width: 120px" allow-clear>
            <a-option value="">全部</a-option>
            <a-option value="success">成功</a-option>
            <a-option value="failed">失败</a-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button @click="resetSearch" style="margin-left: 8px">重置</a-button>
        </a-form-item>
      </a-form>
    </div>

    <div class="logs-table">
      <a-card :bordered="false">
        <!-- 桌面端表格 -->
        <a-table
          class="desktop-table"
          :columns="columns"
          :data="filteredLogs"
          :loading="loading"
          :pagination="pagination"
          :scroll="{ x: 900 }"
          row-key="id"
          @page-change="handlePageChange"
          @page-size-change="handlePageSizeChange"
        >
          <template #status="{ record }">
            <a-tag :color="record.status === 'success' ? 'green' : 'red'">
              {{ record.status === 'success' ? '成功' : '失败' }}
            </a-tag>
          </template>
          <template #ipAddress="{ record }">
            <span>{{ record.ip_address || '-' }}</span>
          </template>
          <template #userAgent="{ record }">
            <a-tooltip :content="record.user_agent || '-'" position="top" mini>
              <div class="text-ellipsis" style="max-width: 200px;">
                {{ record.user_agent || '-' }}
              </div>
            </a-tooltip>
          </template>
          <template #message="{ record }">
            <span :class="{ 'error-message': record.status === 'failed' }">
              {{ record.message || '-' }}
            </span>
          </template>
          <template #loginTime="{ record }">
            {{ formatTime(record.login_time) }}
          </template>
        </a-table>

        <!-- 移动端卡片列表 -->
        <div class="mobile-list">
          <div
            v-for="log in filteredLogs"
            :key="log.id"
            class="log-card"
            @click="showDetail(log)"
          >
            <div class="log-card-header">
              <span class="username">{{ log.username }}</span>
              <a-tag :color="log.status === 'success' ? 'green' : 'red'" size="small">
                {{ log.status === 'success' ? '成功' : '失败' }}
              </a-tag>
            </div>
            <div class="log-card-body">
              <div class="log-item">
                <span class="label">IP:</span>
                <span class="value">{{ log.ip_address || '-' }}</span>
              </div>
              <div class="log-item">
                <span class="label">时间:</span>
                <span class="value">{{ formatTime(log.login_time) }}</span>
              </div>
              <div class="log-item" v-if="log.message">
                <span class="label">说明:</span>
                <span class="value error-text">{{ log.message }}</span>
              </div>
            </div>
            <div class="log-card-footer">
              <icon-right class="arrow-icon" />
            </div>
          </div>
          <!-- 移动端分页 -->
          <div class="mobile-pagination" v-if="pagination.total > pagination.pageSize">
            <a-pagination
              v-model:current="pagination.current"
              v-model:page-size="pagination.pageSize"
              :total="pagination.total"
              simple
              @change="handlePageChange"
            />
          </div>
        </div>
      </a-card>
    </div>

    <!-- 详情弹窗 -->
    <a-modal
      v-model:visible="detailVisible"
      title="日志详情"
      :footer="false"
      width="90%"
      :max-width="500"
    >
      <a-descriptions :data="detailData" :column="1" v-if="currentLog" layout="vertical" bordered />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { Message } from '@arco-design/web-vue';
import { IconRefresh, IconRight } from '@arco-design/web-vue/es/icon';
import { usersApi } from '@/api';

interface LoginLog {
  id: string;
  username: string;
  ip_address: string;
  user_agent: string;
  status: 'success' | 'failed';
  message: string;
  login_time: string;
}

const userStore = useUserStore();
const loading = ref(false);
const logs = ref<LoginLog[]>([]);

const searchForm = reactive({
  username: '',
  status: '',
});

const pagination = reactive({
  total: 0,
  current: 1,
  pageSize: 20,
  showTotal: true,
  showJumper: true,
  showPageSize: true,
});

const columns = [
  { title: '用户名', dataIndex: 'username', width: 120 },
  { title: 'IP地址', dataIndex: 'ip_address', slotName: 'ipAddress', width: 140 },
  { title: '浏览器', dataIndex: 'user_agent', slotName: 'userAgent', width: 200 },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 80, align: 'center' as const },
  { title: '说明', dataIndex: 'message', slotName: 'message', width: 200 },
  { title: '登录时间', dataIndex: 'login_time', slotName: 'loginTime', width: 160 },
];

// 详情弹窗
const detailVisible = ref(false);
const currentLog = ref<LoginLog | null>(null);
const detailData = computed(() => {
  if (!currentLog.value) return [];
  const log = currentLog.value;
  return [
    { label: '用户名', value: log.username },
    { label: '状态', value: log.status === 'success' ? '成功' : '失败' },
    { label: 'IP地址', value: log.ip_address || '-' },
    { label: '浏览器', value: log.user_agent || '-' },
    { label: '说明', value: log.message || '-' },
    { label: '登录时间', value: formatTime(log.login_time) },
  ];
});

const showDetail = (log: LoginLog) => {
  currentLog.value = log;
  detailVisible.value = true;
};

// 根据搜索条件过滤日志
const filteredLogs = computed(() => {
  let result = logs.value;
  
  if (searchForm.status) {
    result = result.filter(log => log.status === searchForm.status);
  }
  
  return result;
});

const loadLogs = async () => {
  loading.value = true;
  try {
    if (userStore.isAdmin) {
      // 管理员查询所有日志
      const res = await usersApi.getAllLoginLogs({
        page: pagination.current,
        page_size: pagination.pageSize,
        username: searchForm.username || undefined,
      });
      if (res.success) {
        logs.value = res.data.logs || [];
        pagination.total = res.data.total || 0;
      }
    } else {
      // 普通用户只查自己的日志
      const res = await usersApi.getMyLoginLogs({ limit: pagination.pageSize });
      if (res.success) {
        logs.value = res.data.logs || [];
        pagination.total = res.data.total || 0;
      }
    }
  } catch (error: any) {
    Message.error(error.message || '加载日志失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.current = 1;
  loadLogs();
};

const resetSearch = () => {
  searchForm.username = '';
  searchForm.status = '';
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

const formatTime = (time: string | undefined) => {
  if (!time) return '-';
  const date = new Date(time);
  if (isNaN(date.getTime())) return '-';
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

.search-filters {
  margin-bottom: 20px;
  padding: 12px 16px;
  background: var(--color-bg-2);
  border-radius: 8px;
}

@media (max-width: 768px) {
  .search-filters {
    padding: 12px;
    margin-bottom: 12px;
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
  
  .search-filters :deep(.arco-form-item) :deep(.arco-select),
  .search-filters :deep(.arco-form-item) :deep(.arco-input) {
    width: 100% !important;
  }
}

@media (max-width: 768px) {
  .search-filters :deep(.arco-form-item:last-child) {
    display: flex;
    gap: 8px;
    margin-bottom: 0;
  }
  
  .search-filters :deep(.arco-form-item:last-child) :deep(.arco-btn) {
    flex: 1;
  }
}

.logs-table {
  background: var(--color-bg-2);
  border-radius: 8px;
}

@media (max-width: 768px) {
  .logs-table :deep(.arco-card-body) {
    padding: 8px;
  }
}

/* 桌面端表格 */
.desktop-table {
  display: block;
}

@media (max-width: 768px) {
  .desktop-table {
    display: none;
  }
}

/* 移动端列表 */
.mobile-list {
  display: none;
}

@media (max-width: 768px) {
  .mobile-list {
    display: block;
  }
}

.log-card {
  background: var(--color-bg-2);
  border: 1px solid var(--color-neutral-3);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 12px;
}

.log-card:active {
  background: var(--color-neutral-2);
}

.log-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 80px;
}

.log-card-header .username {
  font-weight: 600;
  font-size: 14px;
  color: var(--color-text-1);
}

.log-card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.log-item .label {
  color: var(--color-text-3);
  flex-shrink: 0;
}

.log-item .value {
  color: var(--color-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log-item .error-text {
  color: rgb(var(--danger-6));
}

.log-card-footer {
  flex-shrink: 0;
  color: var(--color-text-3);
}

.arrow-icon {
  font-size: 16px;
}

.mobile-pagination {
  display: flex;
  justify-content: center;
  padding: 12px 0;
}

.text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.error-message {
  color: rgb(var(--danger-6));
}

.logs-table :deep(.arco-table) {
  font-size: 13px;
}

.logs-table :deep(.arco-table-td) {
  padding: 12px 16px !important;
}

.logs-table :deep(.arco-table-th) {
  padding: 12px 16px;
  font-weight: 600;
}

/* 详情弹窗优化 */
:deep(.arco-modal) {
  max-width: 500px;
}

@media (max-width: 768px) {
  :deep(.arco-modal) {
    margin: 20px auto;
  }
  
  :deep(.arco-modal-body) {
    padding: 16px;
  }
}
</style>