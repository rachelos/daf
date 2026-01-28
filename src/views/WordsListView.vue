<template>
  <div class="words-list-view">
    <a-card title="词库列表" :bordered="false">
      <template #extra>
        <div class="header-actions">
          <a-space :size="12" class="actions-desktop">
            <a-input
              v-model="searchKeyword"
              placeholder="搜索关键词"
              style="width: 200px"
              allow-clear
              @input="handleSearch"
            >
              <template #prefix>
                <icon-search />
              </template>
            </a-input>
            <a-select
              v-model="filterCategory"
              placeholder="筛选分类"
              style="width: 150px"
              allow-clear
              @change="handleFilterCategory"
            >
              <a-option value="">全部分类</a-option>
              <a-option v-for="(name, key) in categories" :key="key" :value="key">
                {{ name }}
              </a-option>
            </a-select>
            <a-select
              v-model="pageSize"
              placeholder="每页条数"
              style="width: 120px"
              @change="handlePageSizeChange"
            >
              <a-option :value="10">10条/页</a-option>
              <a-option :value="20">20条/页</a-option>
              <a-option :value="50">50条/页</a-option>
              <a-option :value="100">100条/页</a-option>
            </a-select>
            <a-button type="primary" @click="handleRefresh" :loading="loading">
              <template #icon>
                <icon-refresh />
              </template>
              刷新
            </a-button>
          </a-space>
        </div>
      </template>

      <!-- 移动端筛选器 -->
      <div class="mobile-filters">
        <a-input
          v-model="searchKeyword"
          placeholder="搜索关键词"
          allow-clear
          @input="handleSearch"
          style="margin-bottom: 12px"
        >
          <template #prefix>
            <icon-search />
          </template>
        </a-input>
        <a-select
          v-model="filterCategory"
          placeholder="筛选分类"
          allow-clear
          @change="handleFilterCategory"
          style="margin-bottom: 12px"
        >
          <a-option value="">全部分类</a-option>
          <a-option v-for="(name, key) in categories" :key="key" :value="key">
            {{ name }}
          </a-option>
        </a-select>
        <a-select
          v-model="pageSize"
          placeholder="每页条数"
          @change="handlePageSizeChange"
          style="margin-bottom: 12px"
        >
          <a-option :value="10">10条/页</a-option>
          <a-option :value="20">20条/页</a-option>
          <a-option :value="50">50条/页</a-option>
          <a-option :value="100">100条/页</a-option>
        </a-select>
        <a-button type="primary" @click="handleRefresh" :loading="loading" style="width: 100%">
          <template #icon>
            <icon-refresh />
          </template>
          刷新
        </a-button>
      </div>

      <a-table
        :columns="columns"
        :data="wordsData"
        :pagination="pagination"
        :loading="loading"
        :bordered="{ cell: true }"
        :stripe="true"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      >
        <template #word="{ record }">
          <a-tooltip :content="record.word">
            <a-tag color="blue" class="word-tag">
              {{ record.word.length > 5 ? record.word.substring(0, 5) + '...' : record.word }}
            </a-tag>
          </a-tooltip>
        </template>
        <template #category="{ record }">
          <a-tag :color="getCategoryColor(record.category)">
            {{ getCategoryName(record.category) }}
          </a-tag>
        </template>
        <template #reason="{ record }">
          <span v-if="record.reason" class="reason-text">{{ record.reason }}</span>
          <span v-else class="no-reason">-</span>
        </template>
        <template #actions="{ record }">
          <a-space :size="8">
            <a-button type="text" size="small" @click="handleEdit(record)">
              <template #icon>
                <icon-edit />
              </template>
              编辑
            </a-button>
            <a-popconfirm content="确定要删除这个词吗？" @ok="handleDelete(record)">
              <a-button type="text" size="small" status="danger">
                <template #icon>
                  <icon-delete />
                </template>
                删除
              </a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <!-- 编辑模态框 -->
    <a-modal
      v-model:visible="editModalVisible"
      title="编辑敏感词"
      @ok="handleConfirmEdit"
      @cancel="handleCancelEdit"
      width="500px"
      class="edit-modal"
    >
      <a-form :model="editForm" layout="vertical">
        <a-form-item label="敏感词" required>
          <a-input v-model="editForm.word" placeholder="请输入敏感词" />
        </a-form-item>
        <a-form-item label="分类" required>
          <a-select v-model="editForm.category" placeholder="请选择分类">
            <a-option v-for="(name, key) in categories" :key="key" :value="key">
              {{ name }}
            </a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="原因">
          <a-textarea v-model="editForm.reason" placeholder="请输入原因（可选）" :max-length="200" show-word-limit />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Message } from '@arco-design/web-vue';
