# Vercel环境变量设置指南

## 🎯 需要配置的环境变量

在Vercel项目中需要添加以下环境变量：

### 1. VITE_SUPABASE_URL
- **值**: 您的Supabase项目URL (例如: `https://xxxxx.supabase.co`)
- **获取方式**: Supabase Dashboard → Settings → API → Project URL
- **应用于**: Production, Preview, Development

### 2. VITE_SUPABASE_ANON_KEY  
- **值**: 您的Supabase匿名公钥
- **获取方式**: Supabase Dashboard → Settings → API → Project API keys → anon public
- **应用于**: Production, Preview, Development

## 📋 配置步骤

1. **访问Vercel项目设置**
   ```
   https://vercel.com/muzhihao1s-projects/yessales-admin/settings/environment-variables
   ```

2. **添加每个环境变量**
   - 点击 "Add New" 按钮
   - 输入变量名 (如 `VITE_SUPABASE_URL`)
   - 输入对应的值
   - 选择环境: Production, Preview, Development (全选)
   - 点击 "Save"

3. **重新部署**
   - 配置完成后，需要触发新的部署
   - 可以在Deployments页面点击"Redeploy"
   - 或推送新的代码到GitHub

## ✅ 验证配置

配置完成后，检查：
- [ ] Vercel构建日志显示环境变量已加载
- [ ] 应用能够成功连接Supabase
- [ ] API调用返回正常数据

## 🔍 故障排查

**如果连接失败:**
1. 检查Supabase URL格式 (应为 https://xxxxx.supabase.co)
2. 确认API密钥类型 (应为anon public，不是service_role)
3. 检查Supabase项目是否处于暂停状态
4. 验证环境变量是否应用到所有环境

**查看详细日志:**
- Vercel Functions → View Function Logs
- Supabase Dashboard → Logs → API Logs