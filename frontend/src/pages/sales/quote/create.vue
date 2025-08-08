<template>
  <view class="sales-container">
    <SalesHeader title="新建报价" :show-back="true" :fixed="true" />

    <view class="sales-page">
      <!-- 客户信息 -->
      <view class="sales-card">
        <view class="sales-section-header">
          <view class="sales-section-title">
            <text class="section-title-icon">👤</text>
            <text class="section-title-text">客户信息</text>
          </view>
          <text class="section-subtitle">请填写客户的详细信息</text>
        </view>

        <!-- 客户基本信息 -->
        <view class="form-group">
          <SalesInput
            v-model="form.customerName"
            label="客户姓名"
            placeholder="请输入客户真实姓名"
            :required="true"
            :error="errors.customerName"
            :loading="form.customerName && customerNameValidating"
            @input="handleCustomerNameInput"
            @blur="validateCustomerName"
          >
            <template #suffix>
              <view v-if="form.customerName && !errors.customerName" class="input-success-icon"
                >✓</view
              >
            </template>
          </SalesInput>

          <SalesInput
            v-model="form.customerPhone"
            label="联系电话"
            placeholder="请输入11位手机号码"
            type="tel"
            :maxlength="11"
            :required="true"
            :error="errors.customerPhone"
            :loading="form.customerPhone && phoneValidating"
            @input="handlePhoneInput"
            @blur="validatePhone"
          >
            <template #suffix>
              <view v-if="isValidPhone && !errors.customerPhone" class="input-success-icon">✓</view>
            </template>
            <template #help>
              <text v-if="form.customerPhone && !errors.customerPhone" class="input-help-text">
                {{ formatPhoneDisplay(form.customerPhone) }}
              </text>
            </template>
          </SalesInput>
        </view>

        <!-- 联系方式 -->
        <view class="form-group">
          <view class="form-group-title">
            <text class="group-title-text">联系方式</text>
            <text class="group-subtitle">便于后续沟通联系</text>
          </view>

          <SalesInput
            v-model="form.customerWechat"
            label="微信号"
            placeholder="微信号/手机号均可"
            :error="errors.customerWechat"
            @blur="validateWechat"
          >
            <template #prefix>
              <text class="input-prefix-icon">💬</text>
            </template>
            <template #suffix>
              <SalesButton
                v-if="form.customerWechat && !form.customerPhone"
                size="mini"
                type="plain"
                @click="copyWechatToPhone"
              >
                同步到手机号
              </SalesButton>
            </template>
          </SalesInput>

          <SalesInput
            v-model="form.customerEmail"
            label="邮箱地址"
            placeholder="用于发送报价单（选填）"
            type="email"
            :error="errors.customerEmail"
            @blur="validateEmail"
          >
            <template #prefix>
              <text class="input-prefix-icon">📧</text>
            </template>
          </SalesInput>
        </view>

        <!-- 地址信息 -->
        <view class="form-group">
          <view class="form-group-title">
            <text class="group-title-text">地址信息</text>
            <text class="group-subtitle">用于配送和安装服务</text>
          </view>

          <!-- 地区选择器 -->
          <view class="location-selector">
            <SalesSelector
              v-model="form.customerProvince"
              label="省份"
              placeholder="请选择省份"
              :options="provinceOptions"
              @change="handleProvinceChange"
            />
            <SalesSelector
              v-model="form.customerCity"
              label="城市"
              placeholder="请选择城市"
              :options="cityOptions"
              :disabled="!form.customerProvince"
              @change="handleCityChange"
            />
          </view>

          <SalesInput
            v-model="form.customerAddress"
            label="详细地址"
            placeholder="街道门牌号、小区楼栋等"
            :maxlength="100"
            :error="errors.customerAddress"
          >
            <template #prefix>
              <text class="input-prefix-icon">📍</text>
            </template>
            <template #suffix>
              <SalesButton
                size="mini"
                type="plain"
                @click="getCurrentLocation"
                :loading="locationLoading"
              >
                定位
              </SalesButton>
            </template>
          </SalesInput>
        </view>

        <!-- 客户类型和需求 -->
        <view class="form-group">
          <view class="form-group-title">
            <text class="group-title-text">客户类型</text>
            <text class="group-subtitle">帮助我们提供更精准的服务</text>
          </view>

          <view class="customer-type-selector">
            <view
              v-for="type in customerTypes"
              :key="type.value"
              class="type-option"
              :class="{ 'type-option--active': form.customerType === type.value }"
              @click="form.customerType = type.value"
            >
              <text class="type-icon">{{ type.icon }}</text>
              <text class="type-label">{{ type.label }}</text>
            </view>
          </view>
        </view>

        <!-- 备注信息 -->
        <view class="form-group">
          <SalesTextarea
            v-model="form.customerRemark"
            label="备注信息"
            placeholder="特殊要求、安装时间、付款方式等（选填）"
            :maxlength="300"
            :show-count="true"
            :auto-height="true"
            :error="errors.customerRemark"
          />
        </view>

        <!-- 保存客户信息选项 -->
        <view class="form-actions">
          <view class="save-customer-option" @click="toggleSaveCustomer">
            <view
              class="option-checkbox"
              :class="{ 'option-checkbox--checked': form.saveCustomer }"
            >
              <text v-if="form.saveCustomer" class="checkbox-icon">✓</text>
            </view>
            <text class="option-text">保存客户信息，便于下次快速填写</text>
          </view>
        </view>
      </view>

      <!-- 产品选择 -->
      <view class="sales-card">
        <view class="sales-section-title">产品选择</view>

        <view class="sales-product-selector">
          <SalesButton type="primary" :block="true" @click="selectProducts"> 选择产品 </SalesButton>
        </view>

        <!-- 已选产品列表 -->
        <view v-if="selectedProducts.length > 0" class="sales-selected-list">
          <view v-for="(item, index) in selectedProducts" :key="index" class="sales-selected-item">
            <view class="sales-selected-info">
              <text class="sales-selected-name">{{ item.product.name }}</text>
              <text class="sales-selected-spec">
                {{ item.product.model }}
                <text v-if="item.skuName"> - {{ item.skuName }}</text>
                × {{ item.quantity }}
              </text>
            </view>
            <text class="sales-selected-price">¥{{ item.subtotal.toFixed(2) }}</text>
          </view>
        </view>

        <view v-else class="sales-empty">
          <text class="sales-empty-text">请选择产品</text>
        </view>
      </view>

      <!-- 价格计算 -->
      <view class="sales-card">
        <view class="sales-section-header">
          <view class="sales-section-title">
            <text class="section-title-icon">💰</text>
            <text class="section-title-text">价格计算</text>
          </view>
          <text class="section-subtitle">设置折扣、税费和附加费用</text>
        </view>

        <!-- 基本价格信息 -->
        <view class="pricing-summary">
          <view class="summary-row">
            <text class="summary-label">产品小计</text>
            <text class="summary-value">¥{{ subtotal.toFixed(2) }}</text>
          </view>
          <view v-if="customerTypeDiscount > 0" class="summary-row discount-row">
            <text class="summary-label">客户类型折扣</text>
            <text class="summary-value discount-value"
              >-¥{{ customerTypeDiscount.toFixed(2) }}</text
            >
          </view>
        </view>

        <!-- 折扣设置 -->
        <view class="form-group">
          <view class="form-group-title">
            <text class="group-title-text">额外折扣</text>
            <text class="group-subtitle">可设置额外的优惠折扣</text>
          </view>

          <view class="discount-controls">
            <view class="discount-type-toggle">
              <SalesButton
                :type="pricingConfig.discountType === 'percentage' ? 'primary' : 'default'"
                size="small"
                @click="() => { pricingConfig.discountType = 'percentage'; validateDiscount() }"
              >
                按比例
              </SalesButton>
              <SalesButton
                :type="pricingConfig.discountType === 'fixed' ? 'primary' : 'default'"
                size="small"
                @click="() => { pricingConfig.discountType = 'fixed'; validateDiscount() }"
              >
                固定金额
              </SalesButton>
            </view>

            <SalesInput
              v-model.number="pricingConfig.discountValue"
              :label="pricingConfig.discountType === 'percentage' ? '折扣比例 (%)' : '折扣金额 (¥)'"
              :placeholder="
                pricingConfig.discountType === 'percentage' ? '输入0-50' : '输入折扣金额'
              "
              type="number"
              @blur="validateDiscount"
              @input="saveDraft"
            />
          </view>
        </view>

        <!-- 高级价格设置 -->
        <view
          class="advanced-pricing-toggle"
          @click="pricingConfig.showAdvancedPricing = !pricingConfig.showAdvancedPricing"
        >
          <text class="toggle-text">高级价格设置</text>
          <text class="toggle-icon">{{ pricingConfig.showAdvancedPricing ? '▲' : '▼' }}</text>
        </view>

        <!-- 高级设置内容 -->
        <view v-if="pricingConfig.showAdvancedPricing" class="advanced-pricing-content">
          <!-- 税费设置 -->
          <view class="form-group">
            <view class="form-group-title">
              <text class="group-title-text">税费设置</text>
              <text class="group-subtitle">配置增值税或销售税</text>
            </view>

            <view class="tax-controls">
              <SalesInput
                v-model.number="pricingConfig.taxRate"
                label="税率 (%)"
                placeholder="输入税率"
                type="number"
                @input="saveDraft"
              />

              <view
                class="tax-included-option"
                @click="() => { pricingConfig.taxIncluded = !pricingConfig.taxIncluded; saveDraft() }"
              >
                <view
                  class="option-checkbox"
                  :class="{ 'option-checkbox--checked': pricingConfig.taxIncluded }"
                >
                  <text v-if="pricingConfig.taxIncluded" class="checkbox-icon">✓</text>
                </view>
                <text class="option-text">含税价格</text>
              </view>
            </view>
          </view>

          <!-- 附加费用 -->
          <view class="form-group">
            <view class="form-group-title">
              <text class="group-title-text">附加费用</text>
              <text class="group-subtitle">配送、安装及其他费用</text>
            </view>

            <SalesInput
              v-model.number="pricingConfig.deliveryFee"
              label="配送费 (¥)"
              placeholder="输入配送费用"
              type="number"
              @input="saveDraft"
            />

            <SalesInput
              v-model.number="pricingConfig.installationFee"
              label="安装费 (¥)"
              placeholder="输入安装费用"
              type="number"
              @input="saveDraft"
            />

            <!-- 其他费用列表 -->
            <view v-if="pricingConfig.otherCharges.length > 0" class="other-charges-list">
              <view
                v-for="charge in pricingConfig.otherCharges"
                :key="charge.id"
                class="other-charge-item"
              >
                <SalesInput v-model="charge.name" placeholder="费用名称" @input="saveDraft" />
                <view class="charge-amount-row">
                  <SalesButton
                    :type="charge.type === 'fixed' ? 'primary' : 'default'"
                    size="mini"
                    @click="() => { charge.type = 'fixed'; saveDraft() }"
                  >
                    固定
                  </SalesButton>
                  <SalesButton
                    :type="charge.type === 'percentage' ? 'primary' : 'default'"
                    size="mini"
                    @click="() => { charge.type = 'percentage'; saveDraft() }"
                  >
                    比例
                  </SalesButton>
                  <SalesInput
                    v-model.number="charge.amount"
                    :placeholder="charge.type === 'percentage' ? '百分比' : '金额'"
                    type="number"
                    @input="saveDraft"
                  />
                  <SalesButton size="mini" type="danger" @click="removeOtherCharge(charge.id)">
                    删除
                  </SalesButton>
                </view>
              </view>
            </view>

            <SalesButton type="plain" size="small" @click="addOtherCharge">
              + 添加其他费用
            </SalesButton>
          </view>

          <!-- 报价信息 -->
          <view class="form-group">
            <view class="form-group-title">
              <text class="group-title-text">报价信息</text>
              <text class="group-subtitle">报价有效期和付款条件</text>
            </view>

            <view class="quote-info-row">
              <SalesInput
                v-model="quoteMetadata.quoteNumber"
                label="报价编号"
                placeholder="自动生成"
                :disabled="true"
              />
              <SalesButton size="small" @click="generateQuoteNumber">重新生成</SalesButton>
            </view>

            <SalesInput
              v-model.number="quoteMetadata.validityDays"
              label="有效天数"
              placeholder="30"
              type="number"
              @input="saveDraft"
            >
              <template #help>
                <text class="input-help-text">有效至：{{ getValidUntilDate() }}</text>
              </template>
            </SalesInput>

            <SalesSelector
              v-model="quoteMetadata.paymentTerms"
              label="付款条件"
              :options="paymentOptions"
              @change="saveDraft"
            />

            <SalesTextarea
              v-model="quoteMetadata.specialTerms"
              label="特殊条款"
              placeholder="特殊要求或条款（选填）"
              :maxlength="200"
              :show-count="true"
              @input="saveDraft"
            />
          </view>
        </view>

        <!-- 价格明细 -->
        <view class="price-breakdown">
          <view class="breakdown-title">
            <text class="breakdown-title-text">价格明细</text>
          </view>

          <view class="breakdown-list">
            <view class="breakdown-item">
              <text class="breakdown-label">产品小计</text>
              <text class="breakdown-value">¥{{ subtotal.toFixed(2) }}</text>
            </view>

            <view v-if="totalDiscountAmount > 0" class="breakdown-item discount-item">
              <text class="breakdown-label">折扣金额</text>
              <text class="breakdown-value discount-value"
                >-¥{{ totalDiscountAmount.toFixed(2) }}</text
              >
            </view>

            <view class="breakdown-item subtotal-item">
              <text class="breakdown-label">折扣后小计</text>
              <text class="breakdown-value">¥{{ discountedSubtotal.toFixed(2) }}</text>
            </view>

            <view v-if="totalAdditionalCharges > 0" class="breakdown-item">
              <text class="breakdown-label">附加费用</text>
              <text class="breakdown-value">+¥{{ totalAdditionalCharges.toFixed(2) }}</text>
            </view>

            <view v-if="taxAmount > 0" class="breakdown-item">
              <text class="breakdown-label">税费 ({{ pricingConfig.taxRate }}%)</text>
              <text class="breakdown-value">+¥{{ taxAmount.toFixed(2) }}</text>
            </view>

            <view class="breakdown-item total-item">
              <text class="breakdown-label">合计金额</text>
              <text class="breakdown-value total-value">¥{{ totalPrice.toFixed(2) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 图片上传 -->
      <view class="sales-card">
        <ImageUpload
          v-model="form.images"
          label="相关图片"
          :maxCount="6"
          help="最多上传6张图片，单张不超过10MB"
        />
      </view>

      <!-- 底部操作栏 -->
      <view class="sales-footer">
        <view class="sales-total">
          <text class="sales-total-label">合计金额：</text>
          <text class="sales-total-price">¥{{ totalPrice.toFixed(2) }}</text>
        </view>
        <view class="sales-footer-buttons">
          <SalesButton type="default" @click="handleCancel"> 取消 </SalesButton>
          <SalesButton type="primary" :loading="submitting" @click="handleSubmit">
            生成报价
          </SalesButton>
        </view>
      </view>
    </view>

    <!-- Product Selector Modal -->
    <ProductSelector
      mode="modal"
      v-model:show="showProductSelector"
      :selected-products="selectedProducts"
      :categories="categories"
      :max-selection="20"
      @confirm="handleProductsConfirm"
      @cancel="handleProductsCancel"
    />
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import SalesHeader from '@/components/sales/SalesHeader.vue'
import SalesInput from '@/components/sales/SalesInput.vue'
import SalesTextarea from '@/components/sales/SalesTextarea.vue'
import SalesButton from '@/components/sales/SalesButton.vue'
import SalesSelector from '@/components/sales/SalesSelector.vue'
import ImageUpload from '@/components/sales/ImageUpload.vue'
import ProductSelector from '@/components/business/ProductSelector.vue'
import type { SelectedProduct } from '@/components/business/ProductSelector.vue'
import { QuotesApi } from '@/api'
import type { QuoteItem } from '@/types/models'
import type { Category } from '@/types/api'

// 表单数据
const form = reactive({
  customerName: '',
  customerPhone: '',
  customerWechat: '',
  customerEmail: '',
  customerProvince: '',
  customerCity: '',
  customerAddress: '',
  customerType: 'individual',
  customerRemark: '',
  saveCustomer: true,
  images: []
})

// 表单错误
const errors = reactive({
  customerName: '',
  customerPhone: '',
  customerWechat: '',
  customerEmail: '',
  customerAddress: '',
  customerRemark: ''
})

// 验证状态
const customerNameValidating = ref(false)
const phoneValidating = ref(false)
const locationLoading = ref(false)

// 已选产品
const selectedProducts = ref<SelectedProduct[]>([])

// 产品选择器状态
const showProductSelector = ref(false)

// 产品分类数据
const categories = ref<Category[]>([
  { id: 'tables', name: '台球桌' },
  { id: 'cues', name: '球杆' },
  { id: 'balls', name: '台球' },
  { id: 'accessories', name: '配件' },
  { id: 'maintenance', name: '维护用品' }
])

// 价格配置
const pricingConfig = reactive({
  // 折扣设置
  discountType: 'percentage' as 'percentage' | 'fixed',
  discountValue: 0,

  // 税费设置
  taxRate: 13, // 13% VAT
  taxIncluded: false,

  // 附加费用
  deliveryFee: 0,
  installationFee: 0,
  otherCharges: [] as Array<{
    id: string
    name: string
    amount: number
    type: 'fixed' | 'percentage'
  }>,

  // 显示设置
  showAdvancedPricing: false
})

// 报价元数据
const quoteMetadata = reactive({
  quoteNumber: '',
  validityDays: 30,
  paymentTerms: 'immediate' as 'immediate' | '30days' | '60days' | 'cod',
  specialTerms: '',
  notes: ''
})

// 付款条件选项
const paymentOptions = [
  { value: 'immediate', label: '立即付款' },
  { value: '30days', label: '30天账期' },
  { value: '60days', label: '60天账期' },
  { value: 'cod', label: '货到付款' }
]

// 提交状态
const submitting = ref(false)

// 客户类型选项
const customerTypes = ref([
  { value: 'individual', label: '个人客户', icon: '👤' },
  { value: 'company', label: '企业客户', icon: '🏢' },
  { value: 'dealer', label: '经销商', icon: '🤝' },
  { value: 'club', label: '俱乐部', icon: '🎯' }
])

// 省份城市数据
const provinceOptions = ref([
  { label: '云南省', value: 'yunnan' },
  { label: '四川省', value: 'sichuan' },
  { label: '贵州省', value: 'guizhou' }
  // 更多省份...
])

const cityOptions = ref<Array<{ label: string; value: string }>>([])

// 城市数据映射
const cityMap = {
  yunnan: [
    { label: '昆明市', value: 'kunming' },
    { label: '大理州', value: 'dali' },
    { label: '丽江市', value: 'lijiang' },
    { label: '西双版纳州', value: 'xishuangbanna' }
  ],
  sichuan: [
    { label: '成都市', value: 'chengdu' },
    { label: '绵阳市', value: 'mianyang' }
  ],
  guizhou: [
    { label: '贵阳市', value: 'guiyang' },
    { label: '遵义市', value: 'zunyi' }
  ]
}

// 计算属性
const subtotal = computed(() => {
  return selectedProducts.value.reduce((sum, item) => sum + item.subtotal, 0)
})

// 客户类型折扣
const customerTypeDiscount = computed(() => {
  const discountRates = {
    individual: 0,
    company: 0.05, // 5% corporate discount
    dealer: 0.1, // 10% dealer discount
    club: 0.08 // 8% club discount
  }
  return subtotal.value * (discountRates[form.customerType] || 0)
})

// 总折扣金额
const totalDiscountAmount = computed(() => {
  let discount = customerTypeDiscount.value

  if (pricingConfig.discountType === 'percentage') {
    discount += subtotal.value * (pricingConfig.discountValue / 100)
  } else {
    discount += pricingConfig.discountValue
  }

  return Math.min(discount, subtotal.value) // 折扣不能超过小计
})

// 折扣后小计
const discountedSubtotal = computed(() => {
  return subtotal.value - totalDiscountAmount.value
})

// 附加费用总计
const totalAdditionalCharges = computed(() => {
  let charges = pricingConfig.deliveryFee + pricingConfig.installationFee

  pricingConfig.otherCharges.forEach(charge => {
    if (charge.type === 'percentage') {
      charges += discountedSubtotal.value * (charge.amount / 100)
    } else {
      charges += charge.amount
    }
  })

  return charges
})

// 税费计算
const taxAmount = computed(() => {
  if (pricingConfig.taxIncluded) {
    return 0 // 含税价格，不额外计算
  }
  return (discountedSubtotal.value + totalAdditionalCharges.value) * (pricingConfig.taxRate / 100)
})

// 最终总价
const totalPrice = computed(() => {
  return discountedSubtotal.value + totalAdditionalCharges.value + taxAmount.value
})

// 价格明细
const priceBreakdown = computed(() => {
  return {
    subtotal: subtotal.value,
    customerDiscount: customerTypeDiscount.value,
    additionalDiscount: totalDiscountAmount.value - customerTypeDiscount.value,
    totalDiscount: totalDiscountAmount.value,
    discountedSubtotal: discountedSubtotal.value,
    deliveryFee: pricingConfig.deliveryFee,
    installationFee: pricingConfig.installationFee,
    otherCharges:
      totalAdditionalCharges.value - pricingConfig.deliveryFee - pricingConfig.installationFee,
    totalAdditionalCharges: totalAdditionalCharges.value,
    taxAmount: taxAmount.value,
    finalTotal: totalPrice.value
  }
})

const isValidPhone = computed(() => {
  return /^1[3-9]\d{9}$/.test(form.customerPhone)
})

onMounted(() => {
  // 尝试从localStorage恢复草稿
  loadDraft()
  // 生成报价编号
  generateQuoteNumber()
})

// 生成报价编号
const generateQuoteNumber = () => {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  const randomSuffix = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, '0')
  quoteMetadata.quoteNumber = `YS-${dateStr}-${randomSuffix}`
}

// 加载草稿
const loadDraft = () => {
  try {
    const draft = uni.getStorageSync('quote_draft')
    if (draft) {
      if (draft.form) {
        Object.assign(form, draft.form)
      }
      if (draft.selectedProducts) {
        selectedProducts.value = draft.selectedProducts
      }
      if (draft.pricingConfig) {
        Object.assign(pricingConfig, draft.pricingConfig)
      }
      if (draft.quoteMetadata) {
        Object.assign(quoteMetadata, draft.quoteMetadata)
      }
    }
  } catch (error) {
    console.warn('Failed to load draft:', error)
  }
}

// 保存草稿
const saveDraft = () => {
  try {
    const draftData = {
      form,
      selectedProducts: selectedProducts.value,
      pricingConfig,
      quoteMetadata
    }
    uni.setStorageSync('quote_draft', draftData)
  } catch (error) {
    console.warn('Failed to save draft:', error)
  }
}

// 客户姓名输入处理
const handleCustomerNameInput = (value: string) => {
  form.customerName = value
  saveDraft()

  // 实时验证
  if (value.trim()) {
    errors.customerName = ''
  }
}

// 验证客户姓名
const validateCustomerName = async () => {
  const name = form.customerName.trim()

  if (!name) {
    errors.customerName = '请输入客户姓名'
    return false
  }

  if (name.length < 2) {
    errors.customerName = '客户姓名至少2个字符'
    return false
  }

  if (name.length > 20) {
    errors.customerName = '客户姓名不能超过20个字符'
    return false
  }

  // 检查特殊字符
  if (!/^[\u4e00-\u9fa5a-zA-Z\s]+$/.test(name)) {
    errors.customerName = '客户姓名只能包含中文、英文和空格'
    return false
  }

  errors.customerName = ''
  return true
}

// 手机号输入处理
const handlePhoneInput = (value: string) => {
  // 只保留数字
  const phoneNumber = value.replace(/\D/g, '')
  form.customerPhone = phoneNumber
  saveDraft()

  // 实时验证
  if (phoneNumber) {
    errors.customerPhone = ''
  }
}

// 验证手机号
const validatePhone = async () => {
  const phone = form.customerPhone.trim()

  if (!phone) {
    errors.customerPhone = '请输入手机号码'
    return false
  }

  if (!/^1[3-9]\d{9}$/.test(phone)) {
    errors.customerPhone = '请输入正确的11位手机号码'
    return false
  }

  phoneValidating.value = true

  try {
    // 模拟验证手机号是否有效
    await new Promise(resolve => setTimeout(resolve, 500))
    errors.customerPhone = ''
    return true
  } catch (error) {
    errors.customerPhone = '手机号码验证失败，请检查'
    return false
  } finally {
    phoneValidating.value = false
  }
}

// 格式化手机号显示
const formatPhoneDisplay = (phone: string) => {
  if (phone.length === 11) {
    return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3')
  }
  return phone
}

// 验证微信号
const validateWechat = () => {
  const wechat = form.customerWechat.trim()

  if (wechat && wechat.length < 6) {
    errors.customerWechat = '微信号至少6位'
    return false
  }

  errors.customerWechat = ''
  return true
}

// 验证邮箱
const validateEmail = () => {
  const email = form.customerEmail.trim()

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.customerEmail = '请输入正确的邮箱格式'
    return false
  }

  errors.customerEmail = ''
  return true
}

