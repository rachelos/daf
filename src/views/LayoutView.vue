<template>
  <a-layout class="layout">
    <!-- 顶部通栏 -->
    <a-layout-header class="top-header">
      <div class="logo">
        <icon-shield />
        <span>{{ systemTitle }}</span>
      </div>

      <div class="header-right">
        <div class="status-indicator">
          <div :class="['status-dot', statusOnline ? 'online' : 'offline']" />
          <span>{{ statusText }}</span>
        </div>

        <a-button shape="circle" size="small" @click="checkHealth">
          <template #icon>
            <icon-refresh />
          </template>
        </a-button>

        <a-divider direction="vertical" />

        <div class="user-info">
          <a-avatar :size="32">
            <icon-user />
          </a-avatar>
          <span class="username">{{ userStore.userInfo?.username }}</span>
          <a-button type="text" size="small" @click="showChangePasswordModal">
            <icon-lock />
            修改密码
          </a-button>
          <a-button type="text" size="small" @click="handleLogout">
            <icon-export />
            退出
          </a-button>
        </div>
      </div>
    </a-layout-header>

    <!-- 下左右布局 -->
    <a-layout class="sub-layout">
      <!-- 左侧菜单 -->
      <a-layout-sider class="sider" :width="240" :collapsed="collapsed" collapsible breakpoint="xl" @collapse="handleCollapse">
        <a-menu
          v-model:selected-keys="selectedKeys"
          v-model:open-keys="openKeys"
          mode="vertical"
          @menu-item-click="handleMenuClick"
          class="side-menu"
        >
          <a-sub-menu key="data-center">
            <template #icon>
              <icon-dashboard />
            </template>
            <template #title>数据中心</template>
            <a-menu-item key="stats">
              <template #icon>
                <icon-bar-chart />
              </template>
              数据统计
            </a-menu-item>
          </a-sub-menu>

          <a-sub-menu key="detection">
            <template #icon>
              <icon-search />
            </template>
            <template #title>检测功能</template>
            <a-menu-item key="detection">
              <template #icon>
                <icon-file />
              </template>
              文本检测
            </a-menu-item>
            <a-menu-item key="filter">
              <template #icon>
                <icon-filter />
              </template>
              文本过滤
            </a-menu-item>
            <a-menu-item key="correction">
              <template #icon>
                <icon-thunderbolt />
              </template>
              文本纠错
            </a-menu-item>
            <a-menu-item v-if="userStore.isAdmin || userStore.isWordManager" key="correction-words">
              <template #icon>
                <icon-edit />
              </template>
              纠错词库
            </a-menu-item>
          </a-sub-menu>

          <a-sub-menu key="word-manage">
            <template #icon>
              <icon-book />
            </template>
            <template #title>词库管理</template>
            <a-menu-item key="words">
              <template #icon>
                <icon-plus-circle />
              </template>
              词汇管理
            </a-menu-item>
            <a-menu-item key="words-list">
              <template #icon>
                <icon-list />
              </template>
              词库列表
            </a-menu-item>
          </a-sub-menu>

          <a-sub-menu key="system-manage">
            <template #icon>
              <icon-settings />
            </template>
            <template #title>系统管理</template>
            <a-menu-item key="categories">
              <template #icon>
                <icon-tags />
              </template>
              分类信息
            </a-menu-item>
            <a-menu-item key="config">
              <template #icon>
                <icon-settings />
              </template>
              系统配置
            </a-menu-item>
            <a-menu-item v-if="userStore.isAdmin" key="detection-logs">
              <template #icon>
                <icon-file />
              </template>
              检测日志
            </a-menu-item>
            <a-menu-item v-if="userStore.isAdmin" key="logs-analytics">
              <template #icon>
                <icon-bar-chart />
              </template>
              日志分析
            </a-menu-item>
            <a-menu-item v-if="userStore.isAdmin" key="users">
              <template #icon>
                <icon-user-group />
              </template>
              用户管理
            </a-menu-item>
            <a-menu-item v-if="userStore.isAdmin" key="access-keys">
              <template #icon>
                <icon-safe />
              </template>
              AK管理
            </a-menu-item>
          </a-sub-menu>
        </a-menu>
      </a-layout-sider>

      <!-- 右侧内容 -->
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
    </a-layout>

    <!-- 修改密码弹窗 -->
    <a-modal v-model:visible="changePasswordVisible" title="修改密码" @ok="handleChangePassword">
      <a-form :model="passwordForm" layout="vertical">
        <a-form-item label="旧密码" required>
          <a-input-password v-model="passwordForm.oldPassword" />
        </a-form-item>
        <a-form-item label="新密码" required>
          <a-input-password v-model="passwordForm.newPassword" />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Message, Modal } from '@arco-design/web-vue';
