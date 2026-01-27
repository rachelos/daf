<template>
  <div class="stats-view">
    <a-card title="数据统计" :bordered="false">
      <a-row :gutter="24" class="stats-row">
        <a-col :xs="24" :sm="12" :lg="6">
          <a-card class="stat-card" :bordered="false">
            <a-statistic title="今日检测" :value="stats.today" :value-style="{ color: getCategoryColor(stats.today) }" group-separator=",">
            </a-statistic>
          </a-card>
        </a-col>

        <a-col :xs="24" :sm="12" :lg="6">
          <a-card class="stat-card" :bordered="false">
            <a-statistic title="敏感词命中" :value="stats.sensitive" :value-style="{ color: getCategoryColor(stats.sensitive) }" group-separator=",">
            </a-statistic>
          </a-card>
        </a-col>

        <a-col :xs="24" :sm="12" :lg="6">
          <a-card class="stat-card" :bordered="false">
            <a-statistic title="词库规模" :value="stats.words" :value-style="{ color: getCategoryColor(stats.words) }" group-separator=",">
            </a-statistic>
          </a-card>
        </a-col>

        <a-col :xs="24" :sm="12" :lg="6">
          <a-card class="stat-card" :bordered="false">
            <a-statistic title="分类数量" :value="stats.categories" :value-style="{ color:  getCategoryColor(stats.categories) }" group-separator=",">
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>
    </a-card>

    <a-divider style="margin: 24px 0;" />

    <a-card title="分类统计" :bordered="false">
      <a-row :gutter="16">
        <a-col v-for="category in categoryData" :key="category.key" :xs="24" :sm="12" :md="8" :lg="6" :xl="4">
          <a-card class="stat-card" :bordered="false">
            <a-statistic :title="category.name" :value="category.count"
              :value-style="{ color: getCategoryColor(category.count) }" group-separator=",">
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>
    </a-card>


  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Message } from '@arco-design/web-vue';
import { healthApi, categoriesApi, wordsApi, logsApi } from '@/api';

const stats = reactive({
  today: 0,
  sensitive: 0,
  words: 0,
  categories: 0,
});

const statusOnline = ref(false);
const lastCheckTime = ref('');
const categoryData = ref<Array<{ key: string; name: string; count: number }>>([]);

const loadData = async () => {
  try {
    // 计算今日的时间范围
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 转换为ISO格式字符串
    const startTime = todayStart.toISOString();
    const endTime = todayEnd.toISOString();

    const [categories, wordCount, todayStats] = await Promise.all([
      categoriesApi.get(),
      wordsApi.get({ page: 1, page_size: 1 }),
      logsApi.getStats(startTime, endTime),
    ]);

    if (categories.success && categories.data) {
      stats.categories = Object.keys(categories.data).length;
      categoryData.value = Object.entries(categories.data).map(([key, name]) => ({
        key,
        name,
        count: 0,
      }));
    }

    if (wordCount.success && wordCount.data) {
      stats.words = wordCount.data.total_count;
      if (wordCount.data.category_count) {
        Object.entries(wordCount.data.category_count).forEach(([key, count]) => {
          const category = categoryData.value.find(c => c.key === key);
          if (category) {
            category.count = count as number;
          }
        });
      }
    }

    // 更新今日统计数据
    if (todayStats.success && todayStats.data) {
      stats.today = todayStats.data.total_requests || 0;
      stats.sensitive = todayStats.data.sensitive_requests || 0;
    }
  } catch (error) {
    console.error('加载数据失败', error);
    Message.error('加载数据失败');
  }
};

const checkHealth = async () => {
  try {
    await healthApi.check();
    statusOnline.value = true;
    lastCheckTime.value = new Date().toLocaleString('zh-CN');
  } catch (error) {
    statusOnline.value = false;
    lastCheckTime.value = new Date().toLocaleString('zh-CN');
  }
};

const getCategoryColor = (categoryCount: number) => {
  if (categoryCount <= 0) {
    return '#cccccc';
  }
  if (categoryCount <= 100) {
    return '#FF7D00';
  }
  if (categoryCount <= 200) {
    return '#D91AD9';
  }
  if (categoryCount <= 300) {
    return '#722ED1';
  }
  if (categoryCount <= 400) {
    return '#F53F3F';
  }
  if (categoryCount <= 500) {
    return '#165DFF';
  }
  return "#F53F3F"
};


onMounted(() => {
  loadData();
  checkHealth();
});
</script>

<style scoped lang="less">
.stats-view {
  margin: 0 auto;
}

.stats-row {
  margin-bottom: 0;
}

.stat-card {
  transition: all 0.3s ease;
  text-align: center;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }
}

:deep(.arco-statistic-title) {
  font-size: 14px;
  color: var(--color-text-2);
}

:deep(.arco-statistic-value) {
  font-size: 32px;
  font-weight: 600;
}

.category-stats,
.system-status {
  margin-top: 24px;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
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
  padding: 12px 16px;
}

:deep(.arco-descriptions-item-label) {
  background-color: #f7f8fa;
  font-weight: 500;
}
</style>
