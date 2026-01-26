<template>
  <div class="correction-words-view">
    <a-row :gutter="24">
      <a-col :xs="24" :lg="12">
        <a-card title="添加纠错词" :bordered="false">
          <a-form layout="vertical">
            <a-form-item label="词汇列表 (每行一个)">
              <a-textarea
                v-model="newWords"
                placeholder="示例:
优势
重视
系统
门禁
发展
"
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
        <a-card title="删除纠错词" :bordered="false">
          <a-form layout="vertical">
            <a-form-item label="词汇列表 (每行一个)">
              <a-textarea
                v-model="removeWords"
                placeholder="示例:
优势
重视
系统"
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
import { ref, onMounted } from 'vue';
import { Message, Modal } from '@arco-design/web-vue';
import { api } from '@/api';

interface CorrectionStats {
  total_count: number;
  words?: Record<string, string>;
}

// 纠错建议接口（预留）
// interface Correction {
//   word: string;
//   position: number;
//   suggests: string[];
// }

// 测试接口（预留）
// interface TestResult {
//   text: string;
//   has_errors: boolean;
//   corrections: Correction[];
// }

const newWords = ref('');
const removeWords = ref('');
const addLoading = ref(false);
const removeLoading = ref(false);
const clearLoading = ref(false);
const stats = ref<CorrectionStats>({ total_count: 0 });

const API_BASE = '/correction';

const loadStats = async () => {
  try {
    const response = await api.get(`${API_BASE}/words`);
    if (response.success && response.data) {
      stats.value = {
        total_count: response.data.total_count || 0,
        words: response.data.words || {},
      };
    }
  } catch (error) {
    console.error('加载统计失败', error);
    Message.error('加载统计失败');
  }
};

const handleAddWords = async () => {
  if (!newWords.value.trim()) {
    Message.warning('请输入要添加的纠错词');
    return;
  }

  const lines = newWords.value.trim().split('\n');
  const words: string[] = [];

  for (const line of lines) {
    const word = line.trim();
    if (word) {
      words.push(word);
    }
  }

  if (words.length === 0) {
    Message.warning('请输入有效的词汇');
    return;
  }

  addLoading.value = true;
  try {
    const response = await api.post(`${API_BASE}/words`, { words });
    if (response.success && response.data) {
      Message.success(`成功添加 ${response.data.added_count} 个纠错词`);
      newWords.value = '';
      loadStats();
    } else {
      Message.error('添加失败: ' + (response.message || '未知错误'));
    }
  } catch (error: any) {
    Message.error('添加失败: ' + (error.response?.data?.message || error.message || '未知错误'));
  } finally {
    addLoading.value = false;
  }
};

const handleRemoveWords = async () => {
  if (!removeWords.value.trim()) {
    Message.warning('请输入要删除的纠错词');
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
    const response = await api.delete(`${API_BASE}/words`, { data: { words } });
    if (response.success && response.data) {
      Message.success(`成功删除 ${response.data.removed_count} 个纠错词`);
      removeWords.value = '';
      loadStats();
    } else {
      Message.error('删除失败: ' + (response.message || '未知错误'));
    }
  } catch (error: any) {
    Message.error('删除失败: ' + (error.response?.data?.message || error.message || '未知错误'));
  } finally {
    removeLoading.value = false;
  }
};

const handleClearAll = () => {
  Modal.confirm({
    title: '确认清空',
    content: '确定要清空所有纠错词吗？此操作不可恢复！',
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      clearLoading.value = true;
      try {
        const response = await api.delete(`${API_BASE}/words/clear`);
        if (response.success) {
          Message.success('已清空所有纠错词');
          stats.value = { total_count: 0 };
        } else {
          Message.error('清空失败: ' + (response.message || '未知错误'));
        }
      } catch (error: any) {
        Message.error('清空失败: ' + (error.response?.data?.message || error.message || '未知错误'));
      } finally {
        clearLoading.value = false;
      }
    },
  });
};

// 测试建议函数（预留）
// const handleTestSuggest = async () => {
//   if (!testText.value.trim()) {
//     Message.warning('请输入测试文本');
//     return;
//   }
//
//   testLoading.value = true;
//   testResult.value = null;
//
//   try {
//     const response = await api.post(`${API_BASE}/suggest`, { text: testText.value });
//     if (response.success && response.data !== undefined) {
//       testResult.value = {
//         text: testText.value,
//         has_errors: Array.isArray(response.data) && response.data.length > 0,
//         corrections: response.data || [],
//       };
//     } else {
//       Message.error('测试失败: ' + (response.message || '未知错误'));
//     }
//   } catch (error: any) {
//     Message.error('测试失败: ' + (error.response?.data?.message || error.message || '未知错误'));
//   } finally {
//     testLoading.value = false;
//   }
// };

onMounted(() => {
  loadStats();
});
</script>

<style scoped lang="less">
.correction-words-view {
  margin: 0 auto;

  :deep(.arco-card) {
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
  }

  :deep(.arco-textarea) {
    border-radius: 6px;
    transition: all 0.2s ease;
    font-family: 'Courier New', monospace;
  }

  :deep(.arco-textarea:focus) {
    border-color: #165DFF;
    box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.1);
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

  .mt-4 {
    margin-top: 16px;
  }

  :deep(.arco-descriptions) {
    .arco-descriptions-item {
      padding: 12px;
    }

    .arco-descriptions-item-label {
      font-weight: 500;
    }
  }

  :deep(.arco-statistic) {
    .arco-statistic-value {
      font-size: 24px;
    }
  }

  .category-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .test-result {
    .result-title {
      font-weight: 500;
      margin-bottom: 8px;
    }

    .correction-item {
      margin-top: 8px;
      padding: 8px;
      background: rgba(0, 0, 0, 0.02);
      border-radius: 4px;

      .error-word {
        margin-bottom: 4px;
        color: #f53f3f;
      }

      .suggest-word {
        color: #00b42a;
      }
    }
  }

  :deep(.arco-alert) {
    border-radius: 6px;
  }
}
</style>
