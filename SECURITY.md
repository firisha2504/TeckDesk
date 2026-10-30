# TechDesk Security Architecture & Vulnerability Defense

This document details the multi-layer security architecture, threat models, and vulnerability defense mechanisms implemented across the TechDesk platform.

---

## 1. Multi-Tenant Data Isolation & Boundary Defense

TechDesk implements a **Zero-Trust Multi-Tenancy Architecture**. A single database instance stores records for multiple institutions, with guaranteed logical boundaries enforced at the network, middleware, and database layers.

```
+------------------------------------------------------------------------------------+
|                                    INCOMING REQUEST                                |
+------------------------------------------------------------------------------------+
                                          |
                                          v
+------------------------------------------------------------------------------------+
| 1. Authentication Layer (authenticate.js)                                          |
|    - Verifies cryptographic signature of JWT using server-side JWT_SECRET.         |
|    - Loads user from DB: verifies isActive: true and populates user.organization.   |
+------------------------------------------------------------------------------------+
                                          |
                                          v
+------------------------------------------------------------------------------------+
| 2. Tenant Context & Anti-Tampering (tenantScope.js)                                |
|    - Derives req.organizationId strictly from user.organization._id.                |
|    - Checks organization.status !== 'suspended' and !== 'pending'.                 |
|    - Anti-Tampering Guard: Rejects any ?organization or ?organizationId in query   |
|      params with 403 Forbidden.                                                    |
+------------------------------------------------------------------------------------+
                                          |
                                          v
+------------------------------------------------------------------------------------+
| 3. Role Authorization (authorize.js)                                               |
|    - Validates user.role against permitted route roles (e.g. ['admin', 'manager']). |
|    - SuperAdmin platform isolation: superadmin cannot access tenant workspace      |
|      endpoints without explicit authorization.                                     |
+------------------------------------------------------------------------------------+
                                          |
                                          v
+------------------------------------------------------------------------------------+
| 4. Data Access Layer (Service Layer)                                               |
|    - Every MongoDB query incorporates { organization: req.organizationId }.        |
|    - Cross-tenant ID lookups return 404 Not Found (IDOR prevented).                |
+------------------------------------------------------------------------------------+
```

