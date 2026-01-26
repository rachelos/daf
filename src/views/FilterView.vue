<template>
  <div class="filter-view">
    <a-card title="文本过滤" :bordered="false" class="filter-card">
      <a-form layout="vertical">
        <a-form-item label="原始文本">
          <a-textarea
            v-model="filterText"
            placeholder="请输入要过滤的文本内容..."
            :auto-size="{ minRows: 6, maxRows: 10 }"
            allow-clear
          />
        </a-form-item>

        <a-form-item label="过滤分类">
          <a-select v-model="filterCategory" placeholder="全部分类" allow-clear>
            <a-option value="">全部分类</a-option>
            <a-option v-for="(name, key) in categories" :key="key" :value="key">
              {{ name }}
            </a-option>
          </a-select>
        </a-form-item>

        <a-button type="primary" @click="handleFilter" :loading="loading">
          <template #icon>
            <icon-sync />
          </template>
          执行过滤
        </a-button>
      </a-form>

      <div v-if="filterResult" class="filter-result mt-4">
        <a-divider />
        <a-descriptions title="过滤结果" :column="1" bordered>
          <a-descriptions-item label="过滤后文本">
            <div class="filtered-text">{{ filterResult.filtered_text }}</div>
          </a-descriptions-item>
          <a-descriptions-item label="原文长度">
            {{ filterResult.original_text?.length || 0 }}
          </a-descriptions-item>
          <a-descriptions-item label="过滤后长度">
            {{ filterResult.filtered_text?.length || 0 }}
          </a-descriptions-item>
          <a-descriptions-item label="包含敏感词">
            <a-tag :color="filterResult.has_sensitive ? 'red' : 'green'">
              {{ filterResult.has_sensitive ? '是' : '否' }}
            </a-tag>
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Message } from '@arco-design/web-vue';
import { detectApi, categoriesApi } from '@/api';

interface FilterResult {
  filtered_text: string;
  original_text: string;
  has_sensitive: boolean;
}

const filterText = ref('');
const filterCategory = ref('');
const loading = ref(false);
const filterResult = ref<FilterResult | null>(null);
const categories = ref<Record<string, string>>({});

const handleFilter = async () => {
  if (!filterText.value.trim()) {
    Message.warning('请输入要过滤的文本');
    return;
  }
  loading.value = true;
  try {
    const result = await detectApi.filter(filterText.value, filterCategory.value || undefined);
    if (result.success && result.data) {
      filterResult.value = result.data;
      Message.success('文本过滤完成');
    } else {
      Message.error('过滤失败: ' + (result.message || '未知错误'));
    }
  } catch (error: any) {
    Message.error('过滤失败: ' + (error.message || '未知错误'));
  } finally {
    loading.value = false;
  }
};

const loadCategories = async () => {
  try {
    const result = await categoriesApi.get();
    if (result.success && result.data) {
      categories.value = result.data;
    }
  } catch (error) {
    console.error('加载分类失败', error);
  }
};

onMounted(() => {
  loadCategories();
});
</script>

<style scoped lang="less">
.filter-view {
  margin: 0 auto;

  :deep(.arco-card) {
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    border-radius: 8px;
  }

  :deep(.arco-textarea) {
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  :deep(.arco-textarea:focus) {
    border-color: #165DFF;
    box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.1);
  }

  :deep(.arco-button) {
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  :deep(.arco-button:hover) {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .filter-card {
    margin-bottom: 16px;
  }

  .mt-4 {
    margin-top: 16px;
  }

  .filtered-text {
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.6;
    padding: 12px;
    background: #f7f8fa;
    border-radius: 6px;
    border-left: 3px solid #165DFF;
  }

  :deep(.arco-descriptions) {
    background: #f7f8fa;
    border-radius: 6px;
  }

  :deep(.arco-descriptions-item-label) {
    background: #e5e6eb;
    font-weight: 500;
  }
}
</style>
