#!/bin/bash
# SyncSpace - Start all services
set -e

echo "=== SyncSpace Startup ==="

# 1. Ensure MongoDB is running
echo "[1/4] Checking MongoDB..."
if ! docker ps --filter name=syncspace-mongo --format '{{.Names}}' | grep -q syncspace-mongo; then
  echo "  Starting MongoDB container..."
  docker start syncspace-mongo 2>/dev/null || docker compose up -d mongo
  sleep 3
fi
echo "  MongoDB is running."

# 2. Wait for MongoDB to be healthy
echo "[2/4] Waiting for MongoDB..."
for i in $(seq 1 15); do
  if docker exec syncspace-mongo mongosh --eval "db.adminCommand('ping')" --quiet 2>/dev/null; then
    echo "  MongoDB is ready."
    break
  fi
  sleep 2
done

# 3. Seed database (idempotent)
echo "[3/4] Seeding database..."
npx tsx server/src/scripts/seed.ts 2>&1 | grep -E "(Demo|Seeding|Error)"

# 4. Start server and client
echo "[4/4] Starting server and client..."
npm run dev
