# Complete Railway + Supabase Setup for Triggered App

**Complete guide to deploy Triggered App to production with Railway and Supabase**

---

## Overview

This guide will walk you through deploying Triggered App to:
- **Supabase**: PostgreSQL database (with optional Realtime)
- **Railway**: Backend API, Redis, and Frontend
- **Domain**: triggeredapp.com (your domain)

**Time required:** 20-30 minutes  
**Cost:** Free (Railway free tier + Supabase free tier)

---

## Prerequisites

- [ ] GitHub account
- [ ] Railway account (sign up at railway.app)
- [ ] Supabase account (sign up at supabase.com)
- [ ] Domain: triggeredapp.com (already owned)

---

## Step 1: Prepare Your Code

### Push Code to GitHub

```bash
# Navigate to your project
cd "E:\5 AI\Triggered App"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for Railway deployment"

# Connect to GitHub
git remote add origin https://github.com/YOUR_USERNAME/triggered-app.git
git branch -M main
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username!**

If the repository already exists, just push:
```bash
git add .
git commit -m "Update for Railway deployment"
git push
```

---

## Step 2: Create Supabase Project

### 2.1 Sign Up / Login
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (easiest)

### 2.2 Create New Project
1. Click "New Project"
2. Fill in details:
   - **Name:** `triggered-app`
   - **Database Password:** (generate a strong password and save it!)
   - **Region:** Choose closest to your users (e.g., `US West`)
   - **Pricing Plan:** Free (more than enough to start)

3. Click "Create new project"
4. Wait 2-3 minutes for project to be created

### 2.3 Get Connection String
1. Go to **Settings** → **Database**
2. Under **Connection string**, find **URI**
3. It looks like: `postgresql://postgres.YOUR-PROJECT:PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres`
4. **Copy this entire string** - you'll need it for Railway!

### 2.4 Get API Keys (for Realtime later)
1. Go to **Settings** → **API**
2. Copy these:
   - **URL:** `https://YOUR-PROJECT.supabase.co`
   - **anon/public key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

Save these for Step 6!

---

## Step 3: Deploy to Railway

### 3.1 Create Railway Account
1. Go to https://railway.app
2. Click "Login" → "Login with GitHub"
3. Authorize Railway to access your GitHub

### 3.2 Create Project
1. In Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Find and select your `triggered-app` repository
4. Click the repository

Railway will start detecting your project.

---

## Step 4: Set Up Services in Railway

You need to create 3 services. Let's do them one by one:

### Service 1: PostgreSQL Database (Use Supabase Instead)

**Skip this!** We're using Supabase instead of Railway's PostgreSQL.

But Railway might create a PostgreSQL service automatically. If it does:
1. Click on the PostgreSQL service
2. Click **Settings** → **Delete Service**

We'll use Supabase instead.

---

### Service 2: Redis (Needed for BullMQ)

1. In your Railway project, click **"+ New"**
2. Click **"Database"**
3. Search for **"Redis"**
4. Click **"Add Redis"**
5. After it's created, click on the Redis service
6. Go to **"Variables"** tab
7. Copy the `REDIS_URL` - you'll need this!

It will look like: `redis://default:password@containers-us-west-xxx.railway.app:12345`

---

### Service 3: Backend API

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your `triggered-app` repository again
3. After Railway detects it, click on the service
4. Go to **"Settings"** tab
5. Change **"Root Directory"** to: `backend`
6. Change **"Build Command"** to: `npm install && npm run prisma:generate && npm run build`
7. **Start Command** stays as: `npm start`

### Configure Backend Environment Variables

Go to **"Variables"** tab in your backend service, and add these:

```env
# Database - Use your Supabase connection string from Step 2.3
DATABASE_URL=postgresql://postgres.YOUR-PROJECT:PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres

# Redis - Use the Redis URL from Service 2
REDIS_URL=redis://default:password@containers-us-west-xxx.railway.app:12345

# Server
NODE_ENV=production
PORT=10000

# JWT Secret - Generate a secure random string
JWT_SECRET=<generate-a-secure-secret>

# Frontend URL - We'll update this after frontend is deployed
FRONTEND_URL=https://your-app.up.railway.app
```

#### Generate JWT Secret:
Run this in terminal:
```bash
openssl rand -hex 32
```
Or use an online generator: https://randomkeygen.com/

---

### Service 4: Frontend

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your `triggered-app` repository
3. Go to **"Settings"** tab
4. Change **"Root Directory"** to: `frontend`
5. Change **"Build Command"** to: `npm install && npm run build`
6. **Start Command** should be empty

### Configure Frontend Environment Variables

Go to **"Variables"** tab, add:

```env
# API URL - We'll update this after backend is deployed
VITE_API_URL=https://your-backend-service.up.railway.app
```

---

## Step 5: Run Database Migrations

### 5.1 Get Your Services URLs

1. Go to your **backend service**
2. Click **"Settings"** → **"Domains"**
3. Railway automatically assigned you a domain like: `triggered-production.up.railway.app`
4. Copy this URL

