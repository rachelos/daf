<template>
  <a-layout class="layout">
    <!-- 顶部通栏 -->
    <a-layout-header class="top-header">
      <div class="logo" v-if="!isMobile" @click="router.push('/')">
         <img class="svg" src="@/assets/logo.svg" alt="{{ systemTitle }}" />
        <span>{{ systemTitle }}</span>
      </div>
      <div class="logo" v-else @click="toggleMobileMenu">
        <img class="svg" src="@/assets/logo.svg" alt="{{ systemTitle }}" />
      </div>

      <div class="header-right">

        <div class="status-indicator">
          <div :class="['status-dot', statusOnline ? 'online' : 'offline']" />
          <span>{{ statusText }}</span>
        </div>

        <div class="feature-status">
          <div :class="['feature-tag', 'dictionary-status', config.dictionary?.load_default_words ? 'enabled' : 'disabled']" @click="toggleDictionary">
            <template v-if="config.dictionary?.load_default_words">
              <icon-book />
              <span>系统词库已启用</span>
            </template>
            <template v-else>
              <icon-book />
              <span>系统词库未启用</span>
            </template>
          </div>

          <div :class="['feature-tag', 'ai-status', config.ai?.enabled ? 'enabled' : 'disabled']" @click="toggleAI">
            <template v-if="config.ai?.enabled">
              <icon-robot />
              <span>AI已启用</span>
            </template>
            <template v-else>
              <icon-robot />
              <span>AI未启用</span>
            </template>
          </div>

          <div :class="['feature-tag', 'cascade-status', config.cascade?.enabled ? 'enabled' : 'disabled']" @click="toggleCascade">
            <template v-if="config.cascade?.enabled">
              <icon-link />
              <span>级联已启用</span>
            </template>
            <template v-else>
              <icon-link />
              <span>级联未启用</span>
            </template>
          </div>
        </div>

        <a-button shape="circle" size="small" @click="checkHealth">
          <template #icon>
            <icon-refresh />
          </template>
        </a-button>

        <a-divider direction="vertical" />

        <div class="user-info">
          <a-dropdown trigger="click">
            <a-avatar :size="32" class="user-avatar">
              <icon-user />
            </a-avatar>
            <template #content>
              <a-doption @click="showChangePasswordModal">
                <template #icon>
                  <icon-lock />
                </template>
                修改密码
              </a-doption>
              <a-doption @click="handleLogout">
                <template #icon>
                  <icon-export />
                </template>
                退出
              </a-doption>
            </template>
            <span class="username">{{ userStore.userInfo?.username }}</span>
          </a-dropdown>
        </div>
      </div>
    </a-layout-header>

    <!-- 下左右布局 -->
    <a-layout class="sub-layout">
      <!-- 左侧菜单 -->
      <a-layout-sider
        :class="['sider', { 'mobile-visible': mobileMenuVisible }]"
        :width="240"
        :collapsed="collapsed && !isMobile"
        :collapsible="!isMobile"
        breakpoint="xl"
        @collapse="handleCollapse"
      >
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
            <a-menu-item key="webscan">
              <template #icon>
                <icon-storage />
              </template>
              网站扫描
            </a-menu-item>
            <!-- <a-menu-item key="correction">
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
            </a-menu-item> -->
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
            <a-menu-item key="detection-logs">
              <template #icon>
                <icon-file />
              </template>
              检测日志
            </a-menu-item>
            <a-menu-item key="logs-analytics">
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
            <a-menu-item key="login-logs">
              <template #icon>
                <icon-history />
              </template>
              登录日志
            </a-menu-item>
          </a-sub-menu>
        </a-menu>
      </a-layout-sider>

      <!-- 右侧内容 -->
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
    </a-layout>

    <!-- 移动端菜单遮罩层 -->
    <div v-if="mobileMenuVisible" class="mobile-overlay" @click="toggleMobileMenu"></div>

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
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue';
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
const mobileMenuVisible = ref(false);
const isMobile = ref(false);
const changePasswordVisible = ref(false);
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
});
const config = ref<any>({});

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
  // 移动端点击菜单项后关闭菜单
  if (isMobile.value) {
    mobileMenuVisible.value = false;
  }
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

