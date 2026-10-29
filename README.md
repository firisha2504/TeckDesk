# TechDesk: Smart IT Support and Incident Management System

> **Better Support • Faster Resolution • Happier Teams**  
> Enterprise MERN Stack IT Support & Incident Management Platform with real-time Socket.IO collaboration, automated SLA deadline monitoring, skill & workload-based technician auto-routing, and multi-tenant Role-Based Access Control.

---

## 🌟 Key Features

- **4 Role-Specific Dashboards**:
  - **Employee**: Track personal tickets, view SLA progress, submit new issues with attachments.
  - **Technician**: Active assigned incident queue ranked by SLA deadline, workload metrics, and internal diagnostic notes.
  - **Manager**: Department-wide incident volume, priority breakdown donut chart, team performance tracking table, and SLA compliance.
  - **Administrator**: User account roles, multi-tenant organization settings, category routing, and immutable security audit logs.
- **Automated SLA Engine & Escalation**:
  - Deterministic response and resolution deadlines computed dynamically based on priority (Critical: 15m response / 2h resolution; High: 1h response / 8h resolution).
  - Background worker scanning every 60 seconds with automated escalation for overdue critical incidents.
- **Intelligent Auto-Assignment**:
  - Analyzes category skills, team specialties, and current active technician workload to auto-route incoming tickets.
- **Real-Time Collaboration (Socket.IO)**:
  - Live ticket updates, comment streams, status changes, and in-app push notification alerts with room-scoped security.
- **Enterprise Aesthetics**:
  - Dark navy (`#0B132B`, `#0F172A`) and crisp light themes with responsive mobile navigation dock, glowing cyan/blue primary accents, and Recharts interactive graphs.
- **Robust Security**:
  - HTTP-only cookie JWT auth, bcrypt password hashing (10 rounds), Zod payload validation, Helmet security headers, rate limiting, and NoSQL injection sanitization.

---

## 🚀 Tech Stack

- **Frontend**: React 18, Vite, React Router 6, Tailwind CSS, Lucide Icons, Recharts.
- **Backend**: Node.js (v24 ES Modules), Express.js.
- **Database**: MongoDB 7.0 & Mongoose 8.x.
- **Real-Time**: Socket.IO 4.x.
- **Background Jobs**: BullMQ 5.x & Redis with persistent fallback scheduler.
- **Testing**: Vitest & Supertest.
- **DevOps**: Docker, Docker Compose, Nginx.

---

## 🔑 Default Credentials (Seeded Demo Accounts)

All accounts are pre-configured with the default password: `Password123!`

| Role | Name | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | Firomsa Abdi | `admin@techdesk.com` | `Password123!` | System settings, user roles, audit trail |
| **Manager** | Abebe Kebede | `manager@techdesk.com` | `Password123!` | Team roster, SLA policies, analytics, CSV export |
| **Technician** | Tadesse Gebre | `tadesse@techdesk.com` | `Password123!` | Hardware & Network triage, internal notes |
| **Technician** | Selamawit Abate | `selamawit@techdesk.com` | `Password123!` | Software, Cloud & Security incidents |
| **Employee** | Hana Bekele | `employee@techdesk.com` | `Password123!` | Create tickets, view own issues, reply |

> *Tip: The Login page includes one-click demo login buttons for each role for instant testing.*

---

## ⚡ Quick Start

### Option A: Local Development

#### 1. Start MongoDB & Seed Demo Data
```bash
# Start local MongoDB daemon
mkdir -p backend/data/db
mongod --dbpath backend/data/db --port 27017 --bind_ip 127.0.0.1 --logpath backend/data/mongod.log --fork

# Seed the database
npm run seed --prefix backend
```

#### 2. Start Backend & Frontend Concurrently
```bash
# Start both backend (port 5000) and frontend (port 5173)
npm run dev
```

- Web Application: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- Healthcheck: `http://localhost:5000/api/health`

---

### Option B: Docker Compose (Production Environment)

Docker Compose provisions the complete stack including MongoDB 7.0, Redis 7.2 (with health checks), the Express.js Backend API, and the Nginx-hosted production Frontend bundle.

```bash
# 1. Copy environment template
cp backend/.env.example backend/.env

# 2. Configure production secrets in backend/.env (JWT_SECRET, SMTP credentials, etc.)

# 3. Launch the container cluster
docker compose up -d --build

# 4. Populate seed data in the backend container
docker compose exec backend node scripts/seed.js
```

---

## ⚙️ Configuration & Environment Variables

Create a `backend/.env` file based on `backend/.env.example`.

### Core Server & Security
| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | HTTP port for Express backend |
| `NODE_ENV` | `development` | Environment mode (`development`, `production`, `test`) |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS origin and password reset base URL |
| `MONGODB_URI` | `mongodb://localhost:27017/techdesk` | MongoDB connection URI (Required) |
| `JWT_SECRET` | *(Random 32+ char string)* | Cryptographic key for signing JWTs (Strictly validated in production) |
| `JWT_EXPIRES_IN` | `7d` | Token expiration period |
| `UPLOAD_DIR` | `uploads` | Local directory for storing ticket attachments |

### Redis & SLA Job Queues (BullMQ)
| Variable | Default | Description |
| :--- | :--- | :--- |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL for BullMQ persistent queues |
| `ENABLE_DEV_JOB_SCHEDULER` | `true` | Enables in-process timer fallback **ONLY** in development if Redis is unreachable. **Strictly disabled in production** to prevent silent job loss. |

