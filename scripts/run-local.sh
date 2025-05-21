#!/bin/bash
echo "🚀 Starting Community Insights App..."
export $(cat .env | xargs)
node src/server.js