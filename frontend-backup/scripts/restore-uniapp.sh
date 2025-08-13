#!/bin/bash

# UniApp多端构建恢复脚本
# 从标准Web构建切换回UniApp多端构建

echo "🔄 开始恢复UniApp多端构建配置..."

# 备份当前标准构建文件
echo "📦 备份当前标准构建配置..."
cp App.vue App.vue.standard-backup
cp main.ts main.ts.standard-backup  
cp vite.config.standard.ts vite.config.standard.backup

# 恢复UniApp文件
echo "🔄 恢复UniApp配置文件..."

# 1. 恢复App.vue (UniApp版本)
if [ -f "App.vue.uniapp-backup" ]; then
    cp App.vue.uniapp-backup App.vue
    echo "✅ App.vue 已恢复为UniApp版本"
else
    echo "⚠️ UniApp App.vue备份不存在，需要手动恢复"
fi

# 2. 恢复main.ts (UniApp版本)
if [ -f "main.ts.uniapp-backup" ]; then
    cp main.ts.uniapp-backup main.ts
    echo "✅ main.ts 已恢复为UniApp版本"
else
    echo "⚠️ UniApp main.ts备份不存在，需要手动恢复"
fi

# 3. 使用UniApp vite配置
cp vite.config.ts vite.config.ts.backup
echo "✅ vite.config.ts 备份完成"

# 4. 更新package.json构建脚本
echo "📝 更新package.json构建脚本..."
cat > build-commands.json << 'EOF'
{
  "scripts": {
    "dev:h5": "npx vite",
    "dev:mp-weixin": "npx vite --mode mp-weixin",
    "build": "npx vite build",
    "build:h5": "cross-env NODE_ENV=production UNI_PLATFORM=h5 npx vite build",
    "build:mp-weixin": "npx vite build --mode mp-weixin",
    "build:app": "npx vite build --mode app"
  }
}
EOF

echo "✅ UniApp构建脚本已准备"

# 5. 创建UniApp专用构建脚本
cat > build-uniapp.sh << 'EOF'
#!/bin/bash

# UniApp多端构建脚本
echo "🚀 开始UniApp多端构建..."

# H5构建 (Vercel部署)
echo "📱 构建H5版本..."
npm run build:h5

if [ -d "dist" ]; then
    echo "✅ H5构建成功"
    
    # 创建多端构建目录
    mkdir -p builds/h5
    cp -r dist/* builds/h5/
    echo "📁 H5版本已复制到 builds/h5/"
fi

# 微信小程序构建
echo "📱 构建微信小程序版本..."
npm run build:mp-weixin

if [ -d "dist/build/mp-weixin" ]; then
    echo "✅ 微信小程序构建成功"
    
    mkdir -p builds/mp-weixin
    cp -r dist/build/mp-weixin/* builds/mp-weixin/
    echo "📁 微信小程序版本已复制到 builds/mp-weixin/"
    echo "📋 请将 builds/mp-weixin/ 目录上传到微信开发者工具"
fi

echo "🎉 UniApp多端构建完成！"
echo "📊 构建结果："
ls -la builds/

EOF

chmod +x build-uniapp.sh
echo "✅ UniApp多端构建脚本已创建"

# 6. 更新Vercel配置
echo "📝 准备UniApp Vercel配置..."
cat > vercel-uniapp.json << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "frontend/dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/admin",
      "dest": "/index.html"
    },
    {
      "src": "/admin/(.*)",
      "dest": "/index.html"
    },
    {
      "src": "/sales", 
      "dest": "/index.html"
    },
    {
      "src": "/sales/(.*)",
      "dest": "/index.html"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "buildCommand": "cd frontend && chmod +x build-uniapp.sh && ./build-uniapp.sh",
  "devCommand": "cd frontend && npm run dev:h5",
  "installCommand": "cd frontend && npm ci --legacy-peer-deps",
  "framework": null
}
EOF

echo "✅ UniApp Vercel配置已准备"

echo ""
echo "🎯 UniApp恢复完成！后续步骤："
echo "1. 测试UniApp构建: ./build-uniapp.sh"
echo "2. 验证H5版本正常工作"
echo "3. 替换vercel.json为vercel-uniapp.json"
echo "4. 提交并推送到Git"
echo "5. 配置微信小程序发布流程"