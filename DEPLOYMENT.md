# Deployment Guide for Triggered App

## Recommended Hosting Options

### Option 1: Railway (Recommended)
- **Pros**: Easy Docker support, built-in PostgreSQL & Redis, GitHub integration, generous free tier
- **Cons**: Can be more expensive as you scale
- **Best for**: Quick deployment with minimal configuration

### Option 2: Render
- **Pros**: Free tier available, good Docker support, managed PostgreSQL & Redis
- **Cons**: Free tier spins down after inactivity
- **Best for**: Budget-conscious deployments

### Option 3: Self-Hosted VPS (DigitalOcean, Hetzner, Linode)
- **Pros**: Full control, very affordable (~$5-10/month)
- **Cons**: Requires more manual setup and maintenance
- **Best for**: Maximum control and lowest cost

## Deployment Instructions

### Option A: Deploy to Railway (Easiest)

Railway is the recommended option for quick deployment.

#### Step 1: Prepare for Railway

1. **Push your code to GitHub** (if not already there)
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Create Railway account**
   - Go to https://railway.app
   - Sign up with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

#### Step 2: Configure Services in Railway

You need to create 3 services in Railway:

**1. PostgreSQL Database**
- Click "+ New" → "Database" → "Add PostgreSQL"
- Copy the connection string (DATABASE_URL)

**2. Redis**
- Click "+ New" → "Redis"
- Copy the connection string (REDIS_URL)

**3. Backend Service**
- Click "+ New" → "GitHub Repo" → Select your repo
- Railway will auto-detect it's a Node.js project
- In the service settings, configure environment variables:

```
DATABASE_URL=<from PostgreSQL service>
REDIS_URL=<from Redis service>
JWT_SECRET=<generate-a-random-secret>
FRONTEND_URL=<your-domain-or-frontend-url>
NODE_ENV=production
PORT=3000
```

**4. Frontend Service**
- Click "+ New" → "GitHub Repo" → Select your repo
- Change root directory to `/frontend`
- Set build command: `npm install && npm run build`
- Set start command: `npm run preview`
- Environment variables:
```
VITE_API_URL=https://your-backend-railway-url.up.railway.app
```

#### Step 3: Configure Domain

1. In Railway, go to your backend service
2. Click "Settings" → "Add Custom Domain"
3. Add `api.triggeredapp.com` (or your domain)
4. Update DNS records as instructed by Railway

5. For frontend:
   - Add custom domain: `triggeredapp.com` and `www.triggeredapp.com`
   - Update DNS records

6. Update environment variables:
   - Backend FRONTEND_URL: `https://triggeredapp.com`
   - Frontend VITE_API_URL: `https://api.triggeredapp.com`

#### Step 4: Run Database Migrations

After deployment, run migrations:

```bash
# Option A: Via Railway CLI
railway run --service backend npm run prisma:migrate

# Option B: Via Railway dashboard
# Go to backend service → Deployments → Click deployment → Run command
```

---

### Option B: Deploy to Render

#### Step 1: Prepare Repository
Same as Railway - push code to GitHub

#### Step 2: Create Services on Render

**1. PostgreSQL Database**
- Go to https://render.com
- Click "New +" → "PostgreSQL"
- Name it `triggered-db`
- Copy the Internal Database URL

**2. Redis Instance**
- Click "New +" → "Redis"
- Name it `triggered-redis`
- Copy the Internal Redis URL

**3. Backend Web Service**
- Click "New +" → "Web Service"
- Connect your GitHub repo
- Settings:
  - Name: `triggered-backend`
  - Root Directory: `backend`
  - Build Command: `npm install && npm run prisma:generate && npm run build`
  - Start Command: `npm start`
  - Environment Variables:
    ```
    DATABASE_URL=<from PostgreSQL>
    REDIS_URL=<from Redis>
    JWT_SECRET=<your-secret>
    NODE_ENV=production
    PORT=10000
    FRONTEND_URL=https://your-app.onrender.com
    ```

**4. Frontend Static Site**
- Click "New +" → "Static Site"
- Connect your GitHub repo
- Settings:
  - Root Directory: `frontend`
  - Build Command: `npm install && npm run build`
  - Publish Directory: `dist`
  - Environment Variables:
    ```
    VITE_API_URL=<your-backend-url>
    ```

#### Step 3: Configure Custom Domain
- Go to your service settings
- Add custom domain
- Update DNS as instructed

---

### Option C: Self-Hosted VPS (DigitalOcean/Hetzner)

This gives you full control at the lowest cost.

#### Step 1: Create Droplet/Server
1. Create a new VPS (Ubuntu 22.04, 2GB RAM minimum)
2. SSH into your server

#### Step 2: Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

#### Step 3: Clone and Deploy
```bash
git clone <your-repo-url>
cd triggered-app

# Create .env file
cp backend/env.example backend/.env
# Edit backend/.env with production values

# Build and start
docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate deploy
```

#### Step 4: Configure Domain
1. Point triggeredapp.com to your server IP
2. Install Nginx:
```bash
sudo apt-get install nginx
sudo certbot --nginx -d triggeredapp.com -d www.triggeredapp.com
```

3. Configure Nginx:
```nginx
server {
    listen 80;
    server_name triggeredapp.com www.triggeredapp.com;
    
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Post-Deployment Checklist

- [ ] Update database with: `npm run prisma:migrate`
- [ ] Test user registration
- [ ] Test trigger creation
- [ ] Test webhook execution
- [ ] Configure SSL certificates (HTTPS)
- [ ] Set up monitoring (Uptime monitoring, error tracking)
- [ ] Configure backups for database
- [ ] Set up log aggregation
- [ ] Test MCP endpoints
- [ ] Document API endpoints for users

---

## Environment Variables Reference

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://host:6379
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://triggeredapp.com
```

### Frontend (.env)
```env
VITE_API_URL=https://api.triggeredapp.com
```

---

## Cost Estimates

### Railway
- Free tier: 500 hours/month, $5 credit
- After: ~$20-40/month for production use

### Render
- Free tier available (spins down after inactivity)
- Paid: ~$7/month per service + database

### Self-Hosted VPS
- DigitalOcean: $6-12/month for basic droplet
- Hetzner: ~$4-8/month for VPS
- Full control, no limits

---

## Recommended: Railway

For your use case, **Railway is recommended** because:
1. Easiest setup with GitHub integration
2. Automatic HTTPS
3. Built-in PostgreSQL and Redis
4. Free tier to start
5. Simple to scale later

Follow **Option A** above for Railway deployment.

