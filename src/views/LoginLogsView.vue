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
        <a-table
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
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { Message } from '@arco-design/web-vue';
import { IconRefresh } from '@arco-design/web-vue/es/icon';
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
  }
  
  .search-filters :deep(.arco-form-item:last-child) :deep(.arco-btn) {
    flex: 1;
  }
}

.logs-table {
  background: var(--color-bg-2);
  border-radius: 8px;
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

@media (max-width: 768px) {
  .logs-table :deep(.arco-table) {
    font-size: 12px;
  }
}

.logs-table :deep(.arco-table-td) {
  padding: 12px 16px !important;
}

@media (max-width: 768px) {
  .logs-table :deep(.arco-table-td) {
    padding: 8px !important;
  }
}

.logs-table :deep(.arco-table-th) {
  padding: 12px 16px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .logs-table :deep(.arco-table-th) {
    padding: 10px 8px;
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