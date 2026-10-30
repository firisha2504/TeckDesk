# TechDesk: Smart IT Support and Incident Management System

TechDesk is an enterprise-grade, multi-organization IT service management and incident tracking platform built on the modern MERN stack. Designed for educational institutions, healthcare networks, corporations, and government agencies, TechDesk enables multiple independent institutions to operate securely on a single platform with strict logical tenant isolation, automated SLA tracking, real-time WebSocket communication, and dual-tier administration.

---

## Key Highlights

- **Multi-Tenant Architecture**: Shared database with tenant-isolated collections. Users, tickets, teams, comments, and attachments are strictly scoped to their respective organization.
- **Dual-Tier Administration**:
  - **Platform Super Admin**: Oversees platform health, approves/rejects new institution registrations, suspends/reactivates organizations, and inspects cross-platform audit trails.
  - **Organization Admin**: Configures localized business hours, staff roles, departments, teams, and SLA targets.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions across 5 roles: `superadmin`, `admin`, `manager`, `technician`, and `employee`.
- **Intelligent SLA Management**: Real-time response and resolution deadline calculation with background breach scanning via BullMQ/Redis and automated escalations.
- **Real-Time WebSockets**: Socket.IO authenticated channels for instant status updates, comment synchronization, and notification delivery with room-level tenant isolation.
- **Defense-in-Depth Security**: JWT authentication (HttpOnly cookies or Bearer headers), bcrypt password hashing (cost 10), NoSQL injection protection, rate limiting, and attachment MIME/extension whitelisting.

---

## Technology Stack

- **Backend**: Node.js 20+, Express 4, Mongoose 8, Socket.IO 4, BullMQ 5 / ioredis 5, Zod 3, Winston logger
- **Frontend**: React 18, Vite 6, TailwindCSS 3, Lucide React icons, Axios
- **Databases & Queues**: MongoDB 7.0+, Redis 7.2+
- **DevOps**: Docker, Docker Compose, Nginx reverse proxy

---

## System Prerequisites

Before running TechDesk locally or in production, ensure the following are installed:

- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **npm**: `v10.x` or higher
- **MongoDB**: `v7.0+` (local community edition, Docker container, or MongoDB Atlas replica set)
- **Redis**: `v7.2+` (required in production for BullMQ background SLA queues)

---

## Installation & Setup

### 1. Clone Repository & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-org/techdesk.git
cd techdesk

# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

---

### 2. Environment Configuration

#### Backend Configuration (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` and configure appropriate values for your environment:

```bash
cp backend/.env.example backend/.env
```

| Variable | Description | Example / Recommended Value |
|---|---|---|
| `PORT` | API server listen port | `5000` |
| `NODE_ENV` | Environment mode (`development` or `production`) | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/techdesk` |
| `REDIS_URL` | Redis connection URI for BullMQ queues | `redis://localhost:6379` |
| `JWT_SECRET` | Secret key for signing JWT tokens (min 32 characters) | `your_secure_random_jwt_secret_here` |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` |
| `FRONTEND_URL` | Client origin for CORS and redirects | `http://localhost:5173` |
| `UPLOAD_DIR` | Directory on disk for uploaded attachments | `uploads` |
| `ENABLE_DEV_JOB_SCHEDULER` | Fallback interval in dev when Redis is absent | `true` |
| `INITIAL_ADMIN_PASSWORD` | Fallback initial seed password | `your_initial_admin_password_here` |
| `SMTP_HOST` | Outgoing SMTP mail server | `smtp.example.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | `support@example.com` |
| `SMTP_PASS` | SMTP password | `your_smtp_password_here` |
| `SMTP_FROM` | Outgoing sender header | `TechDesk Support <no-reply@techdesk.com>` |

> **Security Note**: Never commit `.env` or production credentials to version control. Always generate cryptographically secure secrets in production (`openssl rand -hex 32`).

#### Frontend Configuration (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env`:

```bash
cp frontend/.env.example frontend/.env
```

```ini
VITE_API_URL=/api
VITE_SOCKET_URL=/
```

---

## Provisioning & Initialization

### 1. Provision Platform Super Admin

