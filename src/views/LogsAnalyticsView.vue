<template>
  <div class="analytics-container">
    <div class="page-header">
      <h2>日志分析</h2>
      <div class="header-actions">
        <a-button @click="loadData">
          <template #icon><icon-refresh /></template>
          刷新
        </a-button>
      </div>
    </div>

    <div class="stats-overview">
      <a-row :gutter="[12, 12]">
        <a-col :span="12" :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
          <a-statistic :title="'总请求数'" :value="stats.totalRequests" show-group-separator />
        </a-col>
        <a-col :span="12" :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
          <a-statistic :title="'敏感请求数'" :value="stats.sensitiveRequests" show-group-separator />
        </a-col>
        <a-col :span="12" :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
          <a-statistic :title="'敏感率'" :value="stats.sensitiveRate" :precision="2" suffix="%" />
        </a-col>
        <a-col :span="12" :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
          <a-statistic :title="'今日请求'" :value="stats.todayRequests" show-group-separator />
        </a-col>
      </a-row>
    </div>

    <div class="filter-section">
      <a-form :model="filterForm" :layout="isMobile ? 'vertical' : 'inline'">
        <a-form-item label="时间维度">
          <a-select v-model="timeDimension" style="width: 120px" @change="handleDimensionChange">
            <a-option value="hour">小时</a-option>
            <a-option value="day">日</a-option>
            <a-option value="month">月</a-option>
            <a-option value="year">年</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="时间范围">
          <a-range-picker
            v-if="timeDimension === 'hour'"
            v-model="dateRange"
            show-time
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DDTHH:mm:ssZ"
            :style="{ width: isMobile ? '100%' : '320px' }"
          />
          <a-range-picker
            v-else-if="timeDimension === 'day'"
            v-model="dateRange"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DDTHH:mm:ssZ"
            :style="{ width: isMobile ? '100%' : '320px' }"
          />
          <a-range-picker
            v-else-if="timeDimension === 'month'"
            v-model="dateRange"
            picker="month"
            format="YYYY-MM"
            value-format="YYYY-MM"
            :style="{ width: isMobile ? '100%' : '320px' }"
          />
          <a-range-picker
            v-else
            v-model="dateRange"
            picker="year"
            format="YYYY"
            value-format="YYYY"
            :style="{ width: isMobile ? '100%' : '320px' }"
          />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button @click="resetFilter" style="margin-left: 8px">重置</a-button>
        </a-form-item>
      </a-form>
    </div>

    <div class="charts-section">
      <a-row :gutter="16">
        <a-col :span="24" :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
          <a-card title="分类统计" :bordered="false">
            <div class="chart-container">
              <v-chart v-if="categoryChartData.length > 0" :option="categoryChartOption" style="width: 100%; height: 350px;" autoresize />
              <a-empty v-else description="暂无数据" />
            </div>
          </a-card>
        </a-col>
        <a-col :span="24" :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
          <a-card :title="getTrendChartTitle()" :bordered="false">
            <div class="chart-container">
              <v-chart v-if="hourlyChartData.length > 0" :option="trendChartOption" style="width: 100%; height: 350px;" autoresize />
              <a-empty v-else description="暂无数据" />
            </div>
          </a-card>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { Message } from '@arco-design/web-vue';
import { IconRefresh } from '@arco-design/web-vue/es/icon';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart, LineChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';

// 注册 echarts 组件
use([
  CanvasRenderer,
  PieChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
]);

interface Stats {
  totalRequests: number;
  sensitiveRequests: number;
  sensitiveRate: number;
  todayRequests: number;
}

const userStore = useUserStore();
const stats = reactive<Stats>({
  totalRequests: 0,
  sensitiveRequests: 0,
  sensitiveRate: 0,
  todayRequests: 0,
});

const dateRange = ref<string[]>([]);
const filterForm = reactive({});
const timeDimension = ref<string>('hour');
const isMobile = ref<boolean>(window.innerWidth < 768);

