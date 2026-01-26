<template>
  <div class="words-view">
    <a-row :gutter="24">
      <a-col :xs="24" :lg="12">
        <a-card title="添加敏感词" :bordered="false">
          <a-form layout="vertical">
            <a-form-item label="选择分类">
              <a-select
                v-model="selectedCategory"
                placeholder="请选择分类"
                allow-clear
              >
                <a-option value="">全部分类（手动指定）</a-option>
                <a-option v-for="(name, key) in categories" :key="key" :value="key">
                  {{ name }} ({{ key }})
                </a-option>
              </a-select>
            </a-form-item>

            <a-form-item :label="selectedCategory ? '词汇列表 (每行一个)' : '词汇列表 (每行一个，格式: 词汇|分类|原因，均为可选)'">
              <a-textarea
                v-model="newWords"
                :placeholder="(selectedCategory ? selectedCategoryPlaceholder : defaultPlaceholder) as string"
                :auto-size="{ minRows: 8, maxRows: 12 }"
                allow-clear
              />
            </a-form-item>

            <a-button type="primary" size="small" @click="handleAddWords" :loading="addLoading" class="compact-button">
              <template #icon>
                <icon-plus />
              </template>
              批量添加
            </a-button>
          </a-form>
        </a-card>
      </a-col>

      <a-col :xs="24" :lg="12">
        <a-card title="删除敏感词" :bordered="false">
          <a-form layout="vertical">
            <a-form-item label="词汇列表 (每行一个)">
              <a-textarea
                v-model="removeWords"
                placeholder="示例:
违规内容
不当言论
暴力内容"
                :auto-size="{ minRows: 8, maxRows: 12 }"
                allow-clear
              />
            </a-form-item>

            <a-space :size="12">
              <a-button type="primary" status="danger" @click="handleRemoveWords" :loading="removeLoading">
                <template #icon>
                  <icon-delete />
                </template>
                批量删除
              </a-button>
              <a-button status="warning" @click="handleClearAll" :loading="clearLoading">
                <template #icon>
                  <icon-eraser />
                </template>
                清空全部
              </a-button>
            </a-space>
          </a-form>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Message, Modal } from '@arco-design/web-vue';
import { IconPlus, IconDelete, IconEraser } from '@arco-design/web-vue/es/icon';
import { wordsApi, categoriesApi } from '@/api';

const newWords = ref('');
const removeWords = ref('');
const addLoading = ref(false);
const removeLoading = ref(false);
const clearLoading = ref(false);
const categories = ref<Record<string, string>>({});
const selectedCategory = ref('');

const defaultPlaceholder = computed(() => {
  const categoryExamples = Object.entries(categories.value)
    .slice(0, 6)
    .map(([key, name]) => `${name}示例|${key}|包含${name}元素`)
    .join('\n');

  return `示例:
${categoryExamples}
单词汇
（格式：词汇 或 词汇|分类 或 词汇|原因 或 词汇|分类|原因）
`;
});

const selectedCategoryPlaceholder = computed(() => {
  if (!selectedCategory.value) return defaultPlaceholder;
  const categoryName = categories.value[selectedCategory.value] || selectedCategory.value;
  return `示例:
示例词1|原因说明1
示例词2|原因说明2
示例词3|原因说明3
（所有词汇将添加到分类：${categoryName}，原因可选）
`;
});

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

