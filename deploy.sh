#!/bin/bash

# Deployment script for Triggered App

set -e

echo "🚀 Starting Triggered App deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check for .env file
if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env not found. Creating from example..."
    cp backend/env.example backend/.env
    echo "✅ Created backend/.env - Please edit it with your configuration"
    echo "   Don't forget to set a strong JWT_SECRET!"
    exit 1
fi

# Read .env file and check if critical variables are set
source backend/.env

if [ "$NODE_ENV" != "production" ]; then
    echo "⚠️  NODE_ENV is not set to 'production'. Continue anyway? (y/n)"
    read -r response
    if [ "$response" != "y" ]; then
        exit 0
    fi
fi

# Build and start services
echo "📦 Building Docker images..."
docker-compose -f docker-compose.prod.yml build

echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 5

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend npm run prisma:migrate || \
    docker-compose -f docker-compose.prod.yml run --rm backend npm run prisma:migrate

echo "✅ Deployment complete!"
echo ""
echo "Your application is running on:"
echo "  - Frontend: http://localhost:${FRONTEND_PORT:-80}"
echo "  - Backend API: http://localhost:${BACKEND_PORT:-3000}"
echo ""
echo "To view logs:"
echo "  docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "To stop services:"
echo "  docker-compose -f docker-compose.prod.yml down"

