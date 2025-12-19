# Railway Setup Guide - Printing Marketplace (Python/FastAPI)

This guide walks you through setting up your printing marketplace project on Railway using Python and FastAPI.

**All backend files and configurations have been created.** This guide explains how to deploy them.

---

## Prerequisites

- GitHub account (for repository)
- Railway account (sign up at [railway.app](https://railway.app))
- Python 3.11+ installed locally (for local development)
- Git installed

---

## Project Structure

The backend is already set up with:
- ✅ FastAPI application (`app/main.py`)
- ✅ Database configuration (`app/persistence/database.py`)
- ✅ Domain models (`app/domain/models.py`)
- ✅ Alembic migrations setup
- ✅ Railway configuration files
- ✅ All required dependencies (`requirements.txt`)

See `backend/README.md` for local development setup.

---

## Step 1: Set Up Railway Account & Project

### 1.1 Sign Up / Log In

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (recommended for easy repo integration)
3. Complete onboarding

### 1.2 Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"** (if you've pushed to GitHub)
   - OR select **"Empty Project"** and connect repo later

---

## Step 3: Set Up Frontend (Optional for MVP)

### 3.1 Initialize Frontend Project

```bash
cd ../frontend
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

Or manually:

```bash
npm init -y
npm install next@latest react@latest react-dom@latest
npm install typescript @types/react @types/node @types/react-dom --save-dev
npm install tailwindcss postcss autoprefixer --save-dev
```

### 3.2 Create Frontend Package.json Scripts

Update `frontend/package.json`:

```json
{
  "name": "frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

---

## Step 4: Set Up Railway Account & Project

### 4.1 Sign Up / Log In

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (recommended for easy repo integration)
3. Complete onboarding

### 4.2 Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"** (if you've pushed to GitHub)
   - OR select **"Empty Project"** and connect repo later

---

## Step 2: Set Up PostgreSQL Database

### 2.1 Add PostgreSQL Service

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically create:
   - PostgreSQL instance
   - Connection URL (stored as `DATABASE_URL`)
   - Database credentials

**Note:** The database configuration is already set up in `app/persistence/database.py` and will automatically handle the `DATABASE_URL` from Railway.

---

## Step 3: Create Backend Service on Railway

### 3.1 Add Backend Service

1. In Railway project, click **"+ New"**
2. Select **"GitHub Repo"** (or **"Empty Service"** if not connected)
3. Select your repository
4. Railway will auto-detect it's a Python project (via `requirements.txt`)

### 3.2 Configure Backend Service

1. Click on the backend service
2. Go to **"Settings"** tab
3. Set **Root Directory** to: `backend`
4. Railway will auto-detect:
   - Build command: `pip install -r requirements.txt`
   - Start command: from `Procfile` or `railway.toml`

### 3.3 Connect Database to Backend

1. In backend service, go to **"Variables"** tab
2. Click **"+ New Variable"**
3. Click **"Reference"** next to PostgreSQL service
4. Select `DATABASE_URL`
5. Railway will automatically inject it

### 3.4 Add Environment Variables

Add these variables in backend service **"Variables"**:

```
FRONTEND_URL=https://your-frontend-service.up.railway.app
```

**Note:** `PORT` is automatically set by Railway. You'll get the frontend URL after deploying frontend (if using).

---

## Step 5: Configure Custom Domains (Optional)

### 5.1 Backend Domain

1. Go to backend service → **"Settings"** → **"Networking"**
2. Click **"Generate Domain"** or add custom domain
3. Update `FRONTEND_URL` in backend variables if needed

---

## Step 6: Local Development

See `backend/README.md` for detailed local development setup.

Quick start:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Create .env.local with DATABASE_URL
uvicorn app.main:app --reload --port 3000
```

---

## Troubleshooting

### Issue: Build Fails

**Solution:**
- Check Railway build logs
- Ensure `requirements.txt` is correct
- Verify Python version in `runtime.txt` matches Railway's supported versions

### Issue: Database Connection Fails

**Solution:**
- Verify `DATABASE_URL` is referenced correctly from PostgreSQL service
- Check PostgreSQL service is running
- Ensure `DATABASE_URL` uses `postgresql://` (not `postgres://`) - this is handled automatically in `database.py`

### Issue: Migrations Don't Run

**Solution:**
- Run migrations manually via Railway CLI: `railway run alembic upgrade head`
- Or via Railway dashboard one-off command
- Check that `alembic/env.py` is configured correctly

---

## Quick Reference: Railway Commands

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# View logs
railway logs

# Run command in Railway environment
railway run <command>

# Open service in browser
railway open

# View variables
railway variables
```

---

## Next Steps

After Railway setup is complete:

1. ✅ **EPIC 0** - Set up domain models and SQLAlchemy models (add to `app/domain/models.py`)
2. ✅ **EPIC 1** - Implement authentication (consider Auth0 or Clerk instead of Cognito for Railway)
3. ✅ **EPIC 2-8** - Build core features as outlined in project plan

## Files Created

All backend files are ready:
- ✅ `backend/app/main.py` - FastAPI application
- ✅ `backend/app/persistence/database.py` - Database configuration
- ✅ `backend/app/domain/models.py` - Domain models (User model included)
- ✅ `backend/alembic/` - Migration setup
- ✅ `backend/requirements.txt` - Dependencies
- ✅ `backend/Procfile` - Railway start command
- ✅ `backend/railway.toml` - Railway configuration
- ✅ `backend/runtime.txt` - Python version

---

## Cost Estimate

**Railway Pricing (as of 2024):**
- **Starter Plan:** $5/month + $0.000463/GB-hour
- **PostgreSQL:** $5/month (1GB included)
- **Estimated MVP Cost:** $10-20/month

**Free Trial:** Railway offers $5 free credit to start.

---

## Alternative: Auth Service for Railway

Since you're using Railway instead of AWS, consider these alternatives to Cognito:

1. **Clerk** - Excellent Railway integration, great DX
2. **Auth0** - Industry standard, free tier available
3. **Supabase Auth** - Open source, good Railway integration
4. **NextAuth.js** - If using Next.js frontend

We can update the project plan to use one of these instead of Cognito.

---

## Summary Checklist

- [x] Backend files created (FastAPI + SQLAlchemy)
- [x] Railway configuration files ready
- [ ] Created Railway account and project
- [ ] Added PostgreSQL database service
- [ ] Created backend service (root: `backend`)
- [ ] Configured environment variables
- [ ] Pushed code to GitHub
- [ ] Railway auto-deployed backend
- [ ] Ran database migrations (`alembic upgrade head`)
- [ ] Tested health check endpoint (`/health`)
- [ ] Set up local development environment

---

**Ready to deploy!** 🚀

All files are created. Follow Steps 1-4 above to deploy to Railway, then proceed with EPIC 0 (domain modeling).

