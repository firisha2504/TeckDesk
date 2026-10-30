# TechDesk Database Backup, Verification & Recovery Runbook

This document details the procedures for backing up, verifying, and safely restoring the TechDesk MongoDB database, including disaster recovery and non-destructive dry-run testing.

---

## 1. Backup Strategy Overview

TechDesk supports two backup mechanisms:
1. **Application-Level JSON Backup (`backup-db.js`)**: An audited Node.js utility that exports all collections with schema metadata, collection record counts, and timestamps.
2. **Native MongoDB Binary Dumps (`mongodump`)**: The recommended enterprise standard for fast, binary BSON snapshots with index definitions.

### Recovery Time Objective (RTO) and Recovery Point Objective (RPO)
- **RTO (Target Time to Recover)**: < 15 minutes.
- **RPO (Maximum Acceptable Data Loss)**: 6 hours (standard cron snapshot schedule).

---

## 2. Creating Database Backups

### Method A: Automated Application Script (`backup-db.js`)
Run the backup script located in `backend/scripts/`:

```bash
cd backend
node scripts/backup-db.js
```

The script exports all collections to:
`/home/firo2504/Desktop/TechDesk/backend/data/backups/techdesk_backup_<ISO_TIMESTAMP>.json`

Console Output:
```
[INFO] Connected to MongoDB successfully.
[INFO] Exporting collection 'organizations': 1 documents...
[INFO] Exporting collection 'users': 9 documents...
[INFO] Exporting collection 'tickets': 7 documents...
[INFO] Exporting collection 'ticketcomments': 3 documents...
[INFO] Exporting collection 'ticketevents': 6 documents...
[INFO] Exporting collection 'slapolicies': 1 documents...
[INFO] Backup file created successfully: /home/.../techdesk_backup_2026-10-30T14-15-52-255Z.json
```

---

### Method B: Native MongoDB Binary Dump (`mongodump`)
For production installations with high volume:

```bash
# Define target backup directory
TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
BACKUP_DIR="/var/backups/techdesk/backup_${TIMESTAMP}"
mkdir -p "$BACKUP_DIR"

# Execute mongodump with gzip compression
mongodump --uri="mongodb://localhost:27017/techdesk" --out="$BACKUP_DIR" --gzip

echo "Backup completed to: $BACKUP_DIR"
```

---

## 3. Backup Integrity Verification

Before storing or trusting any backup, execute these three validation checks:

### 1. Check File Readability & Size
```bash
# Verify the file is not 0 bytes and is valid JSON
ls -lh backend/data/backups/techdesk_backup_*.json
```

### 2. Verify Primary Entities in JSON
```bash
node -e "
import fs from 'fs';
const backupFile = process.argv[1];
const data = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

console.log('--- BACKUP INTEGRITY REPORT ---');
console.log('Timestamp:', data.timestamp);
console.log('Collections count:', Object.keys(data.collections).length);

const orgs = data.collections.organizations || [];
const users = data.collections.users || [];
const tickets = data.collections.tickets || [];

console.log('Organizations:', orgs.length);
console.log('Users:', users.length);
console.log('Tickets:', tickets.length);

const primaryOrg = orgs.find(o => o._id === '6ae4a0a7e61654672c50a1ce');
if (primaryOrg && users.length >= 8 && tickets.length >= 7) {
  console.log('[SUCCESS] Primary TechDesk Solutions data verified intact.');
} else {
  console.error('[CRITICAL] Missing required primary production records.');
  process.exit(1);
}
" "/path/to/techdesk_backup.json"
```

---

## 4. Non-Destructive Restoration Testing (Separate Test DB)

> **CRITICAL RULE**: **Never test restoration directly against the active `techdesk` database.** Always test restoration in an isolated database name (e.g., `techdesk_test_restore`).

### Step 1: Restore to Temporary Database
```bash
# Restore BSON dump into temporary database 'techdesk_test_restore'
mongorestore --uri="mongodb://localhost:27017/techdesk_test_restore" --nsFrom="techdesk.*" --nsTo="techdesk_test_restore.*" --gzip /var/backups/techdesk/backup_<TIMESTAMP>/techdesk
```

### Step 2: Validate Records in Restored Database
```bash
mongosh "mongodb://localhost:27017/techdesk_test_restore" --eval '
  print("Testing Restored Collections:");
  print("  Organizations: " + db.organizations.countDocuments());
  print("  Users:         " + db.users.countDocuments());
  print("  Tickets:       " + db.tickets.countDocuments());
  print("  Primary Org:   " + db.organizations.findOne({_id: ObjectId("6ae4a0a7e61654672c50a1ce")}).name);
'
```

### Step 3: Tear Down Temporary Database
Once verified, cleanly drop the test database:
```bash
mongosh "mongodb://localhost:27017/techdesk_test_restore" --eval 'db.dropDatabase()'
```

---

## 5. Production Restoration Runbook

In the event of hardware failure, catastrophic data corruption, or server migration:

### Step 1: Stop Application Server
Prevent in-flight writes during restoration:
```bash
# If using PM2:
pm2 stop techdesk-api

# If using Docker:
docker compose stop backend
```

### Step 2: Create a Safety Snapshot of Current State
Even if damaged, record the current state before replacing:
```bash
mongodump --uri="mongodb://localhost:27017/techdesk" --out="/var/backups/techdesk/pre_restore_safety_dump" --gzip
```

### Step 3: Execute Restoration
```bash
mongorestore --uri="mongodb://localhost:27017/techdesk" --drop --gzip /var/backups/techdesk/backup_<TARGET_TIMESTAMP>/techdesk
```

### Step 4: Restart Application & Verify Health
```bash
# If using PM2:
pm2 restart techdesk-api

# If using Docker:
docker compose start backend

# Verify health endpoint
curl -s http://localhost:5000/api/health | jq
```

---

## 6. Automated Backup Scheduling (Cron)

To establish an automated backup schedule, add a daily cron job:

```bash
# Open crontab editor
crontab -e
```

Add the following entry to execute backups every 6 hours and retain 14 days of history:

```cron
# TechDesk automated backup schedule: Every 6 hours at minute 0
0 */6 * * * /bin/bash -c "BACKUP_DIR=/var/backups/techdesk/backup_\$(date +\%Y\%m\%d_\%H\%M\%S) && mkdir -p \$BACKUP_DIR && mongodump --uri='mongodb://localhost:27017/techdesk' --out=\$BACKUP_DIR --gzip && find /var/backups/techdesk/ -maxdepth 1 -type d -mtime +14 -exec rm -rf {} +" >> /var/log/techdesk_backup.log 2>&1
```
