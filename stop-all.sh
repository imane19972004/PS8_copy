#!/bin/bash

echo "🛑 Stopping all PS8 services..."

lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:8001 | xargs kill -9 2>/dev/null
lsof -ti:8002 | xargs kill -9 2>/dev/null

echo "✅ All services stopped!"