const categoryChartData = ref<any[]>([]);
const hourlyChartData = ref<any[]>([]);

const categoryChartOption = computed(() => {
  const option = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        type: 'pie',
        radius: '50%',
        data: categoryChartData.value,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };
  console.log('分类图表配置:', option);
  return option;
});

const trendChartOption = computed(() => {
  let xAxisData: string[];
  switch (timeDimension.value) {
    case 'hour':
      xAxisData = hourlyChartData.value.map(item => {
        const date = new Date(item.hour);
        return `${date.getHours().toString().padStart(2, '0')}:00`;
      });
      break;
    case 'day':
      xAxisData = hourlyChartData.value.map(item => {
        const date = new Date(item.hour);
        return `${date.getMonth() + 1}-${date.getDate()}`;
      });
      break;
    case 'month':
      xAxisData = hourlyChartData.value.map(item => {
        const date = new Date(item.hour);
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      });
      break;
    case 'year':
      xAxisData = hourlyChartData.value.map(item => item.hour);
      break;
    default:
      xAxisData = [];
  }

  const option = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLabel: { rotate: 45 },
    },
    yAxis: { type: 'value' },
    series: [
      {
        type: 'line',
        data: hourlyChartData.value.map(item => item.count),
        smooth: true,
        areaStyle: {},
      },
    ],
  };
  console.log('趋势图表配置:', option);
  return option;
});

const loadData = async () => {
  await loadStats();
};

const getTrendChartTitle = () => {
  const titleMap: Record<string, string> = {
    hour: '小时趋势',
    day: '日趋势',
    month: '月趋势',
    year: '年趋势',
  };
  return titleMap[timeDimension.value] || '趋势分析';
};

const handleDimensionChange = () => {
  resetFilter();
};

const loadStats = async () => {
  try {
    let startTime: Date;
    let endTime: Date;

    if (dateRange.value && dateRange.value.length === 2) {
      startTime = new Date(dateRange.value[0]);
      endTime = new Date(dateRange.value[1]);
    } else {
      const now = new Date();
      if (timeDimension.value === 'hour' || timeDimension.value === 'day') {
        startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      } else if (timeDimension.value === 'month') {
        startTime = new Date(now.getFullYear(), 0, 1);
        endTime = new Date(now.getFullYear(), 11, 31);
      } else {
        startTime = new Date(now.getFullYear() - 5, 0, 1);
        endTime = new Date(now.getFullYear(), 11, 31);
      }
    }

    const params = new URLSearchParams({
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      group_by: timeDimension.value,
    });

    const response = await fetch(`/api/v1/logs/stats?${params}`, {
      headers: {
        Authorization: `Bearer ${userStore.token}`,
      },
    });

    if (!response.ok) {
      throw new Error('获取统计失败');
    }

    const result = await response.json();
    console.log('API返回原始数据:', result);
    if (result.success) {
      const data = result.data;
      console.log('解析后的data:', data);
      stats.totalRequests = Number(data.total_requests) || 0;
      stats.sensitiveRequests = Number(data.sensitive_requests) || 0;
      stats.sensitiveRate = stats.totalRequests > 0 ? (stats.sensitiveRequests / stats.totalRequests) * 100 : 0;

      // 处理分类统计数据
      const tempCategoryData: Array<{ name: string; value: number }> = [];
      if (data.category_stats) {
        console.log('category_stats:', data.category_stats);
        for (const [category, count] of Object.entries(data.category_stats as Record<string, number>)) {
          tempCategoryData.push({
            name: category,
            value: count,
          });
        }
        console.log('分类数据:', tempCategoryData);
      } else {
        console.warn('category_stats不存在或为空');
      }
      categoryChartData.value = tempCategoryData;

      // 处理时间维度统计数据
      const tempHourlyData: Array<{ hour: string; count: number }> = [];
      let statsField: string;
      switch (timeDimension.value) {
        case 'hour':
          statsField = 'hourly_stats';
          break;
        case 'day':
          statsField = 'daily_stats';
          break;
        case 'month':
          statsField = 'monthly_stats';
          break;
        case 'year':
          statsField = 'yearly_stats';
          break;
        default:
          statsField = 'hourly_stats';
      }

      if (data[statsField]) {
        console.log(`${statsField}:`, data[statsField]);
        for (const [hour, count] of Object.entries(data[statsField] as Record<string, number>)) {
          tempHourlyData.push({
            hour,
            count,
          });
        }
        tempHourlyData.sort((a, b) => a.hour.localeCompare(b.hour));
        console.log('时间数据:', tempHourlyData);
      } else {
        console.warn(`${statsField}不存在或为空`);
      }
      hourlyChartData.value = tempHourlyData;

      // 只有在小时或日维度时才计算今日请求
      if (timeDimension.value === 'hour' || timeDimension.value === 'day') {
        const today = new Date().toDateString();
        stats.todayRequests = hourlyChartData.value
          .filter(item => new Date(item.hour).toDateString() === today)
          .reduce((sum, item) => sum + item.count, 0);
      } else {
        stats.todayRequests = 0;
      }

      console.log('最终状态 - 分类数据长度:', categoryChartData.value.length, '小时数据长度:', hourlyChartData.value.length);
    } else {
      console.error('API返回失败:', result);
    }
  } catch (error) {
    console.error('加载统计失败:', error);
    Message.error('加载统计失败');
  }
};