import { IconSearch, IconRefresh, IconEdit, IconDelete } from '@arco-design/web-vue/es/icon';
import { wordsApi, categoriesApi } from '@/api';

const categories = ref<Record<string, string>>({});
const wordsData = ref<Array<{ word: string; category: string; reason?: string; index: number }>>([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const searchKeyword = ref('');
const filterCategory = ref('');
const total = ref(0);
const totalPages = ref(0);

// 编辑相关
const editModalVisible = ref(false);
const editForm = ref({
  oldWord: '',
  word: '',
  category: '',
  reason: '',
});

const columns = [
  // {
  //   title: '序号',
  //   dataIndex: 'index',
  //   slotName: 'index',
  //   width: 100,
  // },
  {
    title: '敏感词',
    dataIndex: 'word',
    slotName: 'word',
    width: 200,
  },
  {
    title: '分类',
    dataIndex: 'category',
    slotName: 'category',
    width: 50,
  },
  {
    title: '原因',
    dataIndex: 'reason',
    slotName: 'reason',
  },
  {
    title: '操作',
    slotName: 'actions',
    width: 100,
    fixed: 'right',
  },
];

const pagination = computed(() => ({
  current: currentPage.value,
  pageSize: pageSize.value,
  total: total.value,
  showTotal: true,
  showJumper: true,
  showPageSize: true,
  pageSizeOptions: ['10', '20', '50', '100'],
}));

const loadCategories = async () => {
  try {
    const result = await categoriesApi.get();
    if (result.success && result.data) {
      categories.value = result.data;
    }
  } catch (error) {
    console.error('加载分类失败:', error);
  }
};

const loadWords = async () => {
  loading.value = true;
  try {
    const result = await wordsApi.get({
      page: currentPage.value,
      page_size: pageSize.value,
      category: filterCategory.value || undefined,
      keyword: searchKeyword.value || undefined,
    });

    if (result.success && result.data) {
      wordsData.value = result.data.words.map((item, index) => ({
        ...item,
        index: (currentPage.value - 1) * pageSize.value + index + 1,
      }));
      total.value = result.data.total_count;
      totalPages.value = result.data.total_pages;
    }
  } catch (error) {
    console.error('加载敏感词失败:', error);
    Message.error('加载敏感词失败');
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  loadWords();
};

const handlePageSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  loadWords();
};

const handleSearch = () => {
  currentPage.value = 1;
  loadWords();
};

const handleFilterCategory = () => {
  currentPage.value = 1;
  loadWords();
};

const handleRefresh = () => {
  loadWords();
  Message.success('刷新成功');
};

const getCategoryName = (categoryKey: string) => {
  return categories.value[categoryKey] || categoryKey;
};

const getCategoryColor = (categoryKey: string) => {
  const colorMap: Record<string, string> = {
    'Political': 'red',
    'Pornography': 'orange',
    'Violence': 'red',
    'Gambling': 'purple',
    'Drugs': 'magenta',
    'Profanity': 'blue',
    'Discrimination': 'cyan',
    'Scam': 'gold',
    'Custom': 'green',
  };
  return colorMap[categoryKey] || 'gray';
};

// 打开编辑模态框
const handleEdit = (record: any) => {
  editForm.value.oldWord = record.word;
  editForm.value.word = record.word;
  editForm.value.category = record.category;
  editForm.value.reason = record.reason || '';
  editModalVisible.value = true;
};

// 确认编辑
const handleConfirmEdit = async () => {
  if (!editForm.value.word) {
    Message.warning('请输入敏感词');
    return;
  }
  if (!editForm.value.category) {
    Message.warning('请选择分类');
    return;
  }

  try {
    // 先删除旧词
    await wordsApi.delete([editForm.value.oldWord]);

    // 再添加新词
    const words = { [editForm.value.word]: editForm.value.category };
    const reasons = editForm.value.reason ? { [editForm.value.word]: editForm.value.reason } : undefined;
    await wordsApi.add(words, reasons);

    Message.success('编辑成功');
    editModalVisible.value = false;
    loadWords();
  } catch (error: any) {
    Message.error('编辑失败: ' + (error.message || '未知错误'));
  }
};

// 取消编辑
const handleCancelEdit = () => {
  editModalVisible.value = false;
  editForm.value = {
    oldWord: '',
    word: '',
    category: '',
    reason: '',
  };
};

// 删除敏感词
const handleDelete = async (record: any) => {
  try {
    await wordsApi.delete([record.word]);
    Message.success('删除成功');
    loadWords();
  } catch (error: any) {
    Message.error('删除失败: ' + (error.message || '未知错误'));
  }
};

onMounted(() => {
  loadCategories();
  loadWords();
});
</script>

<style scoped lang="less">
.words-list-view {
  margin: 0 auto;

  :deep(.arco-card) {
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
  }

  :deep(.arco-card-header) {
    padding: 16px 20px;
  }

  :deep(.arco-card-body) {
    padding: 20px;
  }

  :deep(.arco-table) {
    border-radius: 6px;
    overflow: hidden;
  }

  :deep(.arco-table-th) {
    background-color: #f7f8fa;
    font-weight: 600;
    color: #1d2129;
  }

  :deep(.arco-table-td) {
    padding: 8px 12px;
  }

  :deep(.arco-input) {
    border-radius: 6px;
    transition: all 0.2s ease;

    &:focus-within {
      border-color: #165DFF;
      box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.1);
    }
  }

  :deep(.arco-button) {
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  :deep(.arco-button:hover) {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  :deep(.arco-select) {
    border-radius: 6px;
    transition: all 0.2s ease;

    &:hover {
      border-color: #165DFF;
    }

    &:focus {
      border-color: #165DFF;
      box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.1);
    }
  }

  .reason-text {
    color: #86909c;
    font-size: 13px;
  }

  .no-reason {
    color: #c9cdd4;
    font-size: 13px;
  }

  .word-tag {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: inline-block;
  }
}

// 移动端筛选器
.mobile-filters {
  display: none;
}

// 移动端样式
@media (max-width: 768px) {
  .words-list-view {
    padding: 0;
    margin: 0;

    :deep(.arco-card-header) {
      padding: 12px 16px;
      flex-direction: row;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    :deep(.arco-card-header-title) {
      font-size: 16px;
      flex: 0 0 auto;
      min-width: fit-content;
    }

    :deep(.arco-card-body) {
      padding: 12px;
    }
  }

  .header-actions {
    width: 100%;
    flex: 1;
    min-width: 0;
  }

  .actions-desktop {
    display: none;
  }

  .mobile-filters {
    display: block;
    margin-bottom: 16px;

    :deep(.arco-input),
    :deep(.arco-select) {
      width: 100% !important;
    }
  }

  // 表格移动端优化
  :deep(.arco-table) {
    font-size: 12px;

    .arco-table-th,
    .arco-table-td {
      padding: 6px 8px !important;
    }
  }

  :deep(.arco-table-th) {
    font-size: 12px;
  }

  :deep(.arco-tag) {
    font-size: 11px;
    padding: 1px 6px;
  }

  .word-tag {
    max-width: 80px;
    font-size: 11px;
  }

  // 按钮优化
  :deep(.arco-button-text) {
    padding: 0 4px;
    font-size: 12px;
  }

  // 分页器优化
  :deep(.arco-pagination) {
    font-size: 12px;
  }

  :deep(.arco-pagination-item) {
    min-width: 28px;
    height: 28px;
    font-size: 12px;
  }

  // 操作按钮优化
  :deep(.arco-space-item) {
    margin-right: 4px !important;
  }
}

// 模态框移动端优化
@media (max-width: 768px) {
  .edit-modal {
    :deep(.arco-modal) {
      width: 95% !important;
      margin: 0 auto;
    }

    :deep(.arco-modal-body) {
      padding: 16px;
      max-height: 70vh;
      overflow-y: auto;
    }

    :deep(.arco-modal-header) {
      padding: 16px;
    }

    :deep(.arco-modal-footer) {
      padding: 12px 16px;
    }

    :deep(.arco-btn) {
      flex: 1;
    }
  }
}

// 超小屏幕优化
@media (max-width: 480px) {
  .words-list-view {
    :deep(.arco-card-header-title) {
      font-size: 14px;
    }
  }

  .word-tag {
    max-width: 60px;
  }

  :deep(.arco-table) {
    font-size: 11px;

    .arco-table-th,
    .arco-table-td {
      padding: 4px 6px !important;
    }
  }
}
</style>