### Key Multi-Tenant Safeguards:
1. **Server-Side Trust Context**: The client cannot specify or alter their organization through request headers, request bodies, or URL parameters. `req.organizationId` is derived exclusively on the server from the verified JWT.
2. **Anti-Tampering Query Middleware**: Any request carrying query parameters like `?organizationId=...` or `?organization=...` is checked against the user's authentic organization ID. Mismatched queries immediately trigger HTTP `403 Forbidden`.
3. **Cross-Tenant Team & Technician Assignment Defense**: When assigning technicians or adding team members, [team.controller.js](file:///home/firo2504/Desktop/TechDesk/backend/src/controllers/team.controller.js) and [ticket.service.js](file:///home/firo2504/Desktop/TechDesk/backend/src/services/ticket.service.js) verify that every user specified belongs strictly to `req.organizationId`. Foreign user assignments are rejected with HTTP 400.

---

## 2. Insecure Direct Object Reference (IDOR) Defense

An IDOR vulnerability occurs when an application exposes a direct database identifier (such as a MongoDB ObjectId) without verifying whether the requesting user owns or has authorized access to that record.

TechDesk eliminates IDOR vulnerabilities across all resources:
- **Tickets**: `Ticket.findOne({ _id: ticketId, organization: req.organizationId })`. If an attacker from Organization B submits the ID of a ticket belonging to Organization A, the database query returns `null`, and the service raises `404 Not Found` or `403 Forbidden`.
- **Comments & Timeline**: In [ticket.service.js](file:///home/firo2504/Desktop/TechDesk/backend/src/services/ticket.service.js), `getTicketComments` and `getTicketTimeline` verify that the parent ticket exists within `req.organizationId` before querying discussion comments or events.
- **Attachments**: Downloading an attachment (`GET /api/attachments/:id/download`) verifies that the attachment's parent ticket belongs to `req.organizationId`.
- **Employee Ticket Privacy**: For users with the `employee` role, queries automatically append `{ creator: user._id }`, preventing employees from viewing other employees' confidential tickets within the same organization.

---

## 3. Role-Based Access Control (RBAC) Matrix

| Endpoint / Capability | Platform Super Admin | Organization Admin | Department Manager | Support Technician | Standard Employee |
|---|:---:|:---:|:---:|:---:|:---:|
| **Platform Overview & Global Metrics** | Yes | No | No | No | No |
| **Approve / Suspend Organizations** | Yes | No | No | No | No |
| **Global Security Audit Logs** | Yes | No | No | No | No |
| **Manage Organization Settings** | Yes | Yes | No | No | No |
| **Manage Staff Accounts & Roles** | No | Yes | No | No | No |
| **Create & Configure Teams** | No | Yes | Yes | No | No |
| **View Tenant Analytics Dashboard** | No | Yes | Yes | No | No |
| **Trigger Manual SLA Scans** | No | Yes | Yes | No | No |
| **Export Ticket CSV Reports** | No | Yes | Yes | Yes | No |
| **Assign / Reassign Tickets** | No | Yes | Yes | Yes | No |
| **Transition Ticket Status (In Progress/Resolved)** | No | Yes | Yes | Yes | No |
| **Post Internal Diagnostic Comments** | No | Yes | Yes | Yes | No |
| **Submit New Support Tickets** | No | Yes | Yes | Yes | Yes |
| **View Personal Tickets & Reply** | No | Yes | Yes | Yes | Yes |
| **Download Own Ticket Attachments** | Yes (Audit) | Yes | Yes | Yes | Yes (Own) |

---

## 4. Authentication & Password Security

### 4.1 Password Hashing
- **Algorithm**: `bcrypt`
- **Cost Factor / Salt Rounds**: `10`
- **Pre-save Hook**: Automatically executed in Mongoose [User.js](file:///home/firo2504/Desktop/TechDesk/backend/src/models/User.js) whenever the `password` field is modified.
- **Serialization Protection**: Password fields are declared with `select: false` in the Mongoose schema, ensuring passwords are never accidentally included in API responses or logs.

### 4.2 JSON Web Tokens (JWT)
- **Algorithm**: `HMAC-SHA256` (`HS256`)
- **Secret Key**: Sourced from `env.JWT_SECRET` (minimum 32 characters in production).
- **Payload Contents**: `id`, `email`, `role`, `organization`, `name`. No passwords or sensitive tokens are stored in the payload.
- **Expiration**: Enforced via `JWT_EXPIRES_IN` (default: 7 days).
- **Cookie Transport**: Stored in a secure `token` cookie with flags:
  - `httpOnly: true`: Prevents client-side JavaScript access (mitigating XSS theft).
  - `secure: true`: Enforced in production to guarantee HTTPS-only transmission.
  - `sameSite: 'lax'` (or `'none'` in cross-origin environments with SSL): Mitigates CSRF attacks.

### 4.3 Secure Password Reset Workflow
- **Random Token Generation**: Generated using Node.js `crypto.randomBytes(32).toString('hex')`.
- **Hashed Database Storage**: Only the cryptographic hash of the reset token (`crypto.createHash('sha256').update(token).digest('hex')`) is stored in the database. A database leak cannot expose active reset tokens.
- **Single-Use Enforcement**: Tokens expire after 60 minutes and are immediately cleared from the database upon first successful reset.
- **Zero-Enumeration Guarantee**: Requesting a password reset for a non-existent email returns the identical success message, preventing user enumeration.

---

## 5. Attachment & File Upload Security

Files uploaded to TechDesk pass through multiple security filters:

1. **Dual Format Validation**:
   - **MIME Type Whitelist**: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `application/pdf`, `text/plain`, `text/csv`, `application/json`, `application/zip`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
   - **File Extension Whitelist**: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.pdf`, `.txt`, `.csv`, `.json`, `.zip`, `.doc`, `.docx`.
   - Executables (`.exe`, `.sh`, `.bat`, `.js`, `.php`, `.py`) are rejected during upload.
2. **File Size Quota**: Strict 10MB per file limit enforced by `multer`.
3. **Sanitized Disk Filenames**:
   - Uploaded files are renamed using a 16-character cryptographic random hex string and timestamp (`${Date.now()}-${randomHex}-${sanitizedBase}${ext}`).
   - Non-alphanumeric characters in the base name are stripped to prevent directory traversal and null-byte injection.
4. **No Direct Static Serving**:
   - The `/uploads` path is not served publicly. File retrieval is routed through `/api/attachments/:id/download`, which authenticates the user and verifies organization ownership before streaming the file.

---

## 6. Real-Time WebSocket Security (Socket.IO)

1. **Handshake Token Authentication**: Every WebSocket connection is authenticated before the socket connection is accepted. Connections without a valid JWT are rejected with an authentication error.
2. **Organization Status Enforcement**: Non-superadmin connections are checked against their organization status in the database. Users belonging to `pending` or `suspended` institutions are denied access.
3. **Dynamic Room Isolation**: The server automatically assigns sockets to authorized rooms based on verified identity (`user:<id>`, `org:<id>`, `role:<orgId>:<role>`). Clients cannot arbitrarily subscribe to rooms.
4. **Cross-Tenant Ticket Join Defense**: When a client emits `ticket:join`, the server verifies that the ticket exists and matches `socket.orgId`. Cross-tenant attempts emit an `error` event and log a warning.

---

## 7. Application & Infrastructure Defense

### 7.1 NoSQL Injection Protection
A custom sanitization middleware inspects incoming `req.body`, `req.query`, and `req.params`, recursively deleting any object keys beginning with `$` (MongoDB operators like `$gt`, `$ne`, `$where`) or containing `.`.

### 7.2 Rate Limiting
Configured using `express-rate-limit`:
- **Authentication Endpoints (`/api/auth/*`)**: 30 requests per 15 minutes per IP address (brute-force defense).
- **General API Endpoints (`/api/*`)**: 200 requests per minute per IP address (DoS / resource starvation defense).

### 7.3 HTTP Security Headers (Helmet)
TechDesk enables `helmet` middleware to enforce modern security headers:
- `X-Content-Type-Options: nosniff` (MIME sniffing prevention)
- `X-Frame-Options: SAMEORIGIN` (Clickjacking mitigation)
- `Strict-Transport-Security` (HSTS: Forces HTTPS in production)
- `Cross-Origin-Resource-Policy: cross-origin`

### 7.4 Cross-Origin Resource Sharing (CORS)
CORS is restricted via [cors.js](file:///home/firo2504/Desktop/TechDesk/backend/src/config/cors.js) to explicitly whitelisted origins (`env.FRONTEND_URL`, localhost development ports). Requests from unauthorized origins are rejected with HTTP 403.

### 7.5 Production Error Shielding
In production (`NODE_ENV=production`), the centralized error handler catches all unhandled exceptions and returns standardized JSON errors (`{ success: false, statusCode: 500, message: "Internal Server Error" }`). Stack traces are stripped to prevent exposing internal file paths or libraries.

---

## 8. Security Audit Logging

All administrative, platform, and tenant security events are recorded in the `auditlogs` collection:
- `ORGANIZATION_REGISTERED`
- `ORGANIZATION_APPROVED`
- `ORGANIZATION_REJECTED`
- `ORGANIZATION_SUSPENDED`
- `ORGANIZATION_REACTIVATED`
- `USER_LOGGED_IN`
- `USER_LOGGED_OUT`
- `PASSWORD_RESET_REQUESTED`
- `PASSWORD_RESET_COMPLETED`
- `ROLE_UPDATED`
- `TEAM_CREATED`
- `SLA_BREACH_DETECTED`

Each audit entry stores the `actor` ID, `organization` ID, `action`, `resource`, client `ipAddress`, and `userAgent`. Sensitive fields (such as passwords or authentication tokens) are scrubbed before logging.