const handleSearch = () => {
  loadStats();
};

const resetFilter = () => {
  dateRange.value = [];
  loadStats();
};

// 监听窗口大小变化
const handleResize = () => {
  isMobile.value = window.innerWidth < 768;
};

onMounted(() => {
  const now = new Date();
  let start: Date;
  let end: Date;

  if (timeDimension.value === 'hour' || timeDimension.value === 'day') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  } else if (timeDimension.value === 'month') {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear(), 11, 31);
  } else {
    start = new Date(now.getFullYear() - 5, 0, 1);
    end = new Date(now.getFullYear(), 11, 31);
  }

  dateRange.value = [start.toISOString(), end.toISOString()];

  window.addEventListener('resize', handleResize);
  loadData();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.analytics-container {
  padding: 12px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-header h2 {
  margin: 0;
  color: var(--color-text-1);
  font-size: 18px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.stats-overview {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--color-bg-2);
  border-radius: 8px;
}

.filter-section {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--color-bg-2);
  border-radius: 8px;
}

.charts-section {
  margin-bottom: 16px;
}

/* 图表容器样式 */
.chart-container {
  width: 100%;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.charts-section :deep(.arco-card-body) {
  padding: 12px;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .analytics-container {
    padding: 8px;
  }

  .page-header h2 {
    font-size: 16px;
  }

  .stats-overview {
    padding: 8px;
  }

  .filter-section {
    padding: 8px;
  }

  .stats-overview :deep(.arco-statistic-title) {
    font-size: 12px;
  }

  .stats-overview :deep(.arco-statistic-value) {
    font-size: 20px;
  }

  .filter-section :deep(.arco-form-item-label-col) {
    padding-bottom: 4px;
  }

  .chart-container {
    min-height: 250px;
  }

  .charts-section :deep(.arco-card) {
    margin-bottom: 12px;
  }

  .charts-section :deep(.arco-card:last-child) {
    margin-bottom: 0;
  }

  .charts-section :deep(.arco-card-header) {
    padding: 8px 12px;
  }

  .charts-section :deep(.arco-card-body) {
    padding: 8px;
  }
}

/* 平板端优化 */
@media (min-width: 769px) and (max-width: 1024px) {
  .analytics-container {
    padding: 16px;
  }
}
</style>
