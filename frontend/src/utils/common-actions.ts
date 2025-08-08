/**
 * 通用操作配置文件
 * 为管理界面提供标准化的操作按钮配置
 */

// 预定义的常用操作配置（符合PRD要求）
export const commonActions = {
  // 报价单管理操作 (PRD Line 829)
  quotes: {
    view: { key: 'view', label: '查看详情', icon: 'eye', type: 'default' as const },
    audit: {
      key: 'audit',
      label: '审核',
      icon: 'checkmarkempty',
      type: 'primary' as const,
      requiresConfirmation: true
    },
    edit: { key: 'edit', label: '修改', icon: 'compose', type: 'default' as const },
    delete: {
      key: 'delete',
      label: '删除',
      icon: 'trash',
      type: 'danger' as const,
      requiresConfirmation: true,
      confirmMessage: '确定要删除这个报价单吗？此操作不可撤销。'
    },
    approve: { key: 'approve', label: '审批通过', icon: 'checkmarkempty', type: 'primary' as const },
    reject: { key: 'reject', label: '驳回', icon: 'close', type: 'warning' as const }
  },

  // 产品管理操作 (PRD Line 855)
  products: {
    view: { key: 'view', label: '查看', icon: 'eye', type: 'default' as const },
    edit: { key: 'edit', label: '编辑', icon: 'compose', type: 'default' as const },
    images: { key: 'images', label: '图片管理', icon: 'image', type: 'default' as const },
    delete: {
      key: 'delete',
      label: '删除',
      icon: 'trash',
      type: 'danger' as const,
      requiresConfirmation: true
    }
  },

  // 客户管理操作 (PRD Line 883)
  customers: {
    view: { key: 'view', label: '查看', icon: 'eye', type: 'default' as const },
    export: { key: 'export', label: '导出', icon: 'download', type: 'default' as const }
  },

  // 销售人员管理操作 (PRD Line 903)
  users: {
    edit: { key: 'edit', label: '编辑', icon: 'compose', type: 'default' as const },
    disable: {
      key: 'disable',
      label: '禁用',
      icon: 'close',
      type: 'warning' as const,
      requiresConfirmation: true
    },
    resetPassword: {
      key: 'resetPassword',
      label: '重置密码',
      icon: 'refreshempty',
      type: 'default' as const,
      requiresConfirmation: true
    }
  }
}

// 预定义的批量操作配置
export const commonBatchOperations = {
  quotes: [
    { key: 'export', label: '导出选中', icon: 'download', type: 'default' as const },
    { key: 'delete', label: '批量删除', icon: 'trash', type: 'danger' as const, requiresConfirmation: true },
    { key: 'approve', label: '批量审批', icon: 'checkmarkempty', type: 'primary' as const }
  ],
  products: [
    { key: 'export', label: '导出选中', icon: 'download', type: 'default' as const },
    { key: 'delete', label: '批量删除', icon: 'trash', type: 'danger' as const, requiresConfirmation: true }
  ],
  customers: [
    { key: 'export', label: '导出选中', icon: 'download', type: 'default' as const }
  ],
  users: [
    { key: 'export', label: '导出选中', icon: 'download', type: 'default' as const },
    { key: 'disable', label: '批量禁用', icon: 'close', type: 'warning' as const, requiresConfirmation: true }
  ]
}