import { useUserStore } from '@/stores/user';
import { authApi, healthApi, configApi } from '@/api';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const systemTitle = ref('');
const statusOnline = ref(false);
const statusText = ref('检查中...');
const selectedKeys = ref<string[]>(['stats']);
const openKeys = ref<string[]>(['data-center', 'detection', 'word-manage', 'system-manage']);
const collapsed = ref(false);
const changePasswordVisible = ref(false);
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
});

// 根据当前路径更新选中的菜单
const updateSelectedKey = () => {
  const path = route.path.substring(1); // 去掉开头的 '/'
  if (path) {
    selectedKeys.value = [path];
  } else {
    selectedKeys.value = ['stats'];
  }
};

// 监听路由变化
watch(
  () => route.path,
  () => {
    updateSelectedKey();
  },
  { immediate: true }
);

const handleMenuClick = (key: string) => {
  // 如果点击的是父级菜单（有子菜单），则不跳转
  // 注意：父级菜单的 key 是子菜单组的 key，不是菜单项的 key
  router.push(`/${key}`);
};

const handleLogout = () => {
  Modal.confirm({
    title: '确认退出',
    content: '确定要退出登录吗？',
    onOk: () => {
      userStore.logout();
      window.location.reload();
    },
  });
};

const checkHealth = async () => {
  try {
    await healthApi.check();
    statusOnline.value = true;
    statusText.value = '服务正常';
    Message.success('服务连接正常');
  } catch (error) {
    statusOnline.value = false;
    statusText.value = '服务异常';
    Message.error('服务连接失败');
  }
};

const showChangePasswordModal = () => {
  changePasswordVisible.value = true;
};

const handleChangePassword = async () => {
  if (!passwordForm.oldPassword || !passwordForm.newPassword) {
    Message.warning('请输入旧密码和新密码');
    return;
  }
  try {
    await authApi.changePassword(passwordForm.oldPassword, passwordForm.newPassword);
    Message.success('密码修改成功');
    changePasswordVisible.value = false;
    passwordForm.oldPassword = '';
    passwordForm.newPassword = '';
  } catch (error: any) {
    Message.error('密码修改失败: ' + (error.message || '未知错误'));
  }
};

const handleCollapse = (val: boolean) => {
  collapsed.value = val;
};

const fetchSystemTitle = async () => {
  try {
    const result = await configApi.getSystemTitle();
    if (result.success && result.data?.title) {
      systemTitle.value = result.data.title;
      console.log('系统标题:', systemTitle.value);
    }
  } catch (error) {
    // 使用默认标题
    console.error('获取系统标题失败:', error);
  }
};

onMounted(() => {
  checkHealth();
  fetchSystemTitle();
});
</script>

<style scoped lang="less">
.layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 64px;
  background: var(--color-bg-2);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  width: 100%;
}

.logo {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 500;
  color: var(--primary-color);
}

.logo svg {
  margin-right: 10px;
  font-size: 24px;
  color: var(--primary-color);
  flex-shrink: 0;
}

.header-right {
  display: flex;
  align-items: center;
}

.sub-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sider {
  height: 100%;
  background: var(--color-bg-2);
  border-right: 1px solid var(--color-border);
  transition: all 0.2s ease;
}

.side-menu {
  padding: 16px 8px;
  border-right: none;
  background: transparent;
}

:deep(.arco-menu-pop) {
  padding: 8px;
}

:deep(.arco-menu-inline-header) {
  height: 48px;
  line-height: 48px;
  margin: 4px 0;
  border-radius: 6px;
  transition: all 0.2s ease;
  padding: 0 16px;
  cursor: pointer;

  &:hover {
    background: rgba(22, 93, 255, 0.05);
  }
}

:deep(.arco-menu-inline) {
  padding-left: 8px;
}

:deep(.arco-menu-item) {
  height: 40px;
  line-height: 40px;
  margin: 2px 0;
  border-radius: 6px;
  transition: all 0.2s ease;
  padding: 0 12px 0 32px;
}

:deep(.arco-menu-item.arco-menu-selected) {
  background: rgba(22, 93, 255, 0.1);
  color: #165DFF;
  font-weight: 500;
}

:deep(.arco-menu-item:hover) {
  background: rgba(22, 93, 255, 0.05);
}

.status-indicator {
  display: flex;
  align-items: center;
  margin-right: 16px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;

  &.online {
    background-color: #00B42A;
  }

  &.offline {
    background-color: #F53F3F;
    animation: none;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.username {
  margin-left: 10px;
  margin-right: 12px;
}

.content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px;
  background: var(--color-bg-1);
}
</style>
