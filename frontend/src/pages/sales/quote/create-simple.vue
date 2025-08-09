<template>
  <div class="quote-create">
    <div class="page-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1 class="page-title">新建报价单</h1>
    </div>

    <div class="quote-form">
      <!-- 客户信息 -->
      <div class="form-section">
        <h2 class="section-title">客户信息</h2>
        <div class="form-group">
          <label>客户姓名 *</label>
          <input 
            v-model="form.customerName" 
            type="text" 
            placeholder="请输入客户姓名"
            required
          />
        </div>
        <div class="form-group">
          <label>联系电话 *</label>
          <input 
            v-model="form.customerPhone" 
            type="tel" 
            placeholder="请输入联系电话"
            required
          />
        </div>
        <div class="form-group">
          <label>联系地址</label>
          <input 
            v-model="form.customerAddress" 
            type="text" 
            placeholder="请输入联系地址"
          />
        </div>
      </div>

      <!-- 产品选择 -->
      <div class="form-section">
        <h2 class="section-title">产品选择</h2>
        <div class="product-selector">
          <div class="product-item" v-for="product in sampleProducts" :key="product.id">
            <div class="product-info">
              <span class="product-name">{{ product.name }}</span>
              <span class="product-price">¥{{ product.price.toLocaleString() }}</span>
            </div>
            <div class="quantity-controls">
              <button @click="decreaseQuantity(product.id)">-</button>
              <span class="quantity">{{ getQuantity(product.id) }}</span>
              <button @click="increaseQuantity(product.id)">+</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 报价汇总 -->
      <div class="form-section">
        <h2 class="section-title">报价汇总</h2>
        <div class="quote-summary">
          <div class="summary-row">
            <span>商品小计:</span>
            <span>¥{{ totalAmount.toLocaleString() }}</span>
          </div>
          <div class="summary-row">
            <span>优惠金额:</span>
            <input v-model.number="form.discount" type="number" min="0" />
          </div>
          <div class="summary-row final">
            <span>报价总额:</span>
            <span class="total">¥{{ finalAmount.toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <!-- 备注信息 -->
      <div class="form-section">
        <h2 class="section-title">备注信息</h2>
        <textarea 
          v-model="form.notes" 
          placeholder="请输入备注信息..."
          rows="4"
        ></textarea>
      </div>

      <!-- 操作按钮 -->
      <div class="form-actions">
        <button class="btn-secondary" @click="saveAsDraft">保存草稿</button>
        <button class="btn-primary" @click="generateQuote" :disabled="!isFormValid">
          生成报价单
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 表单数据
const form = ref({
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  discount: 0,
  notes: ''
})

// 示例产品数据
const sampleProducts = ref([
  { id: 1, name: '专业台球桌', price: 15000 },
  { id: 2, name: '台球杆套装', price: 2800 },
  { id: 3, name: '台球配件组合', price: 1200 },
  { id: 4, name: 'LED台球灯', price: 3500 }
])

// 产品数量
const quantities = ref<Record<number, number>>({})

// 方法
const goBack = () => {
  router.back()
}

const getQuantity = (productId: number): number => {
  return quantities.value[productId] || 0
}

const increaseQuantity = (productId: number) => {
  quantities.value[productId] = (quantities.value[productId] || 0) + 1
}

const decreaseQuantity = (productId: number) => {
  const current = quantities.value[productId] || 0
  if (current > 0) {
    quantities.value[productId] = current - 1
  }
}

// 计算总金额
const totalAmount = computed(() => {
  return sampleProducts.value.reduce((total, product) => {
    const quantity = getQuantity(product.id)
    return total + (product.price * quantity)
  }, 0)
})

const finalAmount = computed(() => {
  return Math.max(0, totalAmount.value - (form.value.discount || 0))
})

// 表单验证
const isFormValid = computed(() => {
  return form.value.customerName.trim() !== '' && 
         form.value.customerPhone.trim() !== '' &&
         totalAmount.value > 0
})

const saveAsDraft = () => {
  console.log('保存草稿:', form.value, quantities.value)
  alert('草稿已保存')
}

const generateQuote = () => {
  if (!isFormValid.value) {
    alert('请填写必填信息并选择产品')
    return
  }
  
  console.log('生成报价单:', {
    customer: form.value,
    products: quantities.value,
    totalAmount: finalAmount.value
  })
  
  alert('报价单生成成功！')
  // 可以导航到预览页面
  // router.push('/sales/quote/preview?id=new')
}
</script>

<style lang="scss" scoped>
.quote-create {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.back-btn {
  background: none;
  border: none;
  font-size: 16px;
  color: #666;
  cursor: pointer;
  padding: 8px;
  margin-right: 15px;
  
  &:hover {
    color: #333;
  }
}

.page-title {
  font-size: 24px;
  margin: 0;
  color: #333;
}

.quote-form {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.form-section {
  margin-bottom: 40px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: 18px;
  margin-bottom: 20px;
  color: #333;
  border-bottom: 2px solid #667eea;
  padding-bottom: 10px;
}

.form-group {
  margin-bottom: 20px;
  
  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #333;
  }
  
  input, textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 16px;
    box-sizing: border-box;
    
    &:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
    }
  }
}

.product-selector {
  .product-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    border: 1px solid #eee;
    border-radius: 8px;
    margin-bottom: 10px;
    
    &:hover {
      border-color: #667eea;
    }
  }
  
  .product-info {
    .product-name {
      display: block;
      font-weight: 600;
      color: #333;
    }
    
    .product-price {
      color: #667eea;
      font-weight: 600;
    }
  }
  
  .quantity-controls {
    display: flex;
    align-items: center;
    gap: 15px;
    
    button {
      width: 30px;
      height: 30px;
      border: 1px solid #ddd;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      
      &:hover {
        background: #f5f5f5;
      }
    }
    
    .quantity {
      font-weight: 600;
      min-width: 20px;
      text-align: center;
    }
  }
}

.quote-summary {
  .summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #eee;
    
    input {
      width: 120px;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      text-align: right;
    }
    
    &.final {
      border-bottom: none;
      font-size: 18px;
      font-weight: 600;
      padding-top: 20px;
      
      .total {
        color: #667eea;
        font-size: 20px;
      }
    }
  }
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 40px;
  padding-top: 30px;
  border-top: 1px solid #eee;
  
  button {
    padding: 12px 30px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &.btn-secondary {
      background: #f5f5f5;
      color: #666;
      
      &:hover {
        background: #e0e0e0;
      }
    }
    
    &.btn-primary {
      background: #667eea;
      color: white;
      
      &:hover:not(:disabled) {
        background: #5a6fd8;
      }
      
      &:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
    }
  }
}
</style>