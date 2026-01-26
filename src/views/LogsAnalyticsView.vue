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
      <a-row :gutter="16">
        <a-col :span="6">
          <a-statistic :title="'总请求数'" :value="stats.totalRequests" show-group-separator />
        </a-col>
        <a-col :span="6">
          <a-statistic :title="'敏感请求数'" :value="stats.sensitiveRequests" show-group-separator />
        </a-col>
        <a-col :span="6">
          <a-statistic :title="'敏感率'" :value="stats.sensitiveRate" :precision="2" suffix="%" />
        </a-col>
        <a-col :span="6">
          <a-statistic :title="'今日请求'" :value="stats.todayRequests" show-group-separator />
        </a-col>
      </a-row>
    </div>

    <div class="filter-section">
      <a-form :model="filterForm" layout="inline">
        <a-form-item label="时间范围">
          <a-range-picker
            v-model="dateRange"
            show-time
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DDTHH:mm:ssZ"
            style="width: 320px"
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
        <a-col :span="12">
          <a-card title="分类统计" :bordered="false">
            <v-chart v-if="categoryChartData.length > 0" :option="categoryChartOption" autoresize />
            <a-empty v-else description="暂无数据" />
          </a-card>
        </a-col>
        <a-col :span="12">
          <a-card title="小时趋势" :bordered="false">
            <v-chart v-if="hourlyChartData.length > 0" :option="hourlyChartOption" autoresize />
            <a-empty v-else description="暂无数据" />
          </a-card>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { Message } from '@arco-design/web-vue';
import { IconRefresh } from '@arco-design/web-vue/es/icon';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart, LineChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import VChart from 'vue-echarts';

use([CanvasRenderer, PieChart, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);

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

const categoryChartData = ref<any[]>([]);
const hourlyChartData = ref<any[]>([]);

const categoryChartOption = computed(() => ({
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
}));

const hourlyChartOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: hourlyChartData.value.map(item => item.hour),
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
}));

const loadData = async () => {
  await loadStats();
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
      startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    }

    const params = new URLSearchParams({
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      group_by: 'hour',
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
    if (result.success) {
      const data = result.data;
      stats.totalRequests = Number(data.total_requests) || 0;
      stats.sensitiveRequests = Number(data.sensitive_requests) || 0;
      stats.sensitiveRate = stats.totalRequests > 0 ? (stats.sensitiveRequests / stats.totalRequests) * 100 : 0;

      categoryChartData.value = [];
      if (data.category_stats) {
        for (const [category, count] of Object.entries(data.category_stats as Record<string, number>)) {
          categoryChartData.value.push({
            name: category,
            value: count,
          });
        }
      }

      hourlyChartData.value = [];
      if (data.hourly_stats) {
        for (const [hour, count] of Object.entries(data.hourly_stats as Record<string, number>)) {
          hourlyChartData.value.push({
            hour,
            count,
          });
        }
        hourlyChartData.value.sort((a, b) => a.hour.localeCompare(b.hour));
      }

      const today = new Date().toDateString();
      stats.todayRequests = hourlyChartData.value
        .filter(item => new Date(item.hour).toDateString() === today)
        .reduce((sum, item) => sum + item.count, 0);
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

onMounted(() => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  dateRange.value = [start.toISOString(), end.toISOString()];

  loadData();
});
</script>

<style scoped>
.analytics-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: var(--color-text-1);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.stats-overview {
  margin-bottom: 20px;
  padding: 20px;
  background: var(--color-bg-2);
  border-radius: 8px;
}

.filter-section {
  margin-bottom: 20px;
  padding: 20px;
  background: var(--color-bg-2);
  border-radius: 8px;
}

.charts-section {
  margin-bottom: 20px;
}
</style>
