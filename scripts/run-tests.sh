#!/bin/bash

echo "🧪 Running Equipment Rental Marketplace Tests"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}📦 Installing dependencies...${NC}"
  npm install
fi

# Generate Prisma Client
echo -e "${YELLOW}🔧 Generating Prisma Client...${NC}"
npm run prisma:generate

echo ""
echo -e "${YELLOW}🧪 Running Unit Tests...${NC}"
npm test

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Unit tests passed!${NC}"
else
  echo -e "${RED}❌ Unit tests failed!${NC}"
  exit 1
fi

echo ""
echo -e "${YELLOW}🧪 Running E2E Tests...${NC}"
npm run test:e2e

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ E2E tests passed!${NC}"
else
  echo -e "${RED}❌ E2E tests failed!${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}🎉 All tests passed successfully!${NC}"
echo ""
echo "📊 To see coverage report, run: npm run test:cov"