// 微信号同步到手机号
const copyWechatToPhone = () => {
  const wechat = form.customerWechat.trim()
  if (/^1[3-9]\d{9}$/.test(wechat)) {
    form.customerPhone = wechat
    validatePhone()
    uni.showToast({
      title: '已同步到手机号',
      icon: 'success',
      duration: 1000
    })
  } else {
    uni.showToast({
      title: '微信号格式不是手机号',
      icon: 'none'
    })
  }
}

// 省份改变处理
const handleProvinceChange = (province: string) => {
  form.customerProvince = province
  form.customerCity = '' // 重置城市选择
  cityOptions.value = cityMap[province] || []
  saveDraft()
}

// 城市改变处理
const handleCityChange = (city: string) => {
  form.customerCity = city
  saveDraft()
}

// 获取当前位置
const getCurrentLocation = () => {
  locationLoading.value = true

  uni.getLocation({
    type: 'gcj02',
    success: res => {
      // 模拟根据坐标获取地址
      setTimeout(() => {
        form.customerAddress = '昆明市五华区东风西路123号' // 模拟地址
        locationLoading.value = false
        uni.showToast({
          title: '定位成功',
          icon: 'success'
        })
      }, 1000)
    },
    fail: () => {
      locationLoading.value = false
      uni.showModal({
        title: '定位失败',
        content: '无法获取您的位置信息，请手动输入地址',
        showCancel: false
      })
    }
  })
}

