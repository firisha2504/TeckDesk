# TechDesk Production Deployment Runbook

This guide details the deployment options, environment preparation, reverse proxy configuration, and operational best practices for deploying TechDesk in production.

---

## 1. Production Architecture Overview

In production, TechDesk consists of four coordinated components:

```
[ Internet Traffic ]
        │
        ▼ (Port 80/443 HTTPS / WSS)
┌────────────────────────────────────────────────────────┐
│ Nginx Reverse Proxy (SSL Termination & Static Assets)   │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
         /api, /socket.io             /* (SPA)
                │                        │
                ▼                        ▼
┌───────────────────────────────┐ ┌──────────────────────┐
│ TechDesk Node.js API (Port 5000)│ │ React Built Static  │
│ [PM2 Cluster / Docker App]    │ │ Files (/var/www/html)│
└───────┬───────────────┬───────┘ └──────────────────────┘
        │               │
        ▼               ▼
┌───────────────┐ ┌─────────────┐
│ MongoDB 7.0+  │ │  Redis 7.2+ │
│ (Replica Set) │ │  (BullMQ)   │
└───────────────┘ └─────────────┘
```

---

## 2. Deployment Option A: Docker Compose (Recommended)

Docker Compose is the fastest and most reliable deployment path. The repository includes an optimized [docker-compose.yml](file:///home/firo2504/Desktop/TechDesk/docker-compose.yml).

### Step 1: Create Production Environment File (`.env.production`)
Create a production environment file in the project root:

```ini
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://support.yourdomain.com

# Database (container networking)
MONGODB_URI=mongodb://mongodb:27017/techdesk

# Queues
REDIS_URL=redis://redis:6379
ENABLE_DEV_JOB_SCHEDULER=false

# Security (Generate with: openssl rand -hex 32)
JWT_SECRET=generate_a_secure_random_64_character_hex_string_here
JWT_EXPIRES_IN=7d

# File Storage
UPLOAD_DIR=uploads

# Production Mail Delivery (e.g. AWS SES / SendGrid)
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=AKIAIOSFODNN7EXAMPLE
SMTP_PASS=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
SMTP_FROM=TechDesk Support <no-reply@yourdomain.com>
```

### Step 2: Build and Launch Containers

```bash
# Build images and start services in the background
docker compose --env-file .env.production up -d --build

# Verify all four services are healthy
docker compose ps
```

Expected output:
```
NAME                IMAGE                  COMMAND                  SERVICE    STATUS
techdesk-mongodb    mongo:7.0              "docker-entrypoint.s…"   mongodb    Up (healthy)
techdesk-redis      redis:7.2-alpine       "docker-entrypoint.s…"   redis      Up (healthy)
techdesk-backend    techdesk-backend       "node src/server.js"     backend    Up (healthy)
techdesk-frontend   techdesk-frontend      "/docker-entrypoint.…"   frontend   Up (healthy)
```

---

## 3. Deployment Option B: Standalone Linux Server (Ubuntu 22.04 LTS / Debian 12)

### Step 1: System Dependencies Installation

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx

# Install MongoDB 7.0 Community Edition
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update && sudo apt install -y mongodb-org

# Install Redis
sudo apt install -y redis-server

# Enable and start services
sudo systemctl enable --now mongod redis-server

# Install PM2 Process Manager globally
sudo npm install -g pm2
```

---

### Step 2: Build the Frontend Assets

```bash
cd /var/www/techdesk/frontend
npm install --frozen-lockfile
npm run build

# Copy production build to web directory
sudo mkdir -p /var/www/html/techdesk
sudo cp -r dist/* /var/www/html/techdesk/
sudo chown -R www-data:www-data /var/www/html/techdesk
```

---

### Step 3: Configure Backend with PM2

Create an `ecosystem.config.cjs` in `/var/www/techdesk/backend`:

```javascript
module.exports = {
  apps: [
    {
      name: 'techdesk-api',
      script: 'src/server.js',
      instances: 'max',       // Cluster mode utilizing all available CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      max_memory_restart: '1G',
      exp_backoff_restart_delay: 100,
    },
  ],
};
```

Launch the service and configure automatic startup on boot:

```bash
cd /var/www/techdesk/backend
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd
```

---

## 4. Nginx Reverse Proxy & SSL Configuration

Create `/etc/nginx/sites-available/techdesk.conf`:

```nginx
# Upstream Node.js API cluster
upstream techdesk_backend {
    server 127.0.0.1:5000;
    keepalive 64;
}

server {
    listen 80;
    server_name support.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name support.yourdomain.com;

    # SSL Certificate (managed via Certbot)
    ssl_certificate /etc/letsencrypt/live/support.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/support.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    client_max_body_size 15M;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml font/woff2 image/svg+xml;

    # Frontend Single Page Application (SPA)
    root /var/www/html/techdesk;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api/ {
        proxy_pass http://techdesk_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket Proxy (Socket.IO)
    location /socket.io/ {
        proxy_pass http://techdesk_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Enable site and acquire SSL certificates:

```bash
sudo ln -s /etc/nginx/sites-available/techdesk.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Generate Let's Encrypt SSL Certificate
sudo certbot --nginx -d support.yourdomain.com
```

---

## 5. Health Checks & Monitoring

- **API Endpoint**: `https://support.yourdomain.com/api/health`
  - Expected HTTP Response: `200 OK`
  - Body: `{ "success": true, "data": { "status": "UP", "uptime": 1234.5 } }`
- **Process Status**: `pm2 status`
- **Application Logs**: `pm2 logs techdesk-api`
- **System Memory & Disk**: `df -h` and `free -m`

---

## 6. Production Scaling Recommendations

1. **MongoDB Replica Set**: For high availability, configure a 3-node MongoDB replica set (Primary-Secondary-Arbiter or 3 data nodes).
2. **Redis Persistence**: Configure `appendonly yes` in `redis.conf` to persist BullMQ background SLA job queues across server reboots.
3. **Dedicated Object Storage (AWS S3 / MinIO)**: For deployments exceeding 50,000 tickets or multi-gigabyte attachments, configure an S3-compatible backend for uploaded attachments.
