#!/bin/bash

echo "🔄 Parando servidor..."
pkill -f "nest start" 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
sleep 2

echo "🚀 Iniciando servidor..."
npm run start:dev
