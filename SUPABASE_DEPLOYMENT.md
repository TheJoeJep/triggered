# Deploying with Supabase

## Architecture with Supabase

Instead of self-hosting PostgreSQL, you can use Supabase (managed PostgreSQL) with your Railway deployment.

### Option 1: Supabase Database + Railway Backend (Recommended)

**Setup:**
- **Supabase**: Database (PostgreSQL), Auth (optional), Storage
- **Railway**: Backend API + Redis (for BullMQ)
- **Railway**: Frontend (or Netlify/Vercel)

**Why this works:**
- Supabase is actually just PostgreSQL under the hood
- Your existing Prisma setup works 100% the same
- Just change the DATABASE_URL connection string
- Railway backend connects to Supabase database
- BullMQ still runs on Railway (needs Redis)

### Option 2: Full Supabase + Railway

Use Supabase for:
- Database (PostgreSQL) ✅
- Authentication (optional - can still use your own)
- Storage (if you need file uploads)

Keep on Railway:
- Backend API (Express server)
- BullMQ + Redis (for trigger execution)

## Migration Guide

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Choose organization (or create one)
4. Project details:
   - **Name**: triggered-app
   - **Database Password**: (generate and save this!)
   - **Region**: Choose closest to you
5. Wait for project to be created (~2 minutes)

### Step 2: Get Connection String

1. In Supabase dashboard, go to **Settings** → **Database**
2. Find **Connection string** section
3. Copy the **URI** connection string
4. It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[project-ref].supabase.co:5432/postgres`

### Step 3: Update Railway Backend Configuration

In Railway, update your backend service environment variables:

```env
# Replace with Supabase connection string
DATABASE_URL="postgresql://postgres.YOUR-PROJECT:PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

# Keep existing Railway Redis
REDIS_URL=<your-railway-redis-url>

JWT_SECRET=<your-secret>
NODE_ENV=production
FRONTEND_URL=https://triggeredapp.com
```

### Step 4: Run Migrations

Connect to Supabase database:

```bash
# Via Railway CLI
railway run --service backend npx prisma migrate deploy

# Or via Supabase Dashboard:
# Go to SQL Editor → Paste your migration SQL
```

Or use Supabase migration:
```bash
# Set Supabase as remote database
npx supabase link --project-ref YOUR-PROJECT-REF

# Run migrations
npx supabase db push
```

## Benefits of Supabase

### 1. **Managed PostgreSQL**
- Automatic backups
- Point-in-time recovery
- Built-in connection pooling
- No database server management

### 2. **Built-in Features**
- Authentication (can replace your Passport.js setup)
- Real-time subscriptions (Postgres subscriptions)
- Storage buckets for file uploads
- Row Level Security (RLS) policies

### 3. **Pricing**
- **Free tier**: 500MB database, 50MB storage, 50K MAU
- **Pro tier**: $25/month - More storage, larger databases

### 4. **Developer Experience**
- Nice dashboard for viewing data
- SQL Editor built-in
- Automatic API generation (if you want)
- Great documentation

## Architecture Comparison

### Current (Railway Everything)
```
┌─────────────────┐
│   Railway       │
│  - Backend API  │
│  - PostgreSQL   │
│  - Redis        │
│  - Frontend     │
└─────────────────┘
```

### With Supabase
```
┌─────────────────┐      ┌──────────────┐
│   Railway       │─────▶│  Supabase    │
│  - Backend API  │      │  - PostgreSQL│
│  - Redis        │      │  - Auth (opt)│
│  - Frontend     │      │  - Storage   │
└─────────────────┘      └──────────────┘
```

## Code Changes Needed

### Minimal Changes Required

**backend/prisma/schema.prisma** - Already compatible!
- No changes needed - Supabase is just PostgreSQL

**backend/src/config/database.ts** - Already compatible!
- No changes needed - uses DATABASE_URL

**The only thing you change is the DATABASE_URL environment variable!**

### Optional: Use Supabase Auth

If you want to use Supabase's built-in auth (instead of Passport.js):

1. Replace authentication routes with Supabase client
2. Use Supabase Row Level Security
3. Remove bcrypt, Passport.js dependencies

```typescript
// Example with Supabase Auth
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

// Auth becomes much simpler
app.post('/api/auth/login', async (req, res) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: req.body.email,
    password: req.body.password,
  })
  // ...
})
```

But you can keep your current auth system too! The database works either way.

## Connecting Prisma to Supabase

### Method 1: Direct Connection (Recommended)

Use Supabase's connection pooling URL:

```env
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
```

The `pooler.supabase.com` URL uses PgBouncer for connection pooling.

### Method 2: Direct Connection (No Pooler)

```env
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
```

Use this for migrations and one-off queries.

## Deployment Steps

### Railway + Supabase Setup

1. **Deploy Backend to Railway** (without database)
   - Add PostgreSQL service → Delete it (we don't need it)
   - Add Redis service (for BullMQ)
   - Add backend service

2. **Configure Supabase database**
   - Create Supabase project
   - Run migrations

3. **Update Railway environment variables**
   ```
   DATABASE_URL=<supabase-connection-string>
   ```

4. **Deploy frontend to Railway** (or Netlify/Vercel)

## Pros & Cons

### Pros ✅
- No database management
- Built-in backups
- Better scalability
- Additional features (auth, storage, realtime)
- Nice dashboard for data viewing
- Connection pooling built-in
- Free tier is generous
- Easy migrations

### Cons ⚠️
- Vendor lock-in (but it's Postgres, you can export)
- Additional service to manage
- Need two services (Railway + Supabase)
- Slightly more complex than all-in-one

## Recommendation

**For your Triggered App: YES, Supabase is a great choice!**

**Why:**
1. Your triggers need reliable database storage
2. Supabase gives you managed Postgres with backups
3. Easier to scale than managing PostgreSQL yourself
4. Free tier is perfect for starting out
5. You can always migrate away (it's just Postgres)

**Simplest path:**
```
Supabase (Database) + Railway (Backend + Redis + Frontend)
```

This is actually a very common and recommended setup!

## Implementation

The existing code works 100% as-is. Just:

1. Change the `DATABASE_URL` environment variable
2. Run migrations
3. Done!

No code changes needed - Supabase is compatible PostgreSQL.