const toggleMobileMenu = () => {
  mobileMenuVisible.value = !mobileMenuVisible.value;
};

const checkScreenSize = () => {
  if (typeof window !== 'undefined') {
    isMobile.value = window.innerWidth <= 768;
  }
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

const fetchConfig = async () => {
  try {
    const result = await configApi.get();
    if (result.success && result.data) {
      config.value = result.data;
    }
  } catch (error) {
    console.error('获取配置失败:', error);
  }
};

const toggleAI = async () => {
  if (!config.value.ai) {
    Message.warning('配置未加载，请稍候');
    return;
  }

  const newValue = !config.value.ai.enabled;
  Modal.confirm({
    title: '确认操作',
    content: newValue ? '确定要启用AI检测功能吗？' : '确定要关闭AI检测功能吗？',
    onOk: async () => {
      try {
        // 创建更新的配置副本
        const updateData = JSON.parse(JSON.stringify(config.value));
        updateData.ai.enabled = newValue;

        // 更新配置
        const updateResult = await configApi.update(updateData);
        if (!updateResult.success) {
          Message.error('更新配置失败: ' + (updateResult.message || '未知错误'));
          return;
        }

        // 重新加载配置
        const reloadResult = await configApi.reloadConfig();
        if (reloadResult.success) {
          Message.success(newValue ? 'AI检测已启用' : 'AI检测已关闭');
          // 重新获取配置以更新显示
          await fetchConfig();
        } else {
          Message.error('重新加载配置失败: ' + (reloadResult.message || '未知错误'));
        }
      } catch (error: any) {
        Message.error('切换AI检测失败: ' + (error.message || '未知错误'));
      }
    }
  });
};

const toggleCascade = async () => {
  if (!config.value.cascade) {
    Message.warning('配置未加载，请稍候');
    return;
  }

  const newValue = !config.value.cascade.enabled;
  Modal.confirm({
    title: '确认操作',
    content: newValue ? '确定要启用级联功能吗？' : '确定要关闭级联功能吗？',
    onOk: async () => {
      try {
        // 创建更新的配置副本
        const updateData = JSON.parse(JSON.stringify(config.value));
        updateData.cascade.enabled = newValue;

        // 更新配置
        const updateResult = await configApi.update(updateData);
        if (!updateResult.success) {
          Message.error('更新配置失败: ' + (updateResult.message || '未知错误'));
          return;
        }

        // 重新加载配置
        const reloadResult = await configApi.reloadConfig();
        if (reloadResult.success) {
          Message.success(newValue ? '级联功能已启用' : '级联功能已关闭');
          // 重新获取配置以更新显示
          await fetchConfig();
        } else {
          Message.error('重新加载配置失败: ' + (reloadResult.message || '未知错误'));
        }
      } catch (error: any) {
        Message.error('切换级联功能失败: ' + (error.message || '未知错误'));
      }
    }
  });
};

const toggleDictionary = async () => {
  if (!config.value.dictionary) {
    Message.warning('配置未加载，请稍候');
    return;
  }

  const newValue = !config.value.dictionary.load_default_words;
  Modal.confirm({
    title: '确认操作',
    content: newValue ? '确定要启用系统词库吗？' : '确定要关闭系统词库吗？',
    onOk: async () => {
      try {
        // 创建更新的配置副本
        const updateData = JSON.parse(JSON.stringify(config.value));
        updateData.dictionary.load_default_words = newValue;

        // 更新配置
        const updateResult = await configApi.update(updateData);
        if (!updateResult.success) {
          Message.error('更新配置失败: ' + (updateResult.message || '未知错误'));
          return;
        }

        // 重新加载配置
        const reloadResult = await configApi.reloadConfig();
        if (reloadResult.success) {
          Message.success(newValue ? '系统词库已启用' : '系统词库已关闭');
          // 刷新页面
          window.location.reload();
        } else {
          Message.error('重新加载配置失败: ' + (reloadResult.message || '未知错误'));
        }
      } catch (error: any) {
        Message.error('切换系统词库失败: ' + (error.message || '未知错误'));
      }
    }
  });
};

onMounted(() => {
  checkHealth();
  fetchSystemTitle();
  fetchConfig();
  checkScreenSize();

  // 监听窗口大小变化
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', checkScreenSize);
  }
});

