<template>
  <div class="detection-view">
    <a-row :gutter="24">
      <a-col :xs="24" :lg="24">
        <a-card title="文本检测" :bordered="false">
          <a-form layout="vertical">
            <a-form-item label="输入文本">
              <a-textarea
                v-model="detectText"
                placeholder="请输入要检测的文本内容..."
                :auto-size="{ minRows: 6, maxRows: 10 }"
                allow-clear
              />
            </a-form-item>

            <a-form-item label="检测分类">
              <a-select v-model="detectCategory" placeholder="全部分类" allow-clear>
                <a-option value="">全部分类</a-option>
                <a-option v-for="(name, key) in categories" :key="key" :value="key">
                  {{ name }}
                </a-option>
              </a-select>
            </a-form-item>

            <a-form-item label="AI检测">
              <a-checkbox v-model="useAI">启用AI辅助检测</a-checkbox>
            </a-form-item>

            <a-space :size="12">
              <a-button type="primary" @click="handleDetect" :loading="loading">
                <template #icon>
                  <icon-search />
                </template>
                快速检测
              </a-button>
              <a-button type="primary" @click="handleDetectAll" :loading="loading">
                <template #icon>
                  <icon-check-circle />
                </template>
                全量检测
              </a-button>
            </a-space>
          </a-form>

          <a-alert
            v-if="detectResult"
            :type="detectResult.has_sensitive ? 'error' : 'success'"
            class="mt-4"
          >
            <template #icon>
              <icon-exclamation-circle v-if="detectResult.has_sensitive" />
              <icon-check-circle v-else />
            </template>
            <div v-if="detectResult.has_sensitive && detectResult.words?.length">
              <strong>发现敏感词:</strong>
              <ul class="word-list">
                <li v-for="word in detectResult.words" :key="word.word">
                  <span class="word">{{ word.word }}</span>
                  <span class="category">({{ word.category }})</span>
                  <span class="position">[{{ word.start_pos }}-{{ word.end_pos }}]</span>
                  <span v-if="word.reason" class="reason">原因: {{ word.reason }}</span>
                </li>
              </ul>
            </div>
            <div v-else>✓ 文本内容安全，未发现敏感词</div>
          </a-alert>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Message } from '@arco-design/web-vue';
import { detectApi, categoriesApi } from '@/api';

interface DetectWord {
  word: string;
  category: string;
  start_pos: number;
  end_pos: number;
  reason?: string;
}

interface DetectResult {
  has_sensitive: boolean;
  words?: DetectWord[];
  original_text: string;
}

const detectText = ref('');
const detectCategory = ref('');
const useAI = ref(false);
const loading = ref(false);
const detectResult = ref<DetectResult | null>(null);
const categories = ref<Record<string, string>>({});

const handleDetect = async () => {
  if (!detectText.value.trim()) {
    Message.warning('请输入要检测的文本');
    return;
  }
  loading.value = true;
  try {
    const result = await detectApi.detect(detectText.value, detectCategory.value || undefined, true, useAI.value);
    if (result.success && result.data) {
      detectResult.value = result.data;
      // 保存检测文本到本地存储
      localStorage.setItem('lastDetectText', detectText.value);
    } else {
      Message.error('检测失败: ' + (result.message || '未知错误'));
    }
  } catch (error: any) {
    Message.error('检测失败: ' + (error.message || '未知错误'));
  } finally {
    loading.value = false;
  }
};

const handleDetectAll = async () => {
  if (!detectText.value.trim()) {
    Message.warning('请输入要检测的文本');
    return;
  }
  loading.value = true;
  try {
    const result = await detectApi.detectAll(detectText.value, true, useAI.value);
    if (result.success && result.data) {
      detectResult.value = result.data;
      // 保存检测文本到本地存储
      localStorage.setItem('lastDetectText', detectText.value);
    } else {
      Message.error('检测失败: ' + (result.message || '未知错误'));
    }
  } catch (error: any) {
    Message.error('检测失败: ' + (error.message || '未知错误'));
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
  // 从本地存储读取上次检测的文本
  const lastText = localStorage.getItem('lastDetectText');
  if (lastText) {
    detectText.value = lastText;
  }
});
</script>

<style scoped lang="less">
.detection-view {
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

  :deep(.arco-select) {
    border-radius: 6px;
  }

  :deep(.arco-button) {
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  :deep(.arco-button:hover) {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .mt-4 {
    margin-top: 16px;
  }

  :deep(.arco-alert) {
    border-radius: 6px;
  }

  .word-list {
    list-style: none;
    padding: 0;
    margin: 12px 0 0 0;

    li {
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      background: #f7f8fa;
      border-radius: 4px;
      margin-bottom: 6px;
      transition: all 0.2s ease;

      &:hover {
        background: #e8f4ff;
      }

      .word {
        font-weight: 500;
        color: #f53f3f;
      }

      .category {
        color: #4e5969;
        background: #e5e6eb;
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 12px;
      }

      .position {
        font-size: 12px;
        color: #86909c;
        font-family: 'Courier New', monospace;
      }

      .reason {
        font-size: 12px;
        color: #ff7d00;
        margin-left: auto;
        background: #fff7e8;
        padding: 2px 8px;
        border-radius: 3px;
      }
    }
  }
}
</style>
