#!/bin/bash

# Script to clean old project data
# تنظيف جميع البيانات القديمة من المشروع

echo "🧹 Starting project cleanup..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Clean node_modules (will reinstall fresh)
echo -e "${YELLOW}📦 Cleaning node_modules...${NC}"
rm -rf node_modules
rm -f package-lock.json

# 2. Clean logs directory
echo -e "${YELLOW}📝 Cleaning logs...${NC}"
rm -rf logs
mkdir -p logs
touch logs/.gitkeep

# 3. Clean uploads directory
echo -e "${YELLOW}🖼️  Cleaning uploads...${NC}"
rm -rf uploads
mkdir -p uploads
touch uploads/.gitkeep

# 4. Clean public images
echo -e "${YELLOW}🖼️  Cleaning public images...${NC}"
rm -rf public/images/*
touch public/images/.gitkeep

# 5. Clean coverage reports
echo -e "${YELLOW}📊 Cleaning coverage reports...${NC}"
rm -rf coverage
rm -rf .nyc_output

# 6. Clean PM2 files
echo -e "${YELLOW}🔧 Cleaning PM2 files...${NC}"
rm -f ~/.pm2/logs/*.log 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 save --force 2>/dev/null || true

# 7. Clean Docker containers and images (optional)
echo -e "${YELLOW}🐳 Cleaning Docker (optional)...${NC}"
if command -v docker &> /dev/null; then
    docker-compose down -v 2>/dev/null || true
    docker system prune -af --volumes 2>/dev/null || true
fi

# 8. Clean temporary files
echo -e "${YELLOW}🗑️  Cleaning temporary files...${NC}"
find . -name "*.log" -type f -delete 2>/dev/null || true
find . -name ".DS_Store" -type f -delete 2>/dev/null || true
find . -name "Thumbs.db" -type f -delete 2>/dev/null || true

# 9. Clean git cache (optional - preserves history)
echo -e "${YELLOW}📚 Cleaning git cache...${NC}"
git rm -r --cached . 2>/dev/null || true
git add . 2>/dev/null || true

echo -e "${GREEN}✅ Cleanup completed!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. npm install"
echo "2. Copy .env.example to .env and configure"
echo "3. npm run dev"
