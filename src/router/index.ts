import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { Message } from '@arco-design/web-vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/views/LayoutView.vue'),
    redirect: '/stats',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'stats',
        name: 'Stats',
        component: () => import('@/views/StatsView.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'detection',
        name: 'Detection',
        component: () => import('@/views/DetectionView.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'filter',
        name: 'Filter',
        component: () => import('@/views/FilterView.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'correction',
        name: 'Correction',
        component: () => import('@/views/CorrectionView.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'correction-words',
        name: 'CorrectionWords',
        component: () => import('@/views/CorrectionWordsView.vue'),
        meta: { requiresAuth: true, requiresWordManager: true },
      },
      {
        path: 'words',
        name: 'Words',
        component: () => import('@/views/WordsView.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'words-list',
        name: 'WordsList',
        component: () => import('@/views/WordsListView.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/UsersView.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'access-keys',
        name: 'AccessKeys',
        component: () => import('@/views/AccessKeysView.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'login-logs',
        name: 'LoginLogs',
        component: () => import('@/views/LoginLogsView.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'detection-logs',
        name: 'DetectionLogs',
        component: () => import('@/views/DetectionLogsView.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'logs-analytics',
        name: 'LogsAnalytics',
        component: () => import('@/views/LogsAnalyticsView.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('@/views/CategoriesView.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'config',
        name: 'Config',
        component: () => import('@/views/ConfigView.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'webscan',
        name: 'WebScan',
        component: () => import('@/views/WebScanView.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/stats',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore();

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!userStore.token) {
      Message.error('请先登录');
      next('/login');
      return;
    }

    if (to.matched.some(record => record.meta.requiresAdmin)) {
      if (!userStore.isAdmin) {
        Message.error('需要管理员权限');
        next('/detection');
        return;
      }
    }

    if (to.matched.some(record => record.meta.requiresWordManager)) {
      if (!userStore.isAdmin && !userStore.isWordManager) {
        Message.error('需要管理员或词库管理员权限');
        next('/detection');
        return;
      }
    }
  }

  next();
});

export default router;