5. Go to your **frontend service**
6. Click **"Settings"** → **"Domains"**
7. Copy this URL too

### 5.2 Update Environment Variables

**Backend:**
Update `FRONTEND_URL` to your frontend Railway domain:
```
FRONTEND_URL=https://your-frontend.up.railway.app
```

**Frontend:**
Update `VITE_API_URL` to your backend Railway domain:
```
VITE_API_URL=https://your-backend.up.railway.app
```

These will automatically redeploy!

### 5.3 Run Migrations

Once backend is deployed (green "Deployed" status), run:

**Option A: Using Railway CLI**
```bash
# Install Railway CLI (if not already)
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run npm run prisma:migrate
```

**Option B: Using Railway Dashboard**
1. Go to your backend service
2. Click on the latest deployment
3. Click **"Deploy Logs"** dropdown → **"Open Shell"**
4. Run:
   ```bash
   npx prisma migrate deploy
   ```

Your database tables will be created!

---

## Step 6: Add Supabase Realtime (Optional but Recommended)

### 6.1 Update Frontend Environment Variables

Add these to your frontend service variables:
```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-from-step-2.4
```

### 6.2 Enable Realtime in Supabase

1. Go to Supabase Dashboard
2. Go to **Database** → **Replication**
3. Enable replication for:
   - `trigger_executions`
   - `triggers`
   - `users`

### 6.3 Set Up Row Level Security

Go to **SQL Editor** in Supabase and run:

```sql
-- Enable RLS
ALTER TABLE trigger_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE triggers ENABLE ROW LEVEL SECURITY;

-- Policy for trigger_executions
CREATE POLICY "Users can view their own executions"
  ON trigger_executions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM triggers 
      WHERE triggers.id = trigger_executions."triggerId" 
      AND triggers."userId" = auth.uid()::text
    )
  );

-- Policy for triggers
CREATE POLICY "Users can view their own triggers"
  ON triggers
  FOR SELECT
  USING ("userId" = auth.uid()::text);
```

For now, since you're using your own auth, we'll keep it simpler. If you want full RLS later, you can migrate to Supabase Auth.

---

## Step 7: Configure Custom Domain

### 7.1 Add Domain to Frontend

1. Go to your **frontend service** → **Settings** → **Domains**
2. Click **"Add Custom Domain"**
3. Enter: `triggeredapp.com`
4. Click **"Add Custom Domain"**
5. Railway will show DNS records you need to add

6. Repeat for: `www.triggeredapp.com`

### 7.2 Add Domain to Backend

1. Go to your **backend service** → **Settings** → **Domains**
2. Click **"Add Custom Domain"**
3. Enter: `api.triggeredapp.com`
4. Railway will show DNS records

### 7.3 Update DNS at Your Domain Registrar

Go to where you bought triggeredapp.com (GoDaddy, Namecheap, etc.):

1. Log into your domain registrar
2. Find DNS settings
3. Add these records:

```
Type: CNAME
Name: @
Value: your-frontend.cname.railway.app

Type: CNAME
Name: www
Value: your-frontend.cname.railway.app

Type: CNAME
Name: api
Value: your-backend.cname.railway.app
```

Railway will show you the exact CNAME values to use.

### 7.4 Wait for DNS Propagation

DNS changes take 5-60 minutes to propagate.

Check status:
```bash
# Check if DNS is ready
nslookup triggeredapp.com
nslookup api.triggeredapp.com
```

### 7.5 Update Environment Variables with Real Domains

Once DNS is ready:

**Frontend:**
```env
VITE_API_URL=https://api.triggeredapp.com
```

**Backend:**
```env
FRONTEND_URL=https://triggeredapp.com
```

Railway will automatically redeploy when you update variables!

---

## Step 8: Install Frontend Dependencies (For Realtime)

If you're using Realtime, you need to install Supabase client:

1. Go to **frontend service** → **"Deploy Logs"** → **"Open Shell"**
2. Run:
   ```bash
   npm install @supabase/supabase-js
   ```
3. Trigger a new deployment: Edit and save `frontend/package.json` to trigger rebuild

