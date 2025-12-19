# Printing Marketplace – Software Development Work Plan

This document translates the **Printing Marketplace PRD** into an executable software development plan.
It is written to support a workflow where **Cursor performs most of the coding**, with a human acting as
architect, reviewer, and prompt designer.

---

## Assumptions & Constraints

- Team: 1 senior engineer + Cursor
- Cursor is used for:
  - Backend scaffolding
  - CRUD APIs
  - Business logic
  - Schema & migrations
- Human responsibilities:
  - Architecture decisions
  - Prompt framing and iteration
  - Code review and corrections
- MVP focus: correctness, clarity, speed — not premature optimization

---

## Proposed Tech Stack (Opinionated, MVP-Friendly)

### Backend
- Language: **Python**
- Framework: **FastAPI**
- ORM: **SQLAlchemy**
- Migrations: **Alembic**
- Database: **PostgreSQL**
- Auth: **Auth0** or **Clerk** (Railway-friendly alternatives to Cognito)
- Infrastructure: **Railway** (simplified deployment)

### Frontend (Lightweight MVP)
- **Single Next.js app** with role-based routing ✅ Created
- Role-based UI for CUSTOMER and PRINTER
- Explicit paths: `/customer/*` and `/printer/*` (not route groups)
- Shared components and authentication
- Docker setup for local development
- Architecture: Single app with route protection based on user role

---

## Railway Architecture Recommendation

### Why Railway for MVP?
**Yes — Railway is ideal for MVP speed and simplicity.**

Your platform characteristics:
- CRUD-heavy
- Event-driven (jobs, bids, notifications)
- No long-running processes
- No real-time streaming

### Recommended Railway Setup

| Component | Railway Service |
|--------|-----------|
| API Layer | Backend service (FastAPI) |
| Compute | Railway containers (auto-scaling) |
| Database | Railway PostgreSQL |
| Auth | Auth0 or Clerk (external service) |
| Notifications | SendGrid or Resend (email) |
| Frontend | Frontend service (Next.js) |
| Observability | Railway logs + optional Sentry |

**Benefits:**
- Fast deployment (minutes vs days)
- Built-in PostgreSQL
- Automatic HTTPS
- Simple monorepo support
- Easy local development

**When to migrate later:**
- Need advanced AWS features
- Scale beyond Railway limits
- Complex infrastructure requirements

For Phase 1: **Railway-first is the correct choice.**

---

## Timeline Overview

| Phase | Duration |
|---|---|
| Architecture & Infra | 2–3 days |
| Core Marketplace (Jobs & Bids) | 4–5 days |
| Payments Commitment Model | 1–2 days |
| Notifications & States | 2 days |
| Polishing & Hardening | 2 days |
| **Total MVP** | **~10–14 working days** |

---

# EPIC 0 – Foundations & Architecture

## Goal
Create a clean, extensible foundation that Cursor can safely build upon.

---

### Task 0.1 – Repository & Project Scaffolding
**Estimate:** 0.5 day

**Deliverables**
- Backend repo (Python/FastAPI) ✅ Already created
- Frontend repo structure (Next.js) ✅ Already created
- Linting & formatting
- Folder structure

**Backend Structure:** ✅ Already created
- `app/domain` - Domain models
- `app/services` - Business logic
- `app/api` - API routes
- `app/persistence` - Database layer
- `alembic/` - Migrations

**Frontend Structure:** ✅ Already created
- Single Next.js app with role-based routing
- `app/customer/` - Customer routes (`/customer/dashboard`, `/customer/jobs`)
- `app/printer/` - Printer routes (`/printer/dashboard`, `/printer/jobs`, `/printer/bids`)
- `app/(auth)/` - Shared auth pages (`/auth/login`, `/auth/signup`) - route group
- Shared components and layouts
- API client utilities (`lib/api.ts`)
- Docker configuration for local development

**Note:** Both backend and frontend scaffolding are complete. Ready for EPIC 0 (domain modeling).

### Task 0.2 – Domain Modeling & Schema
**Estimate:** 0.5–1 day

**Core Entities**
- User ✅ (basic structure created in `app/domain/models.py`)
- CustomerProfile
- PrinterProfile
- PrintingJob
- Bid
- PaymentTerms
- Rating (feature-flagged)

**Cursor Prompt**
```text
Based on this PRD, define the core domain entities and relationships.
Include enums, constraints, and lifecycle states.
Output:
1. SQLAlchemy models (Python)
2. Alembic migration
3. Domain entities with relationships
```

---

# EPIC 1 – Authentication & User Management

## Goal
Secure role-based access for customers and printers.

### Task 1.1 – Authentication (Auth0 or Clerk)
**Estimate:** 0.5–1 day

**Features**
- Signup
- Login
- JWT verification
- Role assignment

**Cursor Prompt**
```text
Integrate Auth0 (or Clerk) authentication.
Implement JWT verification middleware for FastAPI.
Support two roles: CUSTOMER and PRINTER.
Protect routes accordingly.
Use python-jose for JWT verification.
```

### Task 1.2 – Profile Management
**Estimate:** 0.5 day

**Features**
- Create / update profiles
- Role-based validation

**Cursor Prompt**
```text
Implement profile CRUD endpoints.
Customers and printers have different required fields.
Enforce role-based access control and validation.
```

---

# EPIC 2 – Printing Job Lifecycle (Customer)

## Goal
Allow customers to create, publish, and manage printing jobs.

### Task 2.1 – Job Creation & Validation
**Estimate:** 1 day

**Features**
- Draft jobs
- Validation rules
- Publish action

