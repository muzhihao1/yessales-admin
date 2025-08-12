<template>
  <view class="sales-footer">
    <view class="footer-content">
      <!-- Company info -->
      <view class="footer-section company-section">
        <text class="company-name">{{ companyName || 'YesSales' }}</text>
        <text v-if="slogan" class="company-slogan">{{ slogan }}</text>
      </view>

      <!-- Quick links -->
      <view v-if="showLinks" class="footer-section links-section">
        <view
          v-for="link in quickLinks"
          :key="link.text"
          class="footer-link"
          @click="handleLinkClick(link)"
        >
          {{ link.text }}
        </view>
      </view>

      <!-- Contact info -->
      <view v-if="showContact" class="footer-section contact-section">
        <view v-if="phone" class="contact-item">
          <text class="contact-label">电话：</text>
          <text class="contact-value">{{ phone }}</text>
        </view>
        <view v-if="email" class="contact-item">
          <text class="contact-label">邮箱：</text>
          <text class="contact-value">{{ email }}</text>
        </view>
      </view>

      <!-- Copyright -->
      <view class="footer-section copyright-section">
        <text class="copyright-text">
          © {{ currentYear }} {{ companyName || 'YesSales' }}. All rights reserved.
        </text>
        <text v-if="version" class="version-text">v{{ version }}</text>
      </view>
    </view>

    <!-- Fixed bottom bar (optional) -->
    <view v-if="showBottomBar" class="bottom-bar">
      <view
        v-for="(item, index) in bottomBarItems"
        :key="index"
        class="bar-item"
        :class="{ 'bar-item--active': activeIndex === index }"
        @click="handleBarItemClick(item, index)"
      >
        <image
          v-if="item.icon"
          class="bar-icon"
          :src="activeIndex === index ? item.activeIcon || item.icon : item.icon"
          mode="aspectFit"
        />
        <text class="bar-text">{{ item.text }}</text>
        <view v-if="item.badge" class="bar-badge">{{ item.badge }}</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface QuickLink {
  text: string
  url?: string
  page?: string
}

interface BottomBarItem {
  text: string
  icon?: string
  activeIcon?: string
  page?: string
  badge?: string | number
}

interface Props {
  companyName?: string
  slogan?: string
  showLinks?: boolean
  quickLinks?: QuickLink[]
  showContact?: boolean
  phone?: string
  email?: string
  version?: string
  showBottomBar?: boolean
  bottomBarItems?: BottomBarItem[]
  activeIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  companyName: 'YesSales',
  slogan: '',
  showLinks: false,
  quickLinks: () => [],
  showContact: false,
  phone: '',
  email: '',
  version: '',
  showBottomBar: false,
  bottomBarItems: () => [],
  activeIndex: 0
})

const emit = defineEmits<{
  'link-click': [link: QuickLink]
  'bar-item-click': [item: BottomBarItem, index: number]
}>()

const currentYear = computed(() => new Date().getFullYear())

const handleLinkClick = (link: QuickLink) => {
  emit('link-click', link)

  if (link.page) {
    // Use Vue Router or window navigation
    window.location.href = link.page
  } else if (link.url) {
    // Handle external URL
    window.open(link.url, '_blank')
  }
}

const handleBarItemClick = (item: BottomBarItem, index: number) => {
  emit('bar-item-click', item, index)

  if (item.page) {
    // Use web navigation
    window.location.href = item.page
  }
}
</script>

<style scoped>
.sales-footer {
  background-color: #fff;
  border-top: 1rpx solid #e5e7eb;
}

.footer-content {
  padding: 40rpx 32rpx;
  max-width: 1200rpx;
  margin: 0 auto;
}

/* Footer sections */
.footer-section {
  margin-bottom: 32rpx;
}

.footer-section:last-child {
  margin-bottom: 0;
}

/* Company section */
.company-section {
  text-align: center;
}

.company-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
  display: block;
  margin-bottom: 8rpx;
}

.company-slogan {
  font-size: 24rpx;
  color: #6b7280;
  display: block;
}

/* Links section */
.links-section {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 32rpx;
}

.footer-link {
  font-size: 24rpx;
  color: #4b5563;
  transition: color 0.2s ease;
  cursor: pointer;
}

.footer-link:active {
  color: #ff6b6b;
}

/* Contact section */
.contact-section {
  text-align: center;
}

.contact-item {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 8rpx;
}

.contact-label {
  font-size: 24rpx;
  color: #6b7280;
  margin-right: 8rpx;
}

.contact-value {
  font-size: 24rpx;
  color: #374151;
}

/* Copyright section */
.copyright-section {
  text-align: center;
  padding-top: 24rpx;
  border-top: 1rpx solid #f3f4f6;
}

.copyright-text {
  font-size: 22rpx;
  color: #9ca3af;
  display: block;
  margin-bottom: 8rpx;
}

.version-text {
  font-size: 20rpx;
  color: #d1d5db;
  display: block;
}

/* Bottom bar */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  border-top: 1rpx solid #e5e7eb;
  display: flex;
  padding: 8rpx 0;
  box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.05);
  z-index: 999;
}

.bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8rpx 0;
  position: relative;
  transition: all 0.2s ease;
}

.bar-item--active .bar-text {
  color: #ff6b6b;
}

.bar-icon {
  width: 48rpx;
  height: 48rpx;
  margin-bottom: 4rpx;
}

.bar-text {
  font-size: 22rpx;
  color: #6b7280;
  transition: color 0.2s ease;
}

.bar-badge {
  position: absolute;
  top: 4rpx;
  right: 50%;
  transform: translateX(24rpx);
  background-color: #ff6b6b;
  color: #fff;
  font-size: 20rpx;
  padding: 2rpx 8rpx;
  border-radius: 20rpx;
  min-width: 32rpx;
  text-align: center;
}

/* Safe area for bottom bar */
.sales-footer:has(.bottom-bar) .footer-content {
  padding-bottom: 120rpx;
}

/* Responsive adjustments */
@media (min-width: 768px) {
  .footer-content {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 40rpx;
    text-align: left;
  }

  .company-section,
  .contact-section,
  .copyright-section {
    text-align: left;
  }

  .links-section {
    justify-content: flex-start;
  }

  .contact-item {
    justify-content: flex-start;
  }

  .copyright-section {
    grid-column: 1 / -1;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .copyright-text,
  .version-text {
    display: inline;
    margin: 0;
  }
}

@media (min-width: 1024px) {
  .footer-content {
    grid-template-columns: repeat(4, 1fr);
  }

  .bottom-bar {
    display: none;
  }

  .sales-footer:has(.bottom-bar) .footer-content {
    padding-bottom: 40rpx;
  }
}
</style>
