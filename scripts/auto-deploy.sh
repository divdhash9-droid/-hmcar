#!/bin/bash
# [[ARABIC_HEADER]] هذا الملف (scripts/auto-deploy.sh) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

# Auto Deployment Script for Car Auction
# يمكن استخدامه مع webhook أو cron job

set -e

echo "🚀 Starting Auto Deployment..."

# Configuration
PROJECT_PATH="/var/www/car-auction"
BRANCH="main"
PM2_APP_NAME="car-auction"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Navigate to project directory
cd $PROJECT_PATH

echo -e "${YELLOW}📦 Pulling latest changes from $BRANCH...${NC}"
git fetch origin
git reset --hard origin/$BRANCH

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci --production

echo -e "${YELLOW}🗄️  Optimizing database...${NC}"
npm run optimize:db || echo "Database optimization skipped"

echo -e "${YELLOW}🔄 Restarting application...${NC}"
pm2 restart $PM2_APP_NAME || pm2 start ecosystem.config.js --env production

# Wait for app to start
sleep 5

# Health check
echo -e "${YELLOW}🏥 Running health check...${NC}"
if curl -f http://localhost:4001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Deployment successful! Application is healthy.${NC}"
    
    # Save PM2 process list
    pm2 save
    
    # Send success notification
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST $SLACK_WEBHOOK \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"✅ Car Auction deployed successfully on $(date)\"}"
    fi
else
    echo -e "${RED}❌ Health check failed! Rolling back...${NC}"
    
    # Rollback
    git reset --hard HEAD~1
    npm ci --production
    pm2 restart $PM2_APP_NAME
    
    # Send failure notification
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST $SLACK_WEBHOOK \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"❌ Car Auction deployment failed and rolled back on $(date)\"}"
    fi
    
    exit 1
fi

# Cleanup old logs (keep last 7 days)
find ./logs -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true

# Cleanup Docker images (if using Docker)
if command -v docker &> /dev/null; then
    docker image prune -af --filter "until=24h" 2>/dev/null || true
fi

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
