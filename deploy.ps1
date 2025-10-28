# PowerShell deployment script for Triggered App (Windows)

Write-Host "🚀 Starting Triggered App deployment..." -ForegroundColor Green

# Check if Docker is installed
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check for .env file
if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠️  backend\.env not found. Creating from example..." -ForegroundColor Yellow
    Copy-Item backend\env.example backend\.env
    Write-Host "✅ Created backend\.env - Please edit it with your configuration" -ForegroundColor Green
    Write-Host "   Don't forget to set a strong JWT_SECRET!" -ForegroundColor Yellow
    exit 1
}

# Read .env file
$envContent = Get-Content backend\.env

# Check if JWT_SECRET is still the default
if ($envContent -match 'your-secret-key-change-in-production') {
    Write-Host "⚠️  WARNING: JWT_SECRET is still the default value!" -ForegroundColor Red
    Write-Host "   Please edit backend\.env and set a secure JWT_SECRET before deploying." -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne 'y') {
        exit 0
    }
}

# Build and start services
Write-Host "📦 Building Docker images..." -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml build

Write-Host "🚀 Starting services..." -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Run database migrations
Write-Host "🗄️  Running database migrations..." -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml exec -T backend npm run prisma:migrate

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Your application is running on:" -ForegroundColor Cyan
Write-Host "  - Frontend: http://localhost"
Write-Host "  - Backend API: http://localhost:3000"
Write-Host ""
Write-Host "To view logs:" -ForegroundColor Yellow
Write-Host "  docker-compose -f docker-compose.prod.yml logs -f"
Write-Host ""
Write-Host "To stop services:" -ForegroundColor Yellow
Write-Host "  docker-compose -f docker-compose.prod.yml down"