const handleAddWords = async () => {
  if (!newWords.value.trim()) {
    Message.warning('请输入要添加的关键词');
    return;
  }

  const lines = newWords.value.trim().split('\n');
  const words: Record<string, string> = {};
  const reasons: Record<string, string> = {};

  const validCategories = Object.keys(categories.value);

  for (const line of lines) {
    if (line.trim()) {
      const parts = line.split('|');
      const word = parts[0]?.trim();
      if (!word) continue;

      // 如果选择了分类，则使用选择的分类
      if (selectedCategory.value) {
        words[word] = selectedCategory.value;
        // 解析原因（如果选择了分类，格式为：词汇|原因）
        if (parts.length >= 2 && parts[1]?.trim()) {
          reasons[word] = parts[1].trim();
        }
      } else {
        // 未选择分类，解析每行的分类和原因
        if (parts.length >= 2 && parts[1]?.trim()) {
          const secondPart = parts[1].trim();
          // 判断第二段是分类还是原因（检查是否是有效的分类名）
          if (validCategories.includes(secondPart)) {
            words[word] = secondPart;
            // 解析原因（格式：词汇|分类|原因）
            if (parts.length >= 3 && parts[2]?.trim()) {
              reasons[word] = parts[2].trim();
            }
          } else {
            // 第二段不是分类，作为原因，使用默认分类
            words[word] = 'Custom';
            reasons[word] = secondPart;
          }
        } else {
          // 只有词汇，使用默认分类
          words[word] = 'Custom';
        }
      }
    }
  }

  if (Object.keys(words).length === 0) {
    Message.warning('请输入有效的词汇');
    return;
  }

  addLoading.value = true;
  try {
    const result = await wordsApi.add(words, Object.keys(reasons).length > 0 ? reasons : undefined);
    if (result.success && result.data) {
      Message.success(`成功添加 ${result.data.added_count} 个敏感词`);
      newWords.value = '';
    } else {
      Message.error('添加失败: ' + (result.message || '未知错误'));
    }
  } catch (error: any) {
    Message.error('添加失败: ' + (error.message || '未知错误'));
  } finally {
    addLoading.value = false;
  }
};

const handleRemoveWords = async () => {
  if (!removeWords.value.trim()) {
    Message.warning('请输入要删除的关键词');
    return;
  }

  const words = removeWords.value.trim().split('\n')
    .map(line => line.trim())
    .filter(line => line);

  if (words.length === 0) {
    Message.warning('请输入有效的词汇');
    return;
  }

  removeLoading.value = true;
  try {
    const result = await wordsApi.delete(words);
    if (result.success && result.data) {
      Message.success(`成功删除 ${result.data.removed_count} 个敏感词`);
      removeWords.value = '';
    } else {
      Message.error('删除失败: ' + (result.message || '未知错误'));
    }
  } catch (error: any) {
    Message.error('删除失败: ' + (error.message || '未知错误'));
  } finally {
    removeLoading.value = false;
  }
};

const handleClearAll = () => {
  Modal.confirm({
    title: '确认清空',
    content: '确定要清空所有敏感词吗？此操作不可恢复！',
    onOk: async () => {
      clearLoading.value = true;
      try {
        const result = await wordsApi.clear();
        if (result.success && result.data !== undefined) {
          Message.success('已清空所有敏感词');
        } else {
          Message.error('清空失败: ' + (result.message || '未知错误'));
        }
      } catch (error: any) {
        Message.error('清空失败: ' + (error.message || '未知错误'));
      } finally {
        clearLoading.value = false;
      }
    },
  });
};

onMounted(() => {
  loadCategories();
});
</script>

<style scoped lang="less">
.words-view {
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

  .word-list-card {
    margin-top: 24px;

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
      padding: 12px 16px;
    }
  }

  :deep(.arco-textarea) {
    border-radius: 6px;
    transition: all 0.2s ease;
    font-family: 'Courier New', monospace;

    &:focus {
      border-color: #165DFF;
      box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.1);
    }
  }

  :deep(.arco-button) {
    border-radius: 6px;
    transition: all 0.2s ease;
    height: auto;
    padding: 2px 8px;
    font-size: 12px;
    min-width: auto;
  }

  .compact-button {
    padding: 1px 6px;
    font-size: 11px;
  }

  :deep(.arco-button:hover) {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  :deep(.arco-space) {
    width: 100%;
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

  :deep(.arco-form-item) {
    margin-bottom: 16px;
  }

  :deep(.arco-input) {
    border-radius: 6px;
    transition: all 0.2s ease;

    &:focus-within {
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
}
</style>
