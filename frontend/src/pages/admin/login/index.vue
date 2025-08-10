<template>
  <div class="login-container">
    <div class="login-wrapper">
      <div class="login-header">
        <img class="logo" src="/logo.svg" alt="耶氏台球" />
        <h1 class="title">耶氏台球报价系统</h1>
        <p class="subtitle">管理员登录</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-item">
          <label class="form-label">用户名</label>
          <input
            v-model="formData.username"
            class="form-input"
            type="text"
            placeholder="请输入用户名"
            :disabled="isLoading"
            @keyup.enter="handleLogin"
          />
        </div>

        <div class="form-item">
          <label class="form-label">密码</label>
          <input
            v-model="formData.password"
            class="form-input"
            type="password"
            placeholder="请输入密码"
            :disabled="isLoading"
            @keyup.enter="handleLogin"
          />
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <button
          class="login-button"
          type="submit"
          :disabled="!canSubmit"
          @click="handleLogin"
        >
          {{ isLoading ? '登录中...' : '登 录' }}
        </button>
      </form>

      <div class="login-footer">
        <p class="copyright">© 2024 耶氏台球斗南销售中心</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { type LoginCredentials, useAuthStore } from '@/composables/useAuth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const formData = ref<LoginCredentials>({
  username: '',
  password: ''
})

const isLoading = ref(false)
const errorMessage = ref('')

const canSubmit = computed(() => {
  return formData.value.username.trim() && formData.value.password.trim() && !isLoading.value
})

const validateForm = (): boolean => {
  if (!formData.value.username.trim()) {
    errorMessage.value = '请输入用户名'
    return false
  }
  if (!formData.value.password.trim()) {
    errorMessage.value = '请输入密码'
    return false
  }
  if (formData.value.password.length < 6) {
    errorMessage.value = '密码长度不能少于6位'
    return false
  }
  return true
}

const handleLogin = async () => {
  if (!validateForm()) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await authStore.loginAdmin(formData.value)

    if (result.success) {
      console.log('✅ 管理员登录成功:', result.user?.name)

      // 获取redirect参数，如果没有则默认跳转到仪表盘
      const redirectPath = (route.query.redirect as string) || '/admin/dashboard'

      // 使用Vue Router进行导航
      router.push(redirectPath)
    } else {
      errorMessage.value = result.error || '登录失败'
    }
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = '网络错误，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  // 初始化身份验证状态
  await authStore.initializeAuth()

  // 检查是否已登录
  if (authStore.isAdmin) {
    console.log('✅ 已登录用户访问登录页，自动重定向')

    // 使用Vue Router进行导航
    router.push('/admin/dashboard')
  }
})
</script>

<style lang="scss" scoped>
.login-container {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-wrapper {
  width: 100%;
  max-width: 400px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.login-header {
  text-align: center;
  padding: 40px 20px 30px;
  background-color: #f8f9fa;

  .logo {
    width: 80px;
    height: 80px;
    margin-bottom: 20px;
  }

  .title {
    display: block;
    font-size: 24px;
    font-weight: bold;
    color: #333;
    margin-bottom: 8px;
  }

  .subtitle {
    display: block;
    font-size: 14px;
    color: #666;
  }
}

.login-form {
  padding: 30px;

  .form-item {
    margin-bottom: 24px;
  }

  .form-label {
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
    font-weight: 500;
  }

  .form-input {
    width: 100%;
    height: 44px;
    padding: 0 16px;
    border: 1px solid #dcdfe6;
    border-radius: 6px;
    font-size: 14px;
    background-color: #fff;
    transition: border-color 0.3s;

    &:focus {
      border-color: #667eea;
      outline: none;
    }

    &[disabled] {
      background-color: #f5f7fa;
      cursor: not-allowed;
    }
  }

  .error-message {
    color: #f56c6c;
    font-size: 12px;
    margin-top: -8px;
    margin-bottom: 16px;
    padding-left: 4px;
  }

  .login-button {
    width: 100%;
    height: 44px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    font-size: 16px;
    font-weight: 500;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s;

    &:active {
      transform: translateY(1px);
    }

    &[disabled] {
      opacity: 0.6;
      cursor: not-allowed;
    }

    &::after {
      border: none;
    }
  }
}

.login-footer {
  padding: 20px;
  text-align: center;
  border-top: 1px solid #f0f0f0;

  .copyright {
    font-size: 12px;
    color: #999;
  }
}

/* 适配小屏幕 */
@media (max-width: 480px) {
  .login-wrapper {
    margin: 0 20px;
  }

  .login-header {
    padding: 30px 20px 20px;

    .title {
      font-size: 20px;
    }
  }

  .login-form {
    padding: 20px;
  }
}
</style>
