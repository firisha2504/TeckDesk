# TechDesk Production Deployment & Operations Guide

## 1. Containerized Deployment with Docker Compose

TechDesk provides a production-ready `docker-compose.yml` orchestrating MongoDB 7, Redis 7, Express Backend, and Nginx Frontend.

### Prerequisites
- Docker Engine >= 24.0.0
- Docker Compose >= 2.20.0

### Launch Commands
```bash
# 1. Clone repository
git clone <repo-url> techdesk
cd techdesk

# 2. Configure production environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Build and start containers in detached mode
docker compose up -d --build

# 4. Seed initial enterprise demo dataset inside backend container
docker compose exec backend node scripts/seed.js

# 5. Verify container health status
docker compose ps
```

---

## 2. Ports & Network Topology

| Container Service | Internal Port | External Port | Healthcheck |
| :--- | :--- | :--- | :--- |
| `techdesk-mongodb` | 27017 | 27017 | `mongosh --eval "db.adminCommand('ping')"` |
| `techdesk-redis` | 6379 | 6379 | `redis-cli ping` |
| `techdesk-backend` | 5000 | 5000 | `curl http://localhost:5000/api/health` |
| `techdesk-frontend`| 80 | 5173 (or 80) | Nginx HTTP 200 OK |

---

## 3. Database Backup & Disaster Recovery

### Create MongoDB Dump
```bash
# Execute mongodump to volume or host directory
docker compose exec mongodb mongodump --db techdesk --out /data/db/backups/dump_$(date +%Y%m%d_%H%M%S)
```

### Restore MongoDB Backup
```bash
docker compose exec mongodb mongorestore --db techdesk /data/db/backups/<backup-directory>/techdesk
```

---

## 4. Health Checks & Centralized Logging

- **Healthcheck Endpoint**: `GET /api/health`
  Returns HTTP 200 with uptime, system memory metrics, and service status.
- **Backend Logs**:
  ```bash
  docker compose logs -f backend
  ```
- **Job Queue Status**:
  Evaluates BullMQ and fallback periodic SLA check every 60 seconds with structured logs.