// 切换保存客户选项
const toggleSaveCustomer = () => {
  form.saveCustomer = !form.saveCustomer
  saveDraft()
}

// 选择产品
const selectProducts = () => {
  showProductSelector.value = true
}

// 产品选择确认
const handleProductsConfirm = (products: SelectedProduct[]) => {
  selectedProducts.value = products
  showProductSelector.value = false

  uni.showToast({
    title: `已选择${products.length}种产品`,
    icon: 'success',
    duration: 1500
  })
}

// 产品选择取消
const handleProductsCancel = () => {
  showProductSelector.value = false
}

// 折扣类型切换
const toggleDiscountType = () => {
  pricingConfig.discountType = pricingConfig.discountType === 'percentage' ? 'fixed' : 'percentage'
  pricingConfig.discountValue = 0
  saveDraft()
}

// 添加其他费用
const addOtherCharge = () => {
  const newCharge = {
    id: Date.now().toString(),
    name: '',
    amount: 0,
    type: 'fixed' as 'fixed' | 'percentage'
  }
  pricingConfig.otherCharges.push(newCharge)
}

// 删除其他费用
const removeOtherCharge = (id: string) => {
  const index = pricingConfig.otherCharges.findIndex(charge => charge.id === id)
  if (index > -1) {
    pricingConfig.otherCharges.splice(index, 1)
    saveDraft()
  }
}

