#!/bin/bash

echo "🚀 Starting all PS8 services..."
echo ""

# Kill existing processes on these ports
echo "🧹 Cleaning up existing processes..."
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:8001 | xargs kill -9 2>/dev/null
lsof -ti:8002 | xargs kill -9 2>/dev/null

sleep 1

# Start services in background
echo "📁 Starting File Service (8001)..."
node services/files/index.js > logs/files.log 2>&1 &
FILE_PID=$!

sleep 1

echo "🎮 Starting Game Service (8002)..."
node services/game/index.js > logs/game.log 2>&1 &
GAME_PID=$!

sleep 1

echo "🚪 Starting Gateway (8000)..."
node services/gateway/index.js > logs/gateway.log 2>&1 &
GATEWAY_PID=$!

sleep 2

echo ""
echo "✅ All services started!"
echo ""
echo "📊 Process IDs:"
echo "   File Service: $FILE_PID"
echo "   Game Service: $GAME_PID"
echo "   Gateway: $GATEWAY_PID"
echo ""
echo "🌐 URLs:"
echo "   Gateway: http://localhost:8000"
echo "   File Service: http://localhost:8001"
echo "   Game Service: http://localhost:8002"
echo ""
echo "🧪 Test Client: http://localhost:8000/test-client.html"
echo ""
echo "📝 Logs:"
echo "   tail -f logs/gateway.log"
echo "   tail -f logs/files.log"
echo "   tail -f logs/game.log"
echo ""
echo "🛑 To stop all services: ./stop-all.sh"