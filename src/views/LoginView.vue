<template>
  <div class="login-container">
    <div class="login-layout">
      <!-- 左侧介绍区域 -->
      <div class="login-left">
        <div class="login-intro">
          <h1 class="intro-title">{{ systemTitle }}</h1>
          <p class="intro-text">
            高效、准确的敏感词检测与过滤解决方案
          </p>
          <div class="login-features">
            <div class="feature-item">
              <icon-check-circle />
              <span>智能文本检测</span>
            </div>
            <div class="feature-item">
              <icon-check-circle />
              <span>多分类敏感词库</span>
            </div>
            <div class="feature-item">
              <icon-check-circle />
              <span>实时文本过滤</span>
            </div>
            <div class="feature-item">
              <icon-check-circle />
              <span>词汇管理与维护</span>
            </div>
            <div class="feature-item">
              <icon-check-circle />
              <span>AI大模型检测</span>
            </div>
            <div class="feature-item">
              <icon-check-circle />
              <span>支持系统级联</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧登录区域 -->
      <div class="login-right">
        <a-card class="login-card" :bordered="false">
          <a-form :model="form" @submit="handleLogin">
            <a-form-item field="username" label="帐号">
              <a-input v-model="form.username" placeholder="请输入帐号">
                <template #prefix><icon-user /></template>
              </a-input>
            </a-form-item>

            <a-form-item field="password" label="密码">
              <a-input-password v-model="form.password" placeholder="请输入密码">
                <template #prefix><icon-lock /></template>
              </a-input-password>
            </a-form-item>

            <a-form-item>
              <a-button type="primary" html-type="submit" :loading="loading" long>
                登录
              </a-button>
            </a-form-item>

            <a-alert v-if="showDefaultPassword" type="info" class="default-info">
              默认管理员账号: admin / admin123
            </a-alert>
            <a-alert v-if="showDefaultPassword" type="info" class="default-info">
              系统词库管理员账号: word_manager / word123
            </a-alert>
          </a-form>
        </a-card>
      </div>
    </div>
    <div class="login-footer">
      <div class="copyright">Sensitive Words Detection</div>
      <div class="footer-links">
        <a-link href="https://github.com/rachelos/daf" target="_blank">GitHub</a-link>
        <span class="divider">|</span>
        <a-link href="/api/docs" target="_blank">Docs</a-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import { authApi, configApi } from '@/api';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();
const loading = ref(false);
const systemTitle = ref('Sensitive Words Detection');
const showDefaultPassword = ref(true);

const form = reactive({
  username: '',
  password: '',
});

const fetchSystemTitle = async () => {
  try {
    const result = await configApi.getSystemTitle();
    if (result.success && result.data?.title) {
      systemTitle.value = result.data.title;
      showDefaultPassword.value = result.data.show_default_password !== undefined ? result.data.show_default_password : true;
      console.log('系统标题:', systemTitle.value);
      console.log('显示默认密码提示:', showDefaultPassword.value);
    }
  } catch (error) {
    // 使用默认标题
    console.error('获取系统标题失败:', error);
  }
};

onMounted(() => {
  fetchSystemTitle();
});

const handleLogin = async () => {
  loading.value = true;
  try {
    const result = await authApi.login(form.username, form.password);
    if (result.success && result.data) {
      userStore.setToken(result.data.token);
      userStore.setUserInfo(result.data.user);
      Message.success('登录成功');
      router.push('/detection');
    } else {
      Message.error(result.message || '登录失败');
    }
  } catch (error: any) {
    Message.error('登录失败: ' + (error.message || '未知错误'));
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  height: 100vh;
  padding: 0;
  margin: 0;
  background: linear-gradient(135deg, rgba(22, 93, 255, 0.95) 0%, rgba(168, 85, 247, 0.9) 100%);
  background-size: 200% 200%;
  animation: gradientBG 12s ease infinite;
  position: relative;
}

@keyframes gradientBG {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.login-layout {
  display: flex;
  height: 100%;
  transition: all 0.3s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-left {
  flex: 0 0 55%;
  padding: 80px;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: transparent;
}

.intro-title {
  animation: fadeInUp 0.8s ease-out both;
  font-size: 2.5rem;
  margin-bottom: 24px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.intro-text {
  animation: fadeInUp 0.8s ease-out 0.2s both;
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 32px;
  opacity: 0.9;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.login-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  opacity: 0;
  animation: fadeInUp 0.6s ease-out forwards;
}

.feature-item:nth-child(1) {
  animation-delay: 0.4s;
}

.feature-item:nth-child(2) {
  animation-delay: 0.5s;
}

.feature-item:nth-child(3) {
  animation-delay: 0.6s;
}

.feature-item:nth-child(4) {
  animation-delay: 0.7s;
}

.login-right {
  flex: 0 0 45%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.login-card {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: none;
  transition: all 0.3s ease;
}

.login-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1) !important;
}

:deep(.arco-form-item-label) {
  color: #333 !important;
  font-weight: 500;
  font-size: 15px;
  margin-bottom: 6px;
}

:deep(.arco-input-wrapper) {
  height: 48px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #1a202c;
  transition: all 0.2s ease;
}

:deep(.arco-input-wrapper:hover) {
  border-color: #cbd5e0;
  background: #fff;
}

:deep(.arco-input-wrapper:focus-within) {
  border-color: #165DFF;
  box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.2);
  background: #fff;
}

:deep(.arco-input::placeholder) {
  color: #a0aec0;
}

:deep(.arco-btn-primary) {
  height: 48px;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 15px;
  background: #165DFF;
  border-color: #165DFF;
  color: white;
}

:deep(.arco-btn-primary:hover) {
  background: #0e4acc;
  border-color: #0e4acc;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(22, 93, 255, 0.3);
}

:deep(.arco-btn-primary:active) {
  transform: translateY(0);
  box-shadow: none;
}

.default-info {
  margin-top: 16px;
  background: #f7f8fa;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
}

.login-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
  padding: 24px 0;
  color: #fff;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  z-index: 10;
}

.login-footer a {
  color: #fff;
  text-decoration: none;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.login-footer a:hover {
  color: #fff;
  background: rgba(22, 93, 255, 0.1);
  transform: translateY(-1px);
  text-decoration: none;
}

.copyright {
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.copyright::before {
  content: "©";
  font-size: 0.75rem;
  opacity: 0.7;
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 16px;
}

.divider {
  user-select: none;
}

@media (max-width: 992px) {
  .login-layout {
    flex-direction: column;
  }

  .login-left,
  .login-right {
    flex: 1;
    padding: 40px;
  }

  .login-card {
    width: 100%;
    max-width: 400px;
  }

  .intro-title {
    font-size: 2rem;
  }
}

@media (max-width: 720px) {
  .login-container .login-left .login-intro {
    font-size: 2rem !important;
    margin-bottom: 0 !important;
  }
  .login-container .login-left .login-intro .login-features,
  .intro-text {
    display: none !important;
  }
  .login-container .login-right button {
    width: 60% !important;
  }
  .login-container .login-right {
    width: 100% !important;
    flex: none !important;
  }
  .login-container .login-left {
    flex: none !important;
  }
  .login-container .login-card {
    width: 100% !important;
    padding: 0 !important;
  }
}
</style>
