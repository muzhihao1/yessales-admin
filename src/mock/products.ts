import type { Accessory, Product, ProductSku } from '@/types/models'

export const mockProducts: Product[] = [
  {
    id: '1',
    name: '星牌中式黑八台球桌',
    model: 'XP-S9',
    category: '台球桌',
    price: 28800,
    unit: '台',
    image_url: '/static/images/products/xp-s9.jpg',
    description: '专业比赛级中式黑八台球桌，采用进口台呢，精准度高',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    skus: [
      {
        id: '1-1',
        product_id: '1',
        spec: '标准尺寸',
        color: '绿色台呢',
        price: 28800,
        stock: 10,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '1-2',
        product_id: '1',
        spec: '标准尺寸',
        color: '蓝色台呢',
        price: 29800,
        stock: 5,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      }
    ]
  },
  {
    id: '2',
    name: '美式落袋台球桌',
    model: 'US-PRO-9',
    category: '台球桌',
    price: 35800,
    unit: '台',
    image_url: '/static/images/products/us-pro-9.jpg',
    description: '专业美式九球台球桌，原装进口配件',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    skus: []
  },
  {
    id: '3',
    name: '斯诺克台球桌',
    model: 'SNK-12',
    category: '台球桌',
    price: 68800,
    unit: '台',
    image_url: '/static/images/products/snk-12.jpg',
    description: '标准斯诺克比赛台球桌，12英尺',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    skus: []
  },
  {
    id: '4',
    name: '台球桌专用地毯',
    model: 'CP-001',
    category: '地毯',
    price: 180,
    unit: '平方米',
    image_url: '/static/images/products/carpet-001.jpg',
    description: '高档台球室专用地毯，防滑耐磨',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    skus: [
      {
        id: '4-1',
        product_id: '4',
        spec: '厚度8mm',
        color: '深灰色',
        price: 180,
        stock: 1000,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '4-2',
        product_id: '4',
        spec: '厚度10mm',
        color: '深灰色',
        price: 220,
        stock: 800,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '4-3',
        product_id: '4',
        spec: '厚度8mm',
        color: '酒红色',
        price: 200,
        stock: 600,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      }
    ]
  },
  {
    id: '5',
    name: '豪华吊灯',
    model: 'LED-LUX-3',
    category: '照明',
    price: 2880,
    unit: '套',
    image_url: '/static/images/products/led-lux-3.jpg',
    description: '台球桌专用LED吊灯，三头设计，光线均匀',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    skus: []
  }
]

export const mockAccessories: Accessory[] = [
  {
    id: 'a1',
    name: '专业球杆',
    price: 580,
    unit: '根',
    image_url: '/static/images/accessories/cue-001.jpg',
    description: '进口枫木球杆，手感极佳',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'a2',
    name: '球杆架',
    price: 380,
    unit: '个',
    image_url: '/static/images/accessories/rack-001.jpg',
    description: '实木球杆架，可放置6根球杆',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'a3',
    name: '台球',
    price: 280,
    unit: '套',
    image_url: '/static/images/accessories/balls-001.jpg',
    description: '比赛级水晶球，一套16个',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'a4',
    name: '巧克粉',
    price: 20,
    unit: '盒',
    image_url: '/static/images/accessories/chalk-001.jpg',
    description: '进口巧克粉，防滑效果好',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'a5',
    name: '记分牌',
    price: 180,
    unit: '个',
    image_url: '/static/images/accessories/score-001.jpg',
    description: '电子记分牌，LED显示',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z'
  }
]

export default {
  products: mockProducts,
  accessories: mockAccessories
}
