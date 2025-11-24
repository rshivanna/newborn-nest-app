#!/bin/bash

#############################################################################
# Quick Deploy Script - Simple version for rapid deployments
#
# Use this for quick updates when you know the configuration is correct
# and just need to rebuild and restart.
#
# Usage: ./quick-deploy.sh
#############################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=================================================="
echo "Quick Deploy - Newborn Nest"
echo -e "==================================================${NC}"
echo ""

# Check directory
if [[ ! -f "package.json" ]]; then
    echo "Error: Must run from project root"
    exit 1
fi

echo "1. Pulling latest changes..."
git pull origin main

echo "2. Installing dependencies..."
npm install --quiet
cd backend && npm install --quiet && cd ..

echo "3. Building frontend..."
NODE_ENV=production npm run build

echo "4. Verifying build..."
if grep -r "localhost:5000" dist/ > /dev/null 2>&1; then
    echo "⚠ Warning: Found localhost references in build"
else
    echo "✓ Build verified"
fi

echo "5. Restarting services..."
pm2 restart newborn-nest-api
sudo systemctl reload nginx

echo "6. Testing backend..."
sleep 2
curl -s http://localhost:5000/api/health

echo ""
echo -e "${GREEN}✓ Deployment complete!${NC}"
echo ""
echo "Test at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo ""