// 获取有效期日期
const getValidUntilDate = () => {
  const date = new Date()
  date.setDate(date.getDate() + quoteMetadata.validityDays)
  return date.toLocaleDateString('zh-CN')
}

// 价格输入处理
const handlePricingInput = (field: string, value: any) => {
  pricingConfig[field] = value
  saveDraft()
}

// 折扣验证
const validateDiscount = () => {
  if (pricingConfig.discountType === 'percentage') {
    if (pricingConfig.discountValue < 0 || pricingConfig.discountValue > 50) {
      uni.showToast({
        title: '折扣比例应在0-50%之间',
        icon: 'none'
      })
      pricingConfig.discountValue = Math.max(0, Math.min(50, pricingConfig.discountValue))
    }
  } else {
    if (pricingConfig.discountValue > subtotal.value) {
      uni.showToast({
        title: '折扣金额不能超过小计',
        icon: 'none'
      })
      pricingConfig.discountValue = subtotal.value
    }
  }
}

// 验证表单
const validateForm = (): boolean => {
  let isValid = true

  // 重置所有错误
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })

  // 验证必填项
  if (!validateCustomerName()) isValid = false
  if (!validatePhone()) isValid = false

  // 验证选填项格式
  if (!validateWechat()) isValid = false
  if (!validateEmail()) isValid = false

  // 验证是否选择了产品
  if (selectedProducts.value.length === 0) {
    uni.showToast({
      title: '请选择产品',
      icon: 'none'
    })
    isValid = false
  }

  return isValid
}

