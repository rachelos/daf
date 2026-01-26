<template>
  <div class="categories-view">
    <a-card title="分类信息" :bordered="false">
      <template #extra>
        <a-button @click="loadCategories" :loading="loading">
          <template #icon>
            <icon-refresh />
          </template>
          刷新
        </a-button>
      </template>

      <a-alert type="info" class="mb-4">
        当前系统支持的敏感词分类
      </a-alert>

      <a-row :gutter="24">
        <a-col v-for="(name, key) in categories" :key="key" :xs="24" :sm="12" :md="8" :lg="6" :xl="4">
          <a-card hoverable class="category-card" :class="`category-${key.toLowerCase()}`">
            <div class="category-content">
              <icon-price-tag class="category-icon" />
              <div class="category-name">{{ name }}</div>
              <div class="category-key">{{ key }}</div>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Message } from '@arco-design/web-vue';
import { categoriesApi } from '@/api';

const categories = ref<Record<string, string>>({});
const loading = ref(false);

const loadCategories = async () => {
  loading.value = true;
  try {
    const result = await categoriesApi.get();
    if (result.success && result.data) {
      categories.value = result.data;
    } else {
      Message.error('获取分类失败: ' + (result.message || '未知错误'));
    }
  } catch (error: any) {
    Message.error('获取分类失败: ' + (error.message || '未知错误'));
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadCategories();
});
</script>

<style scoped lang="less">
.categories-view {
  margin: 0 auto;

  :deep(.arco-card) {
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    border-radius: 8px;
  }

  :deep(.arco-card-header) {
    padding: 16px 20px;
  }

  :deep(.arco-card-body) {
    padding: 20px;
  }

  :deep(.arco-btn) {
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  :deep(.arco-btn:hover) {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .mb-4 {
    margin-bottom: 16px;
  }

  :deep(.arco-alert) {
    border-radius: 6px;
  }

  .category-card {
    text-align: center;
    transition: all 0.2s ease;
    cursor: pointer;
    border-radius: 8px;
    border: 1px solid var(--color-border-light);
    margin-bottom: 16px;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .category-content {

      .category-icon {
        font-size: 44px;
        margin-bottom: 16px;
        display: block;
        transition: all 0.2s ease;
      }

      .category-name {
        font-weight: 600;
        font-size: 16px;
        margin-bottom: 10px;
        color: var(--color-text-1);
      }

      .category-key {
        font-size: 12px;
        color: var(--color-text-tertiary);
        font-family: 'Courier New', monospace;
        background: var(--color-bg-light);
        padding: 3px 10px;
        border-radius: 4px;
        display: inline-block;
      }
    }

    &:hover .category-icon {
      transform: scale(1.1);
    }
  }

  // 分类颜色主题
  .category-none {
    .category-icon { color: #999; }
  }

  .category-pornography {
    border-color: #ffccc7;
    .category-icon { color: #ff4d4f; }
  }

  .category-political {
    border-color: #ffd8bf;
    .category-icon { color: #fa8c16; }
  }

  .category-violence {
    border-color: #d3adf7;
    .category-icon { color: #722ed1; }
  }

  .category-gambling {
    border-color: #ffe58f;
    .category-icon { color: #faad14; }
  }

  .category-drugs {
    border-color: #ffadd2;
    .category-icon { color: #eb2f96; }
  }

  .category-profanity {
    border-color: #87e8de;
    .category-icon { color: #13c2c2; }
  }

  .category-discrimination {
    border-color: #91caff;
    .category-icon { color: #1890ff; }
  }

  .category-scam {
    border-color: #b7eb8f;
    .category-icon { color: #52c41a; }
  }

  .category-custom {
    border-color: #ffe58f;
    .category-icon { color: #faad14; }
  }
}
</style>
