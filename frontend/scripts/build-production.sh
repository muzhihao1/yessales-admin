#!/bin/bash

# YesSales Admin - 生产环境构建脚本
# ====================================
# 
# 功能说明：
# - 自动化生产环境构建流程
# - 环境变量验证和配置检查
# - 资源优化和压缩
# - 构建产物验证和质量检查
# - 部署准备和文件组织
#
# 使用方法：
# chmod +x scripts/build-production.sh
# ./scripts/build-production.sh [preset]
#
# @author Terminal 3 (Admin Frontend Team)

set -e  # 遇到错误立即退出

# 配置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# 配置预设
PRESET=${1:-"standard"}
BUILD_ENV=${2:-"production"}
SKIP_TESTS=${SKIP_TESTS:-false}
SKIP_LINT=${SKIP_LINT:-false}

log_info "开始生产环境构建流程"
log_info "项目目录: $PROJECT_DIR"
log_info "配置预设: $PRESET"
log_info "构建环境: $BUILD_ENV"

# 切换到项目目录
cd "$PROJECT_DIR"

# 1. 环境检查
log_info "==== 步骤 1: 环境检查 ===="

# 检查 Node.js 版本
NODE_VERSION=$(node --version)
REQUIRED_NODE_VERSION="16"
CURRENT_NODE_VERSION=$(echo $NODE_VERSION | sed 's/v//' | cut -d'.' -f1)

if [ $CURRENT_NODE_VERSION -lt $REQUIRED_NODE_VERSION ]; then
    log_error "Node.js 版本过低，需要 v$REQUIRED_NODE_VERSION 或更高版本，当前版本: $NODE_VERSION"
    exit 1
fi

log_success "Node.js 版本检查通过: $NODE_VERSION"

# 检查 npm/pnpm
if command -v pnpm &> /dev/null; then
    PKG_MANAGER="pnpm"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
else
    log_error "未找到包管理器 (npm 或 pnpm)"
    exit 1
fi

log_success "包管理器: $PKG_MANAGER"

# 2. 环境变量验证
log_info "==== 步骤 2: 环境变量验证 ===="

ENV_FILE=".env.production"
if [ ! -f "$ENV_FILE" ]; then
    log_error "生产环境配置文件不存在: $ENV_FILE"
    exit 1
fi

log_success "环境配置文件存在: $ENV_FILE"

# 检查必需的环境变量
REQUIRED_VARS=(
    "VITE_APP_NAME"
    "VITE_APP_VERSION"
    "VITE_API_BASE_URL"
    "VITE_CDN_URL"
)

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^$var=" "$ENV_FILE"; then
        log_error "缺少必需的环境变量: $var"
        exit 1
    fi
done

log_success "环境变量验证通过"

# 3. 依赖安装
log_info "==== 步骤 3: 依赖安装 ===="

if [ ! -d "node_modules" ]; then
    log_info "安装项目依赖..."
    $PKG_MANAGER install --frozen-lockfile
else
    log_info "检查依赖更新..."
    $PKG_MANAGER install --prefer-offline --frozen-lockfile
fi

log_success "依赖安装完成"

# 4. 代码质量检查
if [ "$SKIP_LINT" != "true" ]; then
    log_info "==== 步骤 4: 代码质量检查 ===="
    
    # TypeScript 类型检查
    log_info "执行 TypeScript 类型检查..."
    if command -v tsc &> /dev/null; then
        tsc --noEmit
        log_success "TypeScript 类型检查通过"
    else
        log_warning "跳过 TypeScript 类型检查（未安装 tsc）"
    fi
    
    # ESLint 检查
    if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ]; then
        log_info "执行 ESLint 检查..."
        $PKG_MANAGER run lint || {
            log_error "ESLint 检查失败"
            exit 1
        }
        log_success "ESLint 检查通过"
    else
        log_warning "跳过 ESLint 检查（未配置）"
    fi
else
    log_warning "跳过代码质量检查"
fi

# 5. 单元测试
if [ "$SKIP_TESTS" != "true" ]; then
    log_info "==== 步骤 5: 单元测试 ===="
    
    if grep -q '"test"' package.json; then
        log_info "执行单元测试..."
        $PKG_MANAGER run test || {
            log_error "单元测试失败"
            exit 1
        }
        log_success "单元测试通过"
    else
        log_warning "跳过单元测试（未配置测试脚本）"
    fi
else
    log_warning "跳过单元测试"
fi

# 6. 清理旧构建产物
log_info "==== 步骤 6: 清理构建目录 ===="

DIST_DIR="dist"
if [ -d "$DIST_DIR" ]; then
    log_info "清理旧的构建产物..."
    rm -rf "$DIST_DIR"
fi

log_success "构建目录清理完成"

# 7. 生产构建
log_info "==== 步骤 7: 生产构建 ===="

# 设置构建环境变量
export NODE_ENV=production
export VITE_CONFIG_PRESET=$PRESET
export VITE_BUILD_NUMBER=$(date +%s)

log_info "开始构建..."
BUILD_START=$(date +%s)

# 执行构建
$PKG_MANAGER run build || {
    log_error "构建失败"
    exit 1
}

BUILD_END=$(date +%s)
BUILD_TIME=$((BUILD_END - BUILD_START))

log_success "构建完成，耗时: ${BUILD_TIME}秒"

# 8. 构建产物验证
log_info "==== 步骤 8: 构建产物验证 ===="

if [ ! -d "$DIST_DIR" ]; then
    log_error "构建产物目录不存在: $DIST_DIR"
    exit 1
fi