**Cursor Prompt**
```text
Implement printing job creation.
Jobs start as DRAFT and move to OPEN when published.
Validate quantity, dates, and bidding duration.
```

### Task 2.2 – Job Visibility & Matching
**Estimate:** 1 day

**Rules**
- Capability match
- Product type match
- Quantity range match
- Geography match

**Cursor Prompt**
```text
Implement job matching logic.
Only show jobs to printers whose capabilities, product types,
quantity ranges, and geography match the job.
Use rule-based filtering only.
```

---

# EPIC 3 – Bidding System (Printer)

## Goal
Enable structured bidding and comparison.

### Task 3.1 – Submit Bid
**Estimate:** 1 day

**Rules**
- One bid per printer per job
- Immutable after submission

**Cursor Prompt**
```text
Implement bid submission.
Each printer can submit only one bid per job.
Bids include price, turnaround time, notes, and payment terms.
```

### Task 3.2 – Bid Tracking
**Estimate:** 0.5 day

**Features**
- Open bids
- Accepted bids
- Lost bids

**Cursor Prompt**
```text
Implement bid status tracking for printers.
Expose endpoints for open, accepted, and lost bids.
```

---

# EPIC 4 – Bid Selection & Commitment Model

## Goal
Record explicit payment commitment without processing payments.

### Task 4.1 – Bid Acceptance Flow
**Estimate:** 0.5–1 day

**Rules**
- Customer must confirm payment terms
- Confirmation is blocking

**Cursor Prompt**
```text
Implement bid acceptance.
Require explicit customer confirmation of payment terms.
Block acceptance without confirmation.
Record timestamp and terms.
```

### Task 4.2 – Agreement Record
**Estimate:** 0.5 day

**Features**
- Immutable record
- Visible to both parties

**Cursor Prompt**
```text
Persist an immutable agreement record when a bid is accepted.
Include bid details, payment terms, and confirmation timestamp.
Expose read-only access to both parties.
```

---

# EPIC 5 – Job States & Notifications

## Goal
Make lifecycle transitions visible and auditable.

### Task 5.1 – Job State Machine
**Estimate:** 0.5 day

**States**
- DRAFT
- OPEN
- CLOSED
- IN_PROGRESS
- COMPLETED

**Cursor Prompt**
```text
Implement a job state machine.
Enforce valid transitions and prevent illegal state changes.
```

### Task 5.2 – Notifications
**Estimate:** 1 day

**Triggers**
- Job posted
- Bid accepted
- Bid rejected

**Cursor Prompt**
```text
Integrate email notifications using SendGrid or Resend.
Send notifications on job posting and bid state changes.
Make delivery channel configurable.
Use background tasks (FastAPI BackgroundTasks or Celery for async).
```

---

# EPIC 6 – Ratings & Feedback (Optional MVP)

## Goal
Introduce basic reputation signals.

### Task 6.1 – Ratings
**Estimate:** 0.5 day

**Cursor Prompt**
```text
Implement post-completion ratings.
Customers can rate printers (1–5) and leave feedback.
Expose aggregated ratings on printer profiles.
```

---

# EPIC 7 – Infrastructure & Deployment (Railway)

## Goal
Production-ready MVP infrastructure with minimal complexity.

### Task 7.1 – Railway Setup
**Estimate:** 0.5 day ✅ (Mostly complete - see railway_setup_guide.md)

**Resources**
- Backend service (Python/FastAPI) ✅ Configured
- PostgreSQL database
- Frontend service (Next.js - when added)
- Environment variables

**Setup Steps:**
1. Create Railway project
2. Add PostgreSQL database
3. Deploy backend service (root: `backend`)
4. Configure environment variables
5. Run database migrations
6. (Optional) Deploy frontend service (root: `frontend`)

**Note:** Railway configuration files are already created. See `railway_setup_guide.md`.

### Task 7.2 – CI/CD
**Estimate:** 0.5 day

**Cursor Prompt**
```text
Set up GitHub Actions for Railway deployment.
Auto-deploy backend on push to main branch.
Run database migrations automatically.
Include environment separation (dev/prod) if needed.
```

---

# EPIC 8 – Hardening & Readiness

## Goal
Ensure MVP is safe to use.

### Task 8.1 – Access Control & Validation
**Estimate:** 0.5 day

**Cursor Prompt**
```text
Audit all endpoints for authorization, validation, and error handling.
Ensure no cross-role data leakage.
```

### Task 8.2 – Logging & Observability
**Estimate:** 0.5 day

**Cursor Prompt**
```text
Add structured logging and basic metrics.
Ensure all state changes are logged.
```

---

## Final Notes

This plan intentionally avoids premature complexity.

**Railway-first** is the correct architectural call for Phase 1.

**Single frontend app** with role-based routing keeps MVP simple and fast.

Cursor is strongest when:
- Prompts are narrow
- Domain rules are explicit
- You iterate in small steps

### Architecture Decisions Made:
- ✅ **Backend:** Python/FastAPI (simpler than TypeScript for MVP)
- ✅ **Infrastructure:** Railway (faster than AWS Lambda setup)
- ✅ **Frontend:** Single Next.js app with role-based routing
- ✅ **Database:** PostgreSQL via Railway
- ✅ **Auth:** Auth0/Clerk (Railway-friendly, easier than Cognito)

If you want, next I can:
- Turn this into separate MD files per epic
- Add Cursor "guardrail prompts" to prevent hallucinated logic
- Create a Phase 2 work plan that introduces payments and messaging
- Scaffold the frontend Next.js app structure
