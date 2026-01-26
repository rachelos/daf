<template>
  <div class="correction-view">
    <a-row :gutter="24">
      <a-col :xs="24" :lg="24">
        <a-card title="文本纠错" :bordered="false">
          <a-form layout="vertical">
            <a-form-item label="输入文本">
              <a-textarea
                v-model="correctText"
                placeholder="请输入需要纠错的文本内容..."
                :auto-size="{ minRows: 8, maxRows: 15 }"
                allow-clear
              />
            </a-form-item>

            <a-space :size="12">
              <a-button type="primary" @click="handleCorrect" :loading="loading">
                <template #icon>
                  <icon-thunderbolt />
                </template>
                开始纠错
              </a-button>
              <a-button @click="handleClear">
                <template #icon>
                  <icon-delete />
                </template>
                清空
              </a-button>
            </a-space>
          </a-form>

          <a-alert
            v-if="correctResult && correctResult.length > 0"
            type="warning"
            class="mt-4"
          >
            <template #icon>
              <icon-thunderbolt />
            </template>
            <div>发现 {{ correctResult.length }} 处可能需要修正的地方</div>
          </a-alert>

          <a-alert
            v-else-if="correctResult && correctResult.length === 0"
            type="success"
            class="mt-4"
          >
            <template #icon>
              <icon-check-circle />
            </template>
            <div>✓ 文本内容完整，未发现需要修正的地方</div>
          </a-alert>

          <a-card
            v-if="correctResult && correctResult.length > 0"
            title="纠错建议"
            class="result-card mt-4"
            :bordered="false"
          >
            <a-list :data="correctResult" :bordered="false">
              <template #item="{ item, index }">
                <div class="correction-item">
                  <div class="item-header">
                    <div class="item-index">#{{ index + 1 }}</div>
                    <div class="item-category">
                      <a-tag :color="getCategoryColor(item.category)">
                        {{ getCategoryName(item.category) }}
                      </a-tag>
                    </div>
                  </div>

                  <div class="item-content">
                    <div class="original-word">
                      <span class="label">原词:</span>
                      <span class="word">{{ item.word }}</span>
                      <span class="position">[位置: {{ item.position }}]</span>
                    </div>

                    <div class="suggestions">
                      <span class="label">建议:</span>
                      <a-space :size="6" wrap>
                        <a-tag
                          v-for="(suggest, idx) in item.suggests"
                          :key="idx"
                          color="arcoblue"
                          checkable
                          :checked="item.selected === idx"
                          @click="item.selected = idx"
                        >
                          {{ suggest }}
                        </a-tag>
                      </a-space>
                    </div>
                  </div>

                  <a-divider style="margin: 8px 0" />
                </div>
              </template>
            </a-list>

            <a-space :size="12" class="action-buttons">
              <a-button type="primary" @click="handleApplyAll" :loading="applying">
                <template #icon>
                  <icon-check />
                </template>
                应用全部建议
              </a-button>
              <a-button @click="handleApplySelected">
                <template #icon>
                  <icon-check-circle />
                </template>
                应用选中建议
              </a-button>
            </a-space>
          </a-card>

          <a-card
            v-if="correctedText"
            title="修正后的文本"
            class="result-card mt-4"
            :bordered="false"
          >
            <a-typography-paragraph
              :copyable="{ text: correctedText }"
            >
              {{ correctedText }}
            </a-typography-paragraph>

            <a-space :size="12">
              <a-button type="outline" @click="copyCorrected">
                <template #icon>
                  <icon-copy />
                </template>
                复制文本
              </a-button>
              <a-button type="outline" @click="copyOriginal">
                <template #icon>
                  <icon-clipboard />
                </template>
                复制原文
              </a-button>
            </a-space>
          </a-card>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Message } from '@arco-design/web-vue';
import { detectApi, categoriesApi } from '@/api';

interface Suggestion {
  word: string;
  position: number;
  suggests: string[];
  category: string;
  selected?: number;
}

const correctText = ref('');
const loading = ref(false);
const applying = ref(false);
const correctResult = ref<Suggestion[]>([]);
const correctedText = ref('');

const categoryMap = ref<Record<string, string>>({});
const categoryColorMap = ref<Record<string, string>>({});

// 加载分类配置
const loadCategories = async () => {
  try {
    const result = await categoriesApi.get();
    if (result.success && result.data) {
      categoryMap.value = result.data;

      // 生成颜色映射
      const colors = ['gray', 'red', 'blue', 'orange', 'purple', 'magenta', 'cyan', 'arcoblue', 'orangered', 'green', 'gold', 'lime', 'pink', 'volcano'];
      const colorMap: Record<string, string> = {};
      Object.keys(result.data).forEach((key, index) => {
        colorMap[key] = colors[index % colors.length];
      });
      categoryColorMap.value = colorMap;
    }
  } catch (error) {
    console.error('加载分类失败:', error);
    // 使用默认映射作为降级
    categoryMap.value = {
      '0': '未分类',
      '1': '涉黄',
      '2': '涉政',
      '3': '暴力',
      '4': '赌博',
      '5': '毒品',
      '6': '脏话',
      '7': '歧视',
      '8': '诈骗',
      '9': '广告',
      '10': '非法网址',
      '11': '非法网址',
    };
    categoryColorMap.value = {
      '0': 'gray',
      '1': 'red',
      '2': 'blue',
      '3': 'orange',
      '4': 'purple',
      '5': 'magenta',
      '6': 'cyan',
      '7': 'arcoblue',
      '8': 'orangered',
      '9': 'green',
      '10': 'gold',
      '11': 'lime',
    };
  }
};