Create the primary Platform Super Admin account using the provisioner script:

```bash
cd backend
SUPERADMIN_EMAIL="superadmin@techdesk.com" \
SUPERADMIN_PASSWORD="YourSecurePasswordHere!" \
SUPERADMIN_NAME="Platform Administrator" \
node scripts/provision-superadmin.js
```

### 2. Seed Initial Demonstration Data (Optional)

To seed a default tenant with sample tickets and staff accounts:

```bash
cd backend
node scripts/seed.js
```

---

## Running the Application

### Development Mode

#### Running Services with npm (Local Dev Servers)

```bash
# Terminal 1: Start Backend API (runs nodemon on port 5000)
cd backend && npm run dev

# Terminal 2: Start Frontend App (runs Vite dev server on port 5173)
cd frontend && npm run dev
```

Visit the application at `http://localhost:5173`.

---

### Production Deployment via Docker Compose

TechDesk includes a production-ready `docker-compose.yml` that provisions MongoDB, Redis, Backend (Node.js), and Frontend (Nginx):

```bash
# Build and start all services in detached mode
docker compose up -d --build

# Inspect running containers
docker compose ps

# View backend application logs
docker compose logs -f backend
```

---

## Institution Registration & Approval Workflow

1. **Public Self-Registration**:
   - An institution representative navigates to `http://localhost:5173/register-organization`.
   - Submits organization details (Name, Domain, Industry Type, Contact) and initial Admin credentials.
   - The organization is created in **`pending`** status.
2. **Review & Approval**:
   - Platform Super Admin logs in at `http://localhost:5173/login`.
   - Navigates to **Registration Requests** in the Platform Admin navigation.
   - Reviews registration details and clicks **Approve** (or **Reject** with a reason).
3. **Workspace Activation**:
   - Upon approval, status transitions to **`active`**.
   - The organization administrator can immediately log in, invite staff, configure teams, and manage support tickets.

---

## Testing & Verification

TechDesk includes comprehensive test harnesses covering unit, integration, multi-tenant isolation, and end-to-end security:

```bash
# Run Vitest Unit & Integration Suites (6 suites, 25 tests)
cd backend && npm test

# Run End-to-End Multi-Tenant Security Suite (39 tests)
node backend/scripts/test-step8-e2e.js

# Run Frontend Production Build Check
cd frontend && npm run build
```

---

## Project Documentation Index

Detailed engineering documentation is available across dedicated guides:

- [System Architecture](file:///home/firo2504/Desktop/TechDesk/ARCHITECTURE.md): Multi-tenant isolation, request lifecycle, and WebSocket architecture.
- [REST API Reference](file:///home/firo2504/Desktop/TechDesk/API_DOCUMENTATION.md): Endpoint catalog, authentication, request/response payloads.
- [OpenAPI Specification](file:///home/firo2504/Desktop/TechDesk/openapi.json): Standard OpenAPI 3.0 JSON specification.
- [Database Schema & Models](file:///home/firo2504/Desktop/TechDesk/DATABASE_DOCUMENTATION.md): MongoDB collections, schema schemas, compound indexes, and relations.
- [Security Architecture](file:///home/firo2504/Desktop/TechDesk/SECURITY.md): RBAC, IDOR defense, path traversal prevention, and audit logs.
- [Deployment Runbook](file:///home/firo2504/Desktop/TechDesk/DEPLOYMENT.md): Docker, Nginx SSL, cloud staging, and scaling.
- [Backup and Recovery](file:///home/firo2504/Desktop/TechDesk/BACKUP_AND_RESTORE.md): Database backup, verification, and non-destructive restoration protocols.
- [User Guide](file:///home/firo2504/Desktop/TechDesk/USER_GUIDE.md): Practical instructions for Employees and Technicians.
- [Administrator Guide](file:///home/firo2504/Desktop/TechDesk/ADMIN_GUIDE.md): Operational manual for Super Admins, Org Admins, and Managers.
- [Production Readiness Audit](file:///home/firo2504/Desktop/TechDesk/PRODUCTION_READINESS_REPORT.md): Security and operational audit findings.

---

## License

This project is licensed under the MIT License.