// 取消
const handleCancel = () => {
  uni.showModal({
    title: '提示',
    content: '确定要取消新建报价吗？未保存的信息将丢失。',
    success: res => {
      if (res.confirm) {
        // 清除草稿
        try {
          uni.removeStorageSync('quote_draft')
        } catch (error) {
          console.warn('Failed to clear draft:', error)
        }
        uni.navigateBack()
      }
    }
  })
}

// 提交
const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  submitting.value = true

  try {
    // 构建请求数据
    const request = {
      customer: {
        name: form.customerName,
        phone: form.customerPhone,
        wechat: form.customerWechat,
        email: form.customerEmail,
        province: form.customerProvince,
        city: form.customerCity,
        address: form.customerAddress,
        type: form.customerType,
        remark: form.customerRemark,
        saveToAddressBook: form.saveCustomer
      },
      items: selectedProducts.value.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        product_model: item.product.model,
        sku_id: item.skuId,
        sku_name: item.skuName,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.subtotal
      })),
      pricing: {
        subtotal: subtotal.value,
        discount: {
          type: pricingConfig.discountType,
          value: pricingConfig.discountValue,
          amount: totalDiscountAmount.value
        },
        tax: {
          rate: pricingConfig.taxRate,
          amount: taxAmount.value,
          included: pricingConfig.taxIncluded
        },
        additionalCharges: {
          deliveryFee: pricingConfig.deliveryFee,
          installationFee: pricingConfig.installationFee,
          otherCharges: pricingConfig.otherCharges,
          total: totalAdditionalCharges.value
        },
        finalTotal: totalPrice.value
      },
      quote: {
        quoteNumber: quoteMetadata.quoteNumber,
        validityDays: quoteMetadata.validityDays,
        paymentTerms: quoteMetadata.paymentTerms,
        specialTerms: quoteMetadata.specialTerms,
        notes: quoteMetadata.notes
      },
      images: form.images
    }

    // 调用 API 创建报价
    const response = await QuotesApi.createQuote(request)

    if (response.success && response.data) {
      // 清除草稿
      try {
        uni.removeStorageSync('quote_draft')
      } catch (error) {
        console.warn('Failed to clear draft:', error)
      }

      uni.showToast({
        title: '报价创建成功',
        icon: 'success'
      })

      // 跳转到预览页面
      setTimeout(() => {
        uni.redirectTo({
          url: `/pages/sales/quote/preview?id=${response.data?.id || quoteMetadata.quoteNumber}`
        })
      }, 1500)
    } else {
      throw new Error(response.error?.message || '创建失败')
    }
  } catch (error) {
    uni.showToast({
      title: (error as Error).message || '创建失败，请重试',
      icon: 'none'
    })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.sales-container {
  min-height: 100vh;
  background-color: $bg-color-page;
}

.sales-page {
  padding: $spacing-base;
  padding-top: calc(44px + var(--status-bar-height, 0) + #{$spacing-base});
  padding-bottom: 120rpx; // 为底部操作栏留空间
}

.sales-card {
  @include card;
  margin-bottom: $spacing-base;
  padding: $spacing-lg;
}

// 增强的节标题
.sales-section-header {
  margin-bottom: $spacing-lg;
  padding-bottom: $spacing-base;
  border-bottom: 1px solid $border-color-lighter;
}

.sales-section-title {
  @include flex-center;
  gap: $spacing-sm;
  margin-bottom: $spacing-xs;
}

.section-title-icon {
  font-size: $font-size-large;
}

.section-title-text {
  font-size: $font-size-large;
  font-weight: $font-weight-semibold;
  color: $text-color;
}

.section-subtitle {
  font-size: $font-size-small;
  color: $text-color-secondary;
}

// 表单组
.form-group {
  margin-bottom: $spacing-xl;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-group-title {
  margin-bottom: $spacing-base;
  padding-bottom: $spacing-sm;
  border-bottom: 1px solid $border-color-lighter;
}

.group-title-text {
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: $text-color;
  display: block;
  margin-bottom: $spacing-xs;
}

.group-subtitle {
  font-size: $font-size-small;
  color: $text-color-secondary;
  display: block;
}

// 输入框增强元素
.input-success-icon {
  color: $success-color;
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
}

.input-prefix-icon {
  font-size: $font-size-base;
  margin-right: $spacing-xs;
}

.input-help-text {
  font-size: $font-size-small;
  color: $primary-color;
  margin-top: $spacing-xs;
}

// 地区选择器
.location-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-base;
  margin-bottom: $spacing-base;
}

// 客户类型选择器
.customer-type-selector {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-base;
}

.type-option {
  @include card;
  @include flex-center;
  flex-direction: column;
  padding: $spacing-base;
  cursor: pointer;
  transition: $transition-base;
  border: 2px solid transparent;

  &:active {
    transform: scale(0.98);
  }

  &--active {
    border-color: $primary-color;
    background-color: $primary-bg;

    .type-label {
      color: $primary-color;
      font-weight: $font-weight-semibold;
    }
  }
}

.type-icon {
  font-size: $font-size-extra-large;
  margin-bottom: $spacing-xs;
}

.type-label {
  font-size: $font-size-small;
  color: $text-color;
  text-align: center;
}

// 表单操作
.form-actions {
  margin-top: $spacing-lg;
  padding-top: $spacing-base;
  border-top: 1px solid $border-color-lighter;
}

.save-customer-option {
  @include flex-center;
  cursor: pointer;
  padding: $spacing-sm;
  border-radius: $border-radius-base;
  transition: $transition-base;

  &:active {
    background-color: $bg-color-page;
  }
}

.option-checkbox {
  width: 40rpx;
  height: 40rpx;
  border: 2px solid $border-color;
  border-radius: $border-radius-small;
  @include flex-center;
  margin-right: $spacing-sm;
  transition: $transition-base;

  &--checked {
    background-color: $primary-color;
    border-color: $primary-color;
  }
}

.checkbox-icon {
  color: #fff;
  font-size: $font-size-small;
  font-weight: $font-weight-bold;
}

.option-text {
  font-size: $font-size-base;
  color: $text-color;
  flex: 1;
}

.sales-product-selector {
  margin-bottom: $spacing-base;
}

.sales-selected-list {
  border-top: 1px solid $border-color-lighter;
  padding-top: $spacing-base;
}

.sales-selected-item {
  @include flex-between;
  padding: $spacing-sm 0;
  border-bottom: 1px solid $border-color-lighter;

  &:last-child {
    border-bottom: none;
  }
}

.sales-selected-info {
  flex: 1;
}

.sales-selected-name {
  display: block;
  font-size: $font-size-base;
  color: $text-color;
  margin-bottom: $spacing-xs;
}

.sales-selected-spec {
  display: block;
  font-size: $font-size-small;
  color: $text-color-secondary;
}

.sales-selected-price {
  font-size: $font-size-large;
  font-weight: $font-weight-semibold;
  color: $danger-color;
}

.sales-empty {
  padding: $spacing-xl 0;
  text-align: center;
}

.sales-empty-text {
  font-size: $font-size-base;
  color: $text-color-placeholder;
}

.sales-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: $bg-color-white;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
  padding: $spacing-base;
  @include flex-between;
  z-index: $z-index-fixed;
  padding-bottom: calc(#{$spacing-base} + env(safe-area-inset-bottom));
}

.sales-total {
  @include flex-center;
}

.sales-total-label {
  font-size: $font-size-base;
  color: $text-color-secondary;
  margin-right: $spacing-xs;
}

.sales-total-price {
  font-size: $font-size-extra-large;
  font-weight: $font-weight-semibold;
  color: $danger-color;
}

.sales-footer-buttons {
  display: flex;
  gap: $spacing-sm;
}

// 价格计算样式
.pricing-summary {
  background-color: $bg-color-page;
  border-radius: $border-radius-base;
  padding: $spacing-base;
  margin-bottom: $spacing-lg;
}

.summary-row {
  @include flex-between;
  padding: $spacing-sm 0;

  &:not(:last-child) {
    border-bottom: 1px solid $border-color-lighter;
  }

  &.discount-row {
    color: $success-color;
  }
}

.summary-label {
  font-size: $font-size-base;
  color: $text-color;
}

.summary-value {
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  color: $text-color;

  &.discount-value {
    color: $success-color;
  }
}

// 折扣控制
.discount-controls {
  display: flex;
  flex-direction: column;
  gap: $spacing-base;
}

.discount-type-toggle {
  display: flex;
  gap: $spacing-sm;
}

// 高级价格设置
.advanced-pricing-toggle {
  @include flex-between;
  padding: $spacing-base;
  background-color: $bg-color-page;
  border-radius: $border-radius-base;
  cursor: pointer;
  transition: $transition-base;
  margin: $spacing-lg 0;

  &:active {
    background-color: $primary-bg;
  }
}

.toggle-text {
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: $text-color;
}

.toggle-icon {
  font-size: $font-size-base;
  color: $primary-color;
  transition: $transition-base;
}

.advanced-pricing-content {
  animation: fadeInDown 0.3s ease-out;
}

// 税费控制
.tax-controls {
  display: flex;
  flex-direction: column;
  gap: $spacing-base;
}

.tax-included-option {
  @include flex-center;
  cursor: pointer;
  padding: $spacing-sm;
  border-radius: $border-radius-base;
  transition: $transition-base;

  &:active {
    background-color: $bg-color-page;
  }
}

// 其他费用
.other-charges-list {
  margin: $spacing-base 0;
}

.other-charge-item {
  background-color: $bg-color-page;
  border-radius: $border-radius-base;
  padding: $spacing-base;
  margin-bottom: $spacing-base;

  &:last-child {
    margin-bottom: 0;
  }
}

.charge-amount-row {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-top: $spacing-sm;
}

// 报价信息
.quote-info-row {
  display: flex;
  align-items: flex-end;
  gap: $spacing-sm;

  .sales-input {
    flex: 1;
  }
}

// 价格明细
.price-breakdown {
  margin-top: $spacing-xl;
  padding-top: $spacing-lg;
  border-top: 2px solid $border-color;
}

.breakdown-title {
  margin-bottom: $spacing-base;
}

.breakdown-title-text {
  font-size: $font-size-large;
  font-weight: $font-weight-semibold;
  color: $text-color;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.breakdown-item {
  @include flex-between;
  padding: $spacing-sm 0;

  &.discount-item {
    .breakdown-value {
      color: $success-color;
    }
  }

  &.subtotal-item {
    padding-top: $spacing-base;
    border-top: 1px solid $border-color-lighter;
    margin-top: $spacing-xs;
  }

  &.total-item {
    padding: $spacing-base 0;
    border-top: 2px solid $primary-color;
    margin-top: $spacing-base;

    .breakdown-label,
    .breakdown-value {
      font-size: $font-size-large;
      font-weight: $font-weight-bold;
    }

    .breakdown-value {
      color: $danger-color;
    }
  }
}

.breakdown-label {
  font-size: $font-size-base;
  color: $text-color-secondary;
}

.breakdown-value {
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  color: $text-color;

  &.discount-value {
    color: $success-color;
  }

  &.total-value {
    color: $danger-color;
  }
}

// 动画效果
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* #ifdef H5 */
.sales-page {
  padding-top: calc(44px + #{$spacing-base});
}
/* #endif */

/* 响应式设计 */
@media (min-width: 768px) {
  .customer-type-selector {
    grid-template-columns: repeat(4, 1fr);
  }

  .location-selector {
    grid-template-columns: repeat(3, 1fr);
  }

  .sales-page {
    max-width: 800px;
    margin: 0 auto;
  }

  .discount-type-toggle {
    flex-direction: row;
    justify-content: flex-start;
  }

  .tax-controls {
    flex-direction: row;
    align-items: flex-end;

    .sales-input {
      flex: 1;
    }
  }

  .charge-amount-row {
    flex-wrap: nowrap;

    .sales-input {
      flex: 1;
    }
  }
}

@media (min-width: 1024px) {
  .sales-card {
    padding: $spacing-xl;
  }

  .form-group {
    margin-bottom: $spacing-xxl;
  }
}

/* 动画效果 */
.type-option {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 无障碍优化 */
@media (prefers-reduced-motion: reduce) {
  .type-option,
  .save-customer-option,
  .option-checkbox {
    transition: none;
    animation: none;
  }
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .sales-container {
    background-color: #1a1a1a;
  }

  .sales-card {
    background-color: #2d2d2d;
    border-color: #404040;
  }

  .section-title-text,
  .group-title-text,
  .option-text {
    color: #ffffff;
  }

  .section-subtitle,
  .group-subtitle {
    color: #cccccc;
  }
}
</style>
