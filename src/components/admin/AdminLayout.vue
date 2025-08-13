<template>
  <div class="admin-layout">
    <!-- 顶部导航栏 -->
    <div class="admin-header">
      <div class="header-left">
        <div class="menu-toggle" @click="toggleSidebar">
          <span class="iconfont icon-menu">☰</span>
        </div>
        <span class="header-title">耶氏台球报价系统</span>
      </div>

      <div class="header-right">
        <div class="user-info" @click="showUserMenu = !showUserMenu">
          <span class="user-name">{{ authStore.userName }}</span>
          <span class="user-role">{{
            authStore.user?.role === 'admin' ? '管理员' : '销售员'
          }}</span>
        </div>

        <!-- 用户菜单 -->
        <div v-if="showUserMenu" class="user-menu">
          <div class="menu-item" @click="handleProfile">
            <span class="iconfont icon-user">👤</span>
            <span>个人信息</span>
          </div>
          <div class="menu-item" @click="handlePassword">
            <span class="iconfont icon-lock">🔒</span>
            <span>修改密码</span>
          </div>
          <div class="menu-divider"></div>
          <div class="menu-item" @click="handleLogout">
            <span class="iconfont icon-logout">🚪</span>
            <span>退出登录</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 侧边栏 -->
    <div :class="['admin-sidebar', { collapsed: sidebarCollapsed }]">
      <div class="sidebar-scroll">
        <div class="sidebar-menu">
          <div
            v-for="item in menuItems"
            :key="item.path"
            :class="['menu-item', { active: currentPath === item.path }]"
            @click="navigateTo(item.path)"
          >
            <span class="menu-icon">{{ item.icon }}</span>
            <span v-if="!sidebarCollapsed" class="menu-text">{{ item.title }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div :class="['admin-content', { 'sidebar-collapsed': sidebarCollapsed }]">
      <slot></slot>
    </div>

    <!-- 遮罩层（移动端） -->
    <div v-if="showSidebarMask" class="sidebar-mask" @click="sidebarCollapsed = true"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const sidebarCollapsed = ref(false)
const showUserMenu = ref(false)
const currentPath = ref('')
const isMobile = ref(false)

const showSidebarMask = computed(() => {
  return isMobile.value && !sidebarCollapsed.value
})

const menuItems = [
  {
    title: '仪表盘',
    icon: '📊',
    path: '/admin/dashboard'
  },
  {
    title: '报价单管理',
    icon: '📋',
    path: '/admin/quotes'
  },
  {
    title: '产品管理',
    icon: '📦',
    path: '/admin/products'
  },
  {
    title: '客户管理',
    icon: '👥',
    path: '/admin/customers'
  },
  {
    title: '用户管理',
    icon: '👤',
    path: '/admin/users'
  },
  {
    title: '操作日志',
    icon: '📝',
    path: '/admin/logs'
  },
  {
    title: '系统设置',
    icon: '⚙️',
    path: '/admin/settings'
  }
]

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const navigateTo = (path: string) => {
  if (currentPath.value === path) return

  currentPath.value = path
  // 使用Vue Router替代uni.navigateTo
  router.push(path)

  // 移动端导航后自动收起侧边栏
  if (isMobile.value) {
    sidebarCollapsed.value = true
  }
}

const handleProfile = () => {
  showUserMenu.value = false
  // 使用Vue Router替代uni.navigateTo
  router.push('/admin/profile')
}

const handlePassword = () => {
  showUserMenu.value = false
  // 使用Vue Router替代uni.navigateTo
  router.push('/admin/password')
}

const handleLogout = async () => {
  // 使用Web标准confirm替代uni.showModal
  const confirmed = confirm('确定要退出登录吗？')
  if (confirmed) {
    await authStore.logout()
  }
}

const checkScreenSize = () => {
  // 使用标准Web API替代uni.getSystemInfoSync()
  const windowWidth = window.innerWidth
  isMobile.value = windowWidth < 768

  // 移动端默认收起侧边栏
  if (isMobile.value) {
    sidebarCollapsed.value = true
  }
}

// 点击其他地方关闭用户菜单
const handleClickOutside = (e: any) => {
  if (showUserMenu.value) {
    showUserMenu.value = false
  }
}

onMounted(() => {
  checkScreenSize()

  // 使用Vue Router获取当前路径
  currentPath.value = route.path

  // 使用Web标准API监听窗口大小变化
  window.addEventListener('resize', checkScreenSize)

  // 监听点击事件
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  // 移除窗口大小变化监听
  window.removeEventListener('resize', checkScreenSize)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss" scoped>
.admin-layout {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f7fa;
  position: relative;
}

.admin-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 100;

  .header-left {
    display: flex;
    align-items: center;

    .menu-toggle {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 4px;
      margin-right: 12px;

      &:hover {
        background-color: #f5f7fa;
      }

      .iconfont {
        font-size: 20px;
        color: #606266;
      }
    }

    .header-title {
      font-size: 18px;
      font-weight: 500;
      color: #303133;
    }
  }

  .header-right {
    position: relative;

    .user-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 4px;

      &:hover {
        background-color: #f5f7fa;
      }

      .user-name {
        font-size: 14px;
        color: #303133;
        font-weight: 500;
      }

      .user-role {
        font-size: 12px;
        color: #909399;
        margin-top: 2px;
      }
    }

    .user-menu {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 8px;
      background-color: #fff;
      border-radius: 4px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
      min-width: 160px;
      z-index: 200;

      .menu-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        cursor: pointer;
        transition: background-color 0.3s;

        &:hover {
          background-color: #f5f7fa;
        }

        .iconfont {
          margin-right: 8px;
          font-size: 16px;
        }

        text {
          font-size: 14px;
          color: #606266;
        }
      }

      .menu-divider {
        height: 1px;
        background-color: #ebeef5;
        margin: 4px 0;
      }
    }
  }
}

.admin-sidebar {
  position: fixed;
  left: 0;
  top: 60px;
  bottom: 0;
  width: 200px;
  background-color: #304156;
  transition: all 0.3s;
  z-index: 99;

  &.collapsed {
    width: 64px;
  }

  .sidebar-scroll {
    height: 100%;
    overflow-y: auto;
  }

  .sidebar-menu {
    padding: 20px 0;

    .menu-item {
      display: flex;
      align-items: center;
      height: 48px;
      padding: 0 20px;
      cursor: pointer;
      transition: all 0.3s;
      position: relative;

      &:hover {
        background-color: #263445;
      }

      &.active {
        background-color: #1890ff;

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background-color: #fff;
        }

        .menu-icon,
        .menu-text {
          color: #fff;
        }
      }

      .menu-icon {
        font-size: 20px;
        margin-right: 12px;
        color: #bfcbd9;
        min-width: 24px;
        text-align: center;
      }

      .menu-text {
        font-size: 14px;
        color: #bfcbd9;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }

  &.collapsed {
    .menu-item {
      padding: 0 20px;
      justify-content: center;

      .menu-icon {
        margin-right: 0;
      }
    }
  }
}

.admin-content {
  margin-left: 200px;
  margin-top: 60px;
  min-height: calc(100vh - 60px);
  transition: margin-left 0.3s;
  padding: 20px;

  &.sidebar-collapsed {
    margin-left: 64px;
  }
}

.sidebar-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 98;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .admin-sidebar {
    transform: translateX(0);

    &.collapsed {
      transform: translateX(-100%);
    }
  }

  .admin-content {
    margin-left: 0;

    &.sidebar-collapsed {
      margin-left: 0;
    }
  }

  .header-title {
    font-size: 16px !important;
  }
}
</style>
