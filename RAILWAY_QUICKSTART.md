# Railway Quick Start Guide

This is the **fastest way** to deploy Triggered App to production.

## Prerequisites
- GitHub account
- Railway account (free tier available)
- Domain name (triggeredapp.com - you already have this!)

## Step 1: Push to GitHub

```bash
cd "E:\5 AI\Triggered App"

git init
git add .
git commit -m "Ready for deployment"
git branch -M main

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/triggered-app.git
git push -u origin main
```

## Step 2: Deploy to Railway

1. Go to https://railway.app and sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `triggered-app` repository

Railway will automatically detect your project!

## Step 3: Add PostgreSQL Database

1. In your Railway project, click "+ New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will auto-generate the DATABASE_URL
4. Click on the PostgreSQL service → Settings
5. Copy the "Postgres Connection URL"

## Step 4: Add Redis

1. Click "+ New" → "Service"
2. Search for "Redis" and add it
3. Copy the Redis connection URL

## Step 5: Configure Backend Service

1. In your backend service, go to "Variables"
2. Add these environment variables:

```
DATABASE_URL=<paste from PostgreSQL>
REDIS_URL=<paste from Redis>
JWT_SECRET=<generate-a-random-secret-use-openssl-rand-hex-32>
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-app.up.railway.app
```

### Generate a secure JWT secret:
```bash
openssl rand -hex 32
```

## Step 6: Deploy Frontend

1. Click "+ New" → "GitHub Repo"
2. Select the same repository
3. In service settings:
   - **Root Directory**: `/frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: Leave empty (we'll use Nixpacks)
   - Add environment variable:
     ```
     VITE_API_URL=<your-backend-railway-url>
     ```

## Step 7: Run Database Migrations

Once backend is deployed:

1. Go to your backend service
2. Click on the latest deployment
3. Open the logs dropdown
4. Click "Open Shell"
5. Run:
   ```bash
   npm run prisma:migrate
   ```

Or use Railway CLI:
```bash
railway login
railway link
railway run --service backend npm run prisma:migrate
```

## Step 8: Add Custom Domain

### For Frontend:
1. Go to frontend service → Settings → Domains
2. Click "Add Custom Domain"
3. Enter: `triggeredapp.com` and `www.triggeredapp.com`
4. Railway will show DNS records to add

5. In your domain registrar (where you bought triggeredapp.com):
   - Add a CNAME record: `triggeredapp.com` → `<railway-url>`
   - Add a CNAME record: `www.triggeredapp.com` → `<railway-url>`

### For Backend (API):
1. Go to backend service → Settings → Domains
2. Click "Add Custom Domain"
3. Enter: `api.triggeredapp.com`
4. Add DNS record: CNAME `api` → `<backend-railway-url>`

## Step 9: Update Environment Variables

After adding domains, update:

**Backend variables:**
```
FRONTEND_URL=https://triggeredapp.com
```

**Frontend variables:**
```
VITE_API_URL=https://api.triggeredapp.com
```

Redeploy both services!

## Step 10: Test Your Deployment

1. Visit https://triggeredapp.com
2. Create an account
3. Create a test trigger
4. Check if webhook executes

## You're Live! 🎉

Your Triggered App is now accessible at:
- **Main site**: https://triggeredapp.com
- **API**: https://api.triggeredapp.com

## Monitoring & Maintenance

### View Logs
- Go to any service → Deployments → Click on deployment → Logs

### View Database
- Go to PostgreSQL service → Data
- Use Railway's built-in PostgreSQL browser

### Scale Resources
- Go to service settings → Change plan
- Upgrade if you need more resources

### Auto-Deployments
Railway automatically deploys when you push to `main` branch!

## Troubleshooting

**Database connection error?**
- Check DATABASE_URL is set correctly
- Ensure PostgreSQL service is running

**Migrations failing?**
```bash
railway run --service backend npm run prisma:migrate
```

**Triggers not executing?**
- Check Redis service is running
- Check backend logs for errors
- Verify BullMQ worker is running

## Next Steps

1. Set up database backups (Railway Pro feature)
2. Configure monitoring alerts
3. Add rate limiting if needed
4. Set up error tracking (Sentry, etc.)
5. Create admin dashboard for monitoring

---

**Cost**: Railway free tier gives you $5/month credit - perfect for starting!

Need help? Check Railway docs: https://docs.railway.app