const handleCorrect = async () => {
  if (!correctText.value.trim()) {
    Message.warning('请输入需要纠错的文本');
    return;
  }

  loading.value = true;
  correctResult.value = [];
  correctedText.value = '';

  try {
    const result = await detectApi.suggest(correctText.value);
    if (result.success && result.data) {
      // 为每个建议添加选中索引
      correctResult.value = result.data.map((item: Suggestion) => ({
        ...item,
        selected: 0, // 默认选中第一个建议
      }));

      if (correctResult.value.length === 0) {
        Message.info('未发现需要修正的地方');
      } else {
        Message.success(`发现 ${correctResult.value.length} 处需要修正的地方`);
      }
    } else {
      Message.error('纠错失败: ' + (result.message || '未知错误'));
    }
  } catch (error: any) {
    Message.error('纠错失败: ' + (error.message || '未知错误'));
  } finally {
    loading.value = false;
  }
};

const handleClear = () => {
  correctText.value = '';
  correctResult.value = [];
  correctedText.value = '';
  Message.info('已清空');
};

const handleApplyAll = async () => {
  if (correctResult.value.length === 0) {
    Message.warning('没有可应用的纠错建议');
    return;
  }

  applying.value = true;
  try {
    let text = correctText.value;

    // 按位置从大到小排序,避免位置偏移
    const sorted = [...correctResult.value]
      .filter((item) => item.suggests && item.suggests.length > 0)
      .sort((a, b) => b.position - a.position);

    for (const item of sorted) {
      if (item.suggests.length > 0) {
        const replacement = item.suggests[0];
        text = text.substring(0, item.position) + replacement + text.substring(item.position + item.word.length);
      }
    }

    correctedText.value = text;
    Message.success('已应用全部建议');
  } catch (error) {
    Message.error('应用建议失败');
  } finally {
    applying.value = false;
  }
};

const handleApplySelected = async () => {
  if (correctResult.value.length === 0) {
    Message.warning('没有可应用的纠错建议');
    return;
  }

  applying.value = true;
  try {
    let text = correctText.value;

    // 按位置从大到小排序,避免位置偏移
    const sorted = [...correctResult.value]
      .filter((item) => item.suggests && item.suggests.length > 0 && item.selected !== undefined)
      .sort((a, b) => b.position - a.position);

    for (const item of sorted) {
      if (item.selected !== undefined && item.suggests[item.selected]) {
        const replacement = item.suggests[item.selected];
        text = text.substring(0, item.position) + replacement + text.substring(item.position + item.word.length);
      }
    }

    correctedText.value = text;
    Message.success('已应用选中建议');
  } catch (error) {
    Message.error('应用建议失败');
  } finally {
    applying.value = false;
  }
};

const copyCorrected = async () => {
  if (!correctedText.value) {
    Message.warning('没有可复制的修正文本');
    return;
  }
  try {
    await navigator.clipboard.writeText(correctedText.value);
    Message.success('已复制修正后的文本');
  } catch (error) {
    Message.error('复制失败');
  }
};

const copyOriginal = async () => {
  if (!correctText.value) {
    Message.warning('没有可复制的原文');
    return;
  }
  try {
    await navigator.clipboard.writeText(correctText.value);
    Message.success('已复制原文');
  } catch (error) {
    Message.error('复制失败');
  }
};

const getCategoryName = (category: string): string => {
  return categoryMap.value[category] || '未分类';
};

const getCategoryColor = (category: string): string => {
  return categoryColorMap.value[category] || 'gray';
};

// 组件挂载时加载分类
onMounted(() => {
  loadCategories();
});
</script>

<style scoped lang="less">
.correction-view {
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

  .mt-4 {
    margin-top: 16px;
  }

  :deep(.arco-alert) {
    border-radius: 6px;
  }

  .result-card {
    background: #f7f8fa;

    :deep(.arco-card-header) {
      border-bottom: 1px solid #e5e6eb;
      padding: 12px 16px;
    }
  }

  .correction-item {
    padding: 0;

    .item-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .item-index {
      font-size: 14px;
      font-weight: 500;
      color: #165DFF;
    }

    .item-content {
      .original-word {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        padding: 8px 12px;
        background: #fff;
        border-radius: 4px;
        border-left: 3px solid #F53F3F;

        .label {
          font-size: 13px;
          color: #4e5969;
          font-weight: 500;
        }

        .word {
          font-size: 15px;
          font-weight: 600;
          color: #F53F3F;
          padding: 2px 8px;
          background: #ffece8;
          border-radius: 3px;
        }

        .position {
          font-size: 12px;
          color: #86909c;
          margin-left: auto;
          font-family: 'Courier New', monospace;
        }
      }

      .suggestions {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #fff;
        border-radius: 4px;
        border-left: 3px solid #165DFF;

        .label {
          font-size: 13px;
          color: #4e5969;
          font-weight: 500;
          min-width: 40px;
        }
      }
    }

    :deep(.arco-divider) {
      margin: 12px 0;
    }
  }

  .action-buttons {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e5e6eb;
  }

  :deep(.arco-tag) {
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }

    &.arco-tag-checked {
      background: #165DFF;
      color: #fff;
      border-color: #165DFF;
    }
  }
}
</style>