Or better: Add to `frontend/package.json` and push to GitHub:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0"
  }
}
```

Then push to GitHub, Railway will auto-deploy!

---

## Step 9: Test Your Deployment

### 9.1 Visit Your Site

Go to: https://triggeredapp.com

You should see:
1. Your landing/login page
2. Be able to register an account
3. Create a trigger
4. See it in your dashboard

### 9.2 Test a Trigger

1. Create a test webhook endpoint: https://webhook.site (free)
2. Copy the unique URL
3. Create a trigger in your app with that webhook URL
4. Wait for it to execute
5. Go to webhook.site and see the request arrived!

### 9.3 Check Logs

If something's not working:

**Backend logs:**
1. Go to backend service
2. Click latest deployment
3. View logs

**Frontend logs:**
1. Go to frontend service
2. Click latest deployment
3. View logs

---

## Troubleshooting

### Database Connection Issues

**Error:** "Can't reach database"
- Check `DATABASE_URL` is correct in backend variables
- Use the Supabase connection string from Step 2.3
- Make sure it includes the port: `6543`

**Error:** "Relation does not exist"
- Run migrations: `railway run npm run prisma:migrate`

### Redis Connection Issues

**Error:** "ECONNREFUSED localhost:6379"
- Make sure Redis service is running
- Check `REDIS_URL` is set correctly

### Frontend Can't Reach Backend

**Error:** "Network Error"
- Check `VITE_API_URL` in frontend variables
- Make sure backend domain is correct
- Wait for services to fully deploy (green status)

### Triggers Not Executing

**Check:**
1. Redis service is running
2. Backend logs show BullMQ worker starting
3. Check backend logs for trigger execution errors

```bash
# View backend logs
railway logs
```

### Environment Variables Not Updating

- After changing variables, services auto-redeploy
- Wait 1-2 minutes
- Check deployment status is green

---

## Security Checklist

Before going live:

- [ ] JWT_SECRET is a strong random string (not default)
- [ ] DATABASE_URL uses password from Supabase (not in git)
- [ ] CORS is configured (FRONTEND_URL set correctly)
- [ ] HTTPS is enabled (custom domain)
- [ ] Database backups enabled in Supabase
- [ ] Strong password on Supabase project
- [ ] Consider enabling rate limiting (future enhancement)

---

## Monitoring

### View Logs in Railway

Any service → Deployments → Click deployment → View logs

Or use CLI:
```bash
railway logs
```

### Supabase Dashboard

Monitor your database:
- Supabase Dashboard → Database → Usage
- See database size, query performance
- View real-time statistics

### Health Check

Your backend has a health endpoint:
```
https://api.triggeredapp.com/health
```

Use this for uptime monitoring!

---

## Scaling Up

### When to Upgrade

**Staying Free:**
- < 100 triggers
- < 1,000 executions/month
- Personal use

**Upgrade to Pro ($25/month):**
- > 100 triggers
- > 1,000 executions/month
- Team use
- Need more Supabase features

### Upgrading Supabase

1. Go to Supabase dashboard
2. Settings → Plan
3. Upgrade to Pro ($25/month)

### Upgrading Railway

Railway auto-scales based on usage. You'll pay per usage when you exceed the free tier.

---

## Cost Breakdown

### Free Tier (You're Starting Here)

**Supabase:**
- Database: 500MB
- Bandwidth: 5GB/month
- Real-time: 50K MAU
- **Cost: $0/month**

**Railway:**
- $5 monthly credit
- Covers light usage
- **Cost: $0/month initially**

**Total: FREE** 🎉

### Production Scaling

**Supabase Pro ($25/month):**
- 8GB database
- 50GB bandwidth
- Unlimited real-time

**Railway (~$20-30/month):**
- Based on usage
- Database: ~$5
- Compute: ~$15
- Redis: ~$5

**Total: ~$45-55/month**

This is very reasonable for a production SaaS app!

---

## Next Steps After Deployment

1. ✅ Your app is live at triggeredapp.com
2. 📝 Test all features thoroughly
3. 🔐 Review security settings
4. 📊 Set up monitoring (Sentry, UptimeRobot)
5. 📧 Add Google OAuth (optional)
6. 🚀 Start using it!
7. 📈 Monitor usage in Railway + Supabase dashboards

---

## Useful Commands

### Railway CLI

```bash
# Login
railway login

# Link to project
railway link

# View logs
railway logs

# Run command in service
railway run npm run prisma:studio

# Open database browser
railway run npx prisma studio
```

### Database Management

```bash
# Run migrations
railway run npm run prisma:migrate

# Open Prisma Studio
railway run npx prisma studio

# Access via psql
railway run npx prisma db execute --stdin
```

---

## Support & Resources

- **Railway Docs:** https://docs.railway.app
- **Supabase Docs:** https://supabase.com/docs
- **Project Issues:** GitHub issues
- **Community:** Railway Discord, Supabase Discord

---

## Quick Reference: All Environment Variables

### Backend Service:
```env
DATABASE_URL=<supabase-connection-string>
REDIS_URL=<railway-redis-url>
JWT_SECRET=<generated-secret>
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://triggeredapp.com
```

### Frontend Service:
```env
VITE_API_URL=https://api.triggeredapp.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

---

## Deployment Status Check

After following this guide, you should have:

✅ Code on GitHub  
✅ Supabase project created  
✅ PostgreSQL connection string  
✅ Redis service on Railway  
✅ Backend service on Railway  
✅ Frontend service on Railway  
✅ Database migrated  
✅ Custom domain configured  
✅ App accessible at triggeredapp.com  
✅ API accessible at api.triggeredapp.com  
✅ Can create users  
✅ Can create triggers  
✅ Triggers executing properly  

---

## You're Live! 🎉

Your Triggered App is now deployed to production with:
- **Domain:** triggeredapp.com
- **Backend:** api.triggeredapp.com
- **Database:** Supabase (managed)
- **Real-time:** Supabase Realtime (optional)
- **Hosting:** Railway

Go create your first trigger and start using it!