# 检查关键文件
CRITICAL_FILES=(
    "index.html"
    "assets"
    "static"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -e "$DIST_DIR/$file" ]; then
        log_warning "可能缺少关键文件: $file"
    fi
done

# 计算构建产物大小
DIST_SIZE=$(du -sh "$DIST_DIR" | cut -f1)
log_success "构建产物大小: $DIST_SIZE"

# 9. 资源优化检查
log_info "==== 步骤 9: 资源优化检查 ===="

# 检查 gzip 压缩
if command -v gzip &> /dev/null; then
    TOTAL_SIZE=0
    COMPRESSED_SIZE=0
    
    for file in $(find "$DIST_DIR" -name "*.js" -o -name "*.css"); do
        if [ -f "$file" ]; then
            SIZE=$(wc -c < "$file")
            TOTAL_SIZE=$((TOTAL_SIZE + SIZE))
            
            GZIP_SIZE=$(gzip -c "$file" | wc -c)
            COMPRESSED_SIZE=$((COMPRESSED_SIZE + GZIP_SIZE))
        fi
    done
    
    if [ $TOTAL_SIZE -gt 0 ]; then
        COMPRESSION_RATIO=$(echo "scale=2; $COMPRESSED_SIZE * 100 / $TOTAL_SIZE" | bc -l 2>/dev/null || echo "N/A")
        log_success "Gzip 压缩率: ${COMPRESSION_RATIO}%"
    fi
fi

# 检查是否启用了代码分割
CHUNK_COUNT=$(find "$DIST_DIR/assets" -name "*.js" | wc -l)
if [ $CHUNK_COUNT -gt 1 ]; then
    log_success "代码分割已启用，生成 $CHUNK_COUNT 个 JS 文件"
else
    log_warning "未检测到代码分割"
fi

# 10. 生成构建报告
log_info "==== 步骤 10: 生成构建报告 ===="

BUILD_REPORT="build-report.json"
cat > "$BUILD_REPORT" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "version": "$(grep VITE_APP_VERSION .env.production | cut -d'=' -f2 | tr -d '"')",
  "buildNumber": "$VITE_BUILD_NUMBER",
  "preset": "$PRESET",
  "buildTime": $BUILD_TIME,
  "distSize": "$DIST_SIZE",
  "nodeVersion": "$NODE_VERSION",
  "packageManager": "$PKG_MANAGER",
  "environment": "$BUILD_ENV",
  "chunkCount": $CHUNK_COUNT,
  "compressionRatio": "$COMPRESSION_RATIO"
}
EOF

log_success "构建报告已生成: $BUILD_REPORT"

# 11. 部署准备
log_info "==== 步骤 11: 部署准备 ===="

# 创建部署包
DEPLOY_DIR="deploy"
DEPLOY_PACKAGE="yessales-admin-${VITE_BUILD_NUMBER}.tar.gz"

mkdir -p "$DEPLOY_DIR"

# 复制构建产物
cp -r "$DIST_DIR"/* "$DEPLOY_DIR/"

# 复制配置文件
cp "$ENV_FILE" "$DEPLOY_DIR/.env"
cp "$BUILD_REPORT" "$DEPLOY_DIR/"

# 生成部署脚本
cat > "$DEPLOY_DIR/deploy.sh" << 'EOF'
#!/bin/bash
# 自动部署脚本
# 在服务器上执行此脚本完成部署

set -e

NGINX_ROOT=${NGINX_ROOT:-"/var/www/html"}
BACKUP_DIR="/tmp/yessales-admin-backup-$(date +%s)"

echo "开始部署 YesSales Admin..."

# 备份旧版本
if [ -d "$NGINX_ROOT" ]; then
    echo "备份当前版本到: $BACKUP_DIR"
    mv "$NGINX_ROOT" "$BACKUP_DIR"
fi

# 创建新目录
mkdir -p "$NGINX_ROOT"

# 复制新文件
echo "复制新版本文件..."
cp -r ./* "$NGINX_ROOT/"

# 设置权限
chmod -R 755 "$NGINX_ROOT"

# 重启服务
if command -v systemctl &> /dev/null; then
    echo "重启 Nginx 服务..."
    sudo systemctl reload nginx
fi

echo "部署完成！"
echo "备份位置: $BACKUP_DIR"
EOF

chmod +x "$DEPLOY_DIR/deploy.sh"

# 创建压缩包
tar -czf "$DEPLOY_PACKAGE" -C "$DEPLOY_DIR" .

log_success "部署包已创建: $DEPLOY_PACKAGE"

# 12. 完成总结
log_info "==== 构建完成总结 ===="

cat << EOF

🎉 生产环境构建成功完成！

📋 构建信息:
   - 配置预设: $PRESET
   - 构建时间: ${BUILD_TIME}秒
   - 产物大小: $DIST_SIZE
   - JS 文件数: $CHUNK_COUNT
   - 压缩比例: ${COMPRESSION_RATIO}%

📦 产物位置:
   - 构建目录: $DIST_DIR/
   - 部署目录: $DEPLOY_DIR/
   - 部署包: $DEPLOY_PACKAGE
   - 构建报告: $BUILD_REPORT

🚀 部署指令:
   1. 将部署包上传到服务器
   2. 解压: tar -xzf $DEPLOY_PACKAGE
   3. 执行: ./deploy.sh

⚠️  部署前检查事项:
   - 确认环境变量配置正确
   - 确认 API 服务地址可访问
   - 确认 CDN 资源配置正确
   - 建议先在测试环境验证

EOF

log_success "构建流程全部完成！"

exit 0