# Setup Instructions

## Initial Setup

1. **Clone and navigate to the project**
   ```bash
   cd "E:\5 AI\Triggered App"
   ```

2. **Start Docker services (PostgreSQL and Redis)**
   ```bash
   docker-compose up -d postgres redis
   ```

3. **Set up Backend**

   Navigate to backend directory:
   ```bash
   cd backend
   ```

   Copy the environment file:
   ```bash
   copy env.example .env
   ```

   Edit `.env` and set the database URL to:
   ```
   DATABASE_URL="postgresql://triggered_user:triggered_pass@localhost:5432/triggered_app?schema=public"
   ```

   Install dependencies:
   ```bash
   npm install
   ```

   Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

   Run migrations:
   ```bash
   npm run prisma:migrate
   ```

4. **Set up Frontend**

   Navigate to frontend directory:
   ```bash
   cd ../frontend
   ```

   Install dependencies:
   ```bash
   npm install
   ```

## Development

### Running the application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Creating Your First User

1. Open http://localhost:5173
2. Click "Create a new account"
3. Enter your email and password
4. You'll be logged in and redirected to the dashboard

## Testing the API

1. Go to the "API Keys" page
2. Create a new API key
3. Copy the key (you'll only see it once!)
4. Test with curl:

```bash
curl http://localhost:3000/api/triggers \
  -H "X-API-Key: YOUR_KEY_HERE"
```

## Troubleshooting

### Database connection errors
Make sure PostgreSQL is running:
```bash
docker-compose ps
```

### Redis connection errors
Make sure Redis is running:
```bash
docker-compose ps
```

### Port already in use
If port 3000 or 5173 is already in use, you can change it:
- Backend: Edit `backend/.env` PORT variable
- Frontend: Edit `frontend/vite.config.ts` server.port

### Prisma errors
Run migrations again:
```bash
cd backend
npm run prisma:migrate
```

## Production Build

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`

## Using Docker for Production

Build and run all services:
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database
- Redis cache
- Backend API
- Frontend (nginx server)

