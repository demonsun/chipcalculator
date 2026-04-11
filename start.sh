#!/bin/bash

# 计算器小工具 - 快速启动脚本

echo "🚀 计算器小工具 - Vite 优化版"
echo "================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装"
    exit 1
fi

echo "✅ Node.js: $(node -v)"
echo "✅ npm: $(npm -v)"
echo ""

# 检查是否需要安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖中..."
    npm install
    echo ""
fi

# 菜单
echo "选择操作:"
echo "1) 启动开发服务器 (npm run dev)"
echo "2) 生产构建 (npm run build)"
echo "3) 预览生产版本 (npm run preview)"
echo "4) 查看项目信息"
echo ""

read -p "请输入选项 (1-4): " choice

case $choice in
    1)
        echo "🔧 启动开发服务器..."
        npm run dev
        ;;
    2)
        echo "🏗️  生产构建中..."
        npm run build
        echo "✅ 构建完成！输出在 dist/ 文件夹"
        ;;
    3)
        echo "👀 预览生产版本..."
        npm run preview
        ;;
    4)
        echo "📊 项目信息"
        echo "---"
        echo "主应用: src/App.jsx ($(wc -l < src/App.jsx) 行)"
        echo "入口: src/main.jsx ($(wc -l < src/main.jsx) 行)"
        echo "HTML: index.html ($(wc -l < index.html) 行)"
        echo ""
        echo "构建产物:"
        if [ -d "dist/assets" ]; then
            ls -lh dist/assets/
        else
            echo "尚未构建，请先运行 'npm run build'"
        fi
        ;;
    *)
        echo "❌ 无效选项"
        exit 1
        ;;
esac
