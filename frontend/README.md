# Printing Marketplace Frontend

Next.js frontend application for the printing marketplace platform.

## Architecture

Single Next.js app with **role-based routing**:
- `app/(auth)/` - Shared authentication pages (route groups for organization)
- `app/customer/` - Customer routes (`/customer/dashboard`, `/customer/jobs`)
- `app/printer/` - Printer routes (`/printer/dashboard`, `/printer/jobs`, `/printer/bids`)
- `app/` - Public pages

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Railway Deployment

The frontend is configured for Railway deployment:
- Root directory: `frontend`
- Build command: `npm install && npm run build`
- Start command: `npm start`

Set environment variable:
- `NEXT_PUBLIC_API_URL` - Backend API URL (e.g., `https://your-backend.up.railway.app`)

## Routes

### Public
- `/` - Homepage
- `/auth/login` - Login page
- `/auth/signup` - Signup page

### Customer Routes
- `/customer/dashboard` - Customer dashboard
- `/customer/jobs` - My jobs
- `/customer/jobs/new` - Create new job (to be implemented)
- `/customer/bids` - View bids on my jobs (to be implemented)

### Printer Routes
- `/printer/dashboard` - Printer dashboard
- `/printer/jobs` - Available jobs
- `/printer/bids` - My bids

## Next Steps

- EPIC 1: Implement authentication and role-based route protection
- EPIC 2: Connect to backend API for job management
- EPIC 3: Implement bidding interface