> **Production Redis Guard**: When `NODE_ENV=production`, TechDesk strictly requires a healthy Redis connection. If Redis cannot be reached, the server rejects startup and will not fall back to an in-memory timer, ensuring SLA jobs and retries are never lost across restarts.

### SMTP Email Delivery (Password Reset)
| Variable | Default | Description |
| :--- | :--- | :--- |
| `SMTP_HOST` | *(empty)* | SMTP server hostname (e.g. `smtp.sendgrid.net`, `email-smtp.us-east-1.amazonaws.com`, `sandbox.smtp.mailtrap.io`) |
| `SMTP_PORT` | `587` | SMTP port (`587` for STARTTLS, `465` for SSL/TLS) |
| `SMTP_SECURE` | `false` | Set to `true` if connecting over port 465 |
| `SMTP_USER` | *(empty)* | SMTP username / API key |
| `SMTP_PASS` | *(empty)* | SMTP password / API secret |
| `SMTP_FROM` | `TechDesk Support <no-reply@techdesk.com>` | Sender address on outbound emails |

> **Password Reset Security & Safe Delivery Notice**:
> - Password reset tokens are never returned in API responses and are never written to audit logs or console output.
> - Only SHA-256 token hashes are stored in the database with a 1-hour expiration window.
> - Single-use enforcement guarantees tokens cannot be replayed after a password is updated.
> - All password reset requests return an identical generic response to defend against user enumeration attacks.
> - If `SMTP_HOST` is not configured, the system logs a safe warning and suppresses outbound delivery without exposing the token.
> - *Delivery verification note*: Actual delivery to external inboxes requires valid SMTP server credentials.

---

## 🧪 Automated Testing & Verification

TechDesk includes comprehensive automated unit, integration, and security test suites using Vitest and Supertest.

```bash
# Run backend test suite (Auth, Permissions, Tickets, SLA, Password Reset Security, Queue Production Guards)
npm test --prefix backend

# Run E2E system health & service verification
npm run test:e2e

# Run frontend production build
npm run build --prefix frontend
```

### Verified Test Results

#### 1. Backend Test Suite (`npm test --prefix backend`)
```
 ✓ tests/queue.test.js (4 tests)
   ✓ Redis & SLA Background Job Queue Tests > should strictly reject and fail startup in production if Redis is unreachable (preventing silent job loss)
   ✓ Redis & SLA Background Job Queue Tests > should NOT run in-memory fallback in development if ENABLE_DEV_JOB_SCHEDULER is false
   ✓ Redis & SLA Background Job Queue Tests > should run in-memory fallback in development ONLY when ENABLE_DEV_JOB_SCHEDULER is explicitly true
   ✓ Redis & SLA Background Job Queue Tests > should shut down gracefully and stop all intervals and connections
 ✓ tests/sla.test.js (2 tests)
 ✓ tests/permissions.test.js (3 tests)
 ✓ tests/tickets.test.js (4 tests)
 ✓ tests/passwordReset.test.js (7 tests)
   ✓ Password Reset Security & SMTP Tests > should return identical generic response whether user exists or not, and NEVER expose resetToken in response
   ✓ Password Reset Security & SMTP Tests > should store ONLY hashed reset token in database and have future expiration
   ✓ Password Reset Security & SMTP Tests > should NEVER write reset token or token-bearing URL to audit logs
   ✓ Password Reset Security & SMTP Tests > should reject unauthorized / tampered password reset tokens
   ✓ Password Reset Security & SMTP Tests > should reject password reset when token has expired
   ✓ Password Reset Security & SMTP Tests > should successfully reset password with valid token, and enforce single-use (reject reuse)
   ✓ Password Reset Security & SMTP Tests > should fail safely without crashing or exposing tokens if SMTP is unconfigured
 ✓ tests/auth.test.js (5 tests)

Test Files:  6 passed (6)
Tests:       25 passed (25)
Duration:    4.54s
```

#### 2. End-to-End Workflow Verification (`npm run test:e2e`)
```
 ✓ tests/e2e/workflow.test.js (2 tests)
   ✓ TechDesk E2E System Health & Workflow Verification > should verify backend service is reachable on port 5000
   ✓ TechDesk E2E System Health & Workflow Verification > should verify frontend service is serving on port 5173

Test Files:  1 passed (1)
Tests:       2 passed (2)
Duration:    0.92s
```

#### 3. Frontend Production Build (`npm run build --prefix frontend`)
```
✓ 2,303 modules transformed.
dist/index.html                   1.12 kB │ gzip:   0.62 kB
dist/assets/index-CHhHUilQ.css   43.48 kB │ gzip:   7.73 kB
dist/assets/index-Bt8SIaJ3.js   804.14 kB │ gzip: 219.48 kB
✓ built in 10.34s with zero compilation errors.
```

---

## 📚 Technical Documentation

- [System Architecture](file:///home/firo2504/Desktop/TechDesk/docs/architecture.md)
- [REST API Reference](file:///home/firo2504/Desktop/TechDesk/docs/api.md)
- [Database Schema & Data Dictionary](file:///home/firo2504/Desktop/TechDesk/docs/database.md)
- [Role Permissions & RBAC Matrix](file:///home/firo2504/Desktop/TechDesk/docs/permissions.md)
- [Production Deployment Guide](file:///home/firo2504/Desktop/TechDesk/docs/deployment.md)
- [Implementation Progress Tracker](file:///home/firo2504/Desktop/TechDesk/docs/PROGRESS.md)