// 清理事件监听器
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', checkScreenSize);
  }
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
  cursor: pointer;
  color: var(--primary-color);
}
.logo .svg{
  width:2rem;
  margin-right:1rem;
}
.logo svg {
  margin-right: 10px;
  font-size: 24px;
  color: var(--primary-color);
  flex-shrink: 0;
}

.logo span {
  display: block;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mobile-menu-btn {
  display: none;
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

.feature-status {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: 16px;
}

.feature-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
  user-select: none;

  &.ai-status,
  &.cascade-status,
  &.dictionary-status {
    svg {
      font-size: 14px;
    }
  }

  &.enabled {
    background-color: rgba(0, 180, 42, 0.1);
    color: #00B42A;
    border: 1px solid rgba(0, 180, 42, 0.2);

    &:hover {
      background-color: rgba(0, 180, 42, 0.2);
      border-color: rgba(0, 180, 42, 0.3);
    }
  }

  &.disabled {
    background-color: rgba(134, 144, 156, 0.1);
    color: rgba(134, 144, 156, 0.8);
    border: 1px solid rgba(134, 144, 156, 0.2);

    &:hover {
      background-color: rgba(134, 144, 156, 0.2);
      border-color: rgba(134, 144, 156, 0.3);
      color: rgba(134, 144, 156, 1);
    }
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
  gap: 8px;
}

.user-avatar {
  cursor: pointer;
  background: var(--color-fill-2);
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.05);
    background: var(--color-fill-3);
  }
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

// 手机端适配
@media (max-width: 768px) {
  .top-header {
    padding: 0 12px;
    height: 56px;
  }

  .logo {
    font-size: 16px;
  }

  .logo svg {
    font-size: 20px;
    margin-right: 6px;
  }

  .logo span {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .header-right {
    gap: 6px;
  }

  .mobile-menu-btn {
    display: inline-flex;
  }

  // 隐藏部分状态信息
  .status-indicator {
    margin-right: 8px;

    span {
      display: none;
    }
  }

  .feature-status {
    gap: 6px;
    margin-right: 8px;
  }

  .feature-tag {
    padding: 3px 8px;
    gap: 4px;
    font-size: 11px;

    &.ai-status,
    &.cascade-status,
    &.dictionary-status {
      svg {
        font-size: 12px;
      }
    }

    span {
      display: none;
    }
  }

  // 隐藏修改密码按钮
  .user-info .username {
    display: none;
  }

  .user-info .arco-dropdown {
    display: flex;
    align-items: center;
  }

  .sider {
    position: fixed;
    left: -240px;
    top: 56px;
    z-index: 1000;
    width: 240px !important;
    min-width: 240px !important;
    max-width: 240px !important;
    height: calc(100vh - 56px);
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
    transition: left 0.3s ease;
    overflow-y: auto;
    overflow-x: hidden;

    &.mobile-visible {
      left: 0;
    }

    // 覆盖 Arco Design 的折叠样式
    :deep(.arco-layout-sider-trigger) {
      display: none;
    }

    :deep(.arco-layout-sider-children) {
      width: 240px !important;
    }
  }

  .mobile-overlay {
    position: fixed;
    top: 56px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }

  .content {
    padding: 12px;
  }

  // 优化菜单项
  :deep(.arco-menu-inline-header) {
    height: 44px;
    line-height: 44px;
    padding: 0 12px;
  }

  :deep(.arco-menu-item) {
    height: 36px;
    line-height: 36px;
    padding: 0 12px 0 24px;
  }
}

// 超小屏幕适配（iPhone SE 等）
@media (max-width: 375px) {
  .top-header {
    padding: 0 8px;
  }

  .logo span {
    max-width: 80px;
  }

  .feature-status {
    gap: 4px;
  }

  .feature-tag {
    padding: 2px 6px;
  }
}
</style>
