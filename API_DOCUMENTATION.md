# TechDesk REST API Documentation

This document provides a comprehensive reference for the TechDesk REST API. All endpoints are prefixed with `/api`.

- **Base URL (Local)**: `http://localhost:5000/api`
- **Base URL (Production)**: `https://api.techdesk.io/api`
- **Standard Content-Type**: `application/json`
- **Authentication**: JWT token supplied via `Authorization: Bearer <token>` header or `token` HttpOnly cookie.

---

## Standard Response Format

### Success Response (`200 OK` / `201 Created`)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully.",
  "data": { ... }
}
```

### Error Response (`400`, `401`, `403`, `404`, `409`, `500`)
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Access forbidden: Insufficient permissions.",
  "errors": []
}
```

---

## 1. System Health

### `GET /api/health`
- **Description**: Returns operational diagnostics and uptime.
- **Auth**: None (Public)
- **Response `200 OK`**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "TechDesk API is healthy and operational.",
  "data": {
    "status": "UP",
    "timestamp": "2026-10-30T16:00:00.000Z",
    "uptime": 12450.45,
    "memoryUsage": {
      "rss": 105451520,
      "heapTotal": 39755776,
      "heapUsed": 34182912
    }
  }
}
```

---

## 2. Authentication & Authorization

### `POST /api/auth/login`
- **Description**: Authenticates user credentials and returns user payload with JWT token. Sets an HttpOnly session cookie.
- **Auth**: None (Public)
- **Rate Limit**: 30 requests per 15 minutes
- **Request Body**:
```json
{
  "email": "admin@techdesk.com",
  "password": "Password123!"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Logged in successfully.",
  "data": {
    "user": {
      "id": "6ae4a0a8e61654672c50a1db",
      "name": "Firomsa Abdi",
      "email": "admin@techdesk.com",
      "role": "admin",
      "organization": {
        "id": "6ae4a0a7e61654672c50a1ce",
        "name": "TechDesk Solutions",
        "slug": "techdesk-solutions",
        "status": "active"
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
- **Error Responses**:
  - `401 Unauthorized`: Invalid email or password.
  - `403 Forbidden`: Account deactivated or organization status is `pending` or `suspended`.

---

### `POST /api/auth/register-organization`
- **Description**: Public registration endpoint for new institutions. Creates an organization record with `status: 'pending'` and provisions the primary Organization Administrator.
- **Auth**: None (Public)
- **Request Body**:
```json
{
  "organizationName": "St. Jude General Hospital",
  "domain": "stjude-hospital.test",
  "type": "Hospital / Healthcare",
  "officialEmail": "support@stjude-hospital.test",
  "phone": "+1-555-0144",
  "address": "777 Healthcare Blvd, Medical District",
  "adminName": "Dr. Sarah Admin",
  "adminEmail": "admin@hosp-a.test",
  "adminPassword": "Password123!"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Organization registration submitted successfully. Your request is pending review by the platform administrator.",
  "data": {
    "organization": {
      "_id": "6ae4cf...",
      "name": "St. Jude General Hospital",
      "slug": "st-jude-general-hospital",
      "status": "pending"
    },
    "admin": {
      "_id": "6ae4cf...",
      "name": "Dr. Sarah Admin",
      "email": "admin@hosp-a.test",
      "role": "admin"
    }
  }
}
```

---

### `GET /api/auth/me`
- **Description**: Returns profile, role, and organization data for the authenticated session.
- **Auth**: Required (`superadmin`, `admin`, `manager`, `technician`, `employee`)
- **Response `200 OK`**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "user": {
      "id": "6ae4a0a8e61654672c50a1db",
      "name": "Firomsa Abdi",
      "email": "admin@techdesk.com",
      "role": "admin",
      "organization": {
        "id": "6ae4a0a7e61654672c50a1ce",
        "name": "TechDesk Solutions",
        "slug": "techdesk-solutions"
      }
    }
  }
}
```

---

### `POST /api/auth/logout`
- **Description**: Invalidates session cookie and records user logout audit event.
- **Auth**: Required

---

### `POST /api/auth/forgot-password`
- **Description**: Generates a cryptographically random, single-use password reset token with a 1-hour expiration. Dispatches an email if SMTP is configured. Always returns a generic success message to prevent user enumeration.
- **Auth**: None (Public)
- **Request Body**:
```json
{
  "email": "user@example.com"
}
```

---

### `POST /api/auth/reset-password`
- **Description**: Resets password using the received token. Enforces single-use token expiration and clears token fields in the database.
- **Auth**: None (Public)
- **Request Body**:
```json
{
  "token": "a1b2c3d4...",
  "password": "NewSecurePassword123!"
}
```

---

## 3. Platform Super Admin Operations

All endpoints in this group require the `superadmin` role.

### `GET /api/superadmin/overview`
- **Description**: Global platform performance metrics across all tenants.
- **Auth**: Required (`superadmin`)
- **Response `200 OK`**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "organizations": { "total": 12, "active": 10, "pending": 1, "suspended": 1 },
    "users": { "total": 145, "admins": 12, "technicians": 48, "employees": 85 },
    "tickets": { "total": 890, "open": 45, "inProgress": 32, "resolved": 813 },
    "systemHealth": { "uptime": "4d 12h", "mongoStatus": "connected", "redisStatus": "connected" }
  }
}
```

---

### `GET /api/superadmin/organizations`
- **Description**: Lists all registered organizations with search, filter, and pagination.
- **Auth**: Required (`superadmin`)
- **Query Parameters**:
  - `status`: `active` | `pending` | `suspended` | `rejected`
  - `type`: filter by industry type
  - `search`: search term matching name, slug, domain, or official email
  - `page`: default `1`
  - `limit`: default `20`

---

### `GET /api/superadmin/organizations/:id`
- **Description**: Detailed profile of an organization including settings, SLA policies, and its primary administrator account.
- **Auth**: Required (`superadmin`)

---

### `PATCH /api/superadmin/organizations/:id/approve`
- **Description**: Approves a pending organization registration. Transitions status to `active` and generates an audit log entry.
- **Auth**: Required (`superadmin`)
- **Request Body** (Optional):
```json
{
  "plan": "enterprise"
}
```

---

### `PATCH /api/superadmin/organizations/:id/reject`
- **Description**: Rejects a pending organization registration with a mandatory explanation.
- **Auth**: Required (`superadmin`)
- **Request Body**:
```json
{
  "reason": "Official educational domain could not be verified."
}
```

---

### `PATCH /api/superadmin/organizations/:id/suspend`
- **Description**: Immediately suspends an active organization. Disconnects existing WebSocket connections and rejects subsequent API requests with HTTP 403.
- **Auth**: Required (`superadmin`)
- **Request Body**:
```json
{
  "reason": "Billing delinquency or compliance violation."
}
```

---

### `PATCH /api/superadmin/organizations/:id/reactivate`
- **Description**: Restores a suspended organization to `active` status.
- **Auth**: Required (`superadmin`)

---

### `GET /api/superadmin/audit-logs`
- **Description**: Platform-wide audit log query.
- **Auth**: Required (`superadmin`)
- **Query Parameters**: `action`, `resource`, `page`, `limit`

---

## 4. Organization Management

### `GET /api/organizations/current`
- **Description**: Fetches current tenant organization profile and settings.
- **Auth**: Required (`admin`, `manager`, `technician`, `employee`)

---

### `PATCH /api/organizations/settings`
- **Description**: Updates organization settings (business hours, default ticket priority, registration toggle).
- **Auth**: Required (`admin`)
- **Request Body**:
```json
{
  "settings": {
    "allowRegistration": true,
    "defaultTicketPriority": "Medium",
    "businessHours": {
      "start": "08:30",
      "end": "17:30",
      "timeZone": "Africa/Addis_Ababa"
    }
  }
}
```

---

## 5. User Management

### `GET /api/users`
- **Description**: Lists users strictly scoped to the authenticated tenant organization.
- **Auth**: Required (`admin`, `manager`, `technician`)
- **Query Parameters**: `role`, `search`, `page`, `limit`

---

### `PATCH /api/users/:id/role`
- **Description**: Updates a staff user's role.
- **Auth**: Required (`admin`)
- **Request Body**:
```json
{
  "role": "technician"
}
```

---

## 6. Team Management

### `GET /api/teams`
- **Description**: Lists support teams within the tenant organization.
- **Auth**: Required

---

### `POST /api/teams`
- **Description**: Creates a new support team. Validates that the specified `leadId` and all `memberIds` belong strictly to `req.organizationId`.
- **Auth**: Required (`admin`, `manager`)
- **Request Body**:
```json
{
  "name": "Network & Infrastructure Team",
  "description": "Manages core routing, switching, and fiber cabling.",
  "leadId": "6ae4a0a8e61654672c50a1dc",
  "memberIds": ["6ae4a0a8e61654672c50a1dc", "6ae4a0a8e61654672c50a1df"],
  "specialties": ["Network", "Security", "Hardware"]
}
```

---

## 7. Ticket Management

### `GET /api/tickets`
- **Description**: Lists tickets scoped to the user's organization. For `employee` roles, automatically filters to tickets created by the user.
- **Auth**: Required
- **Query Parameters**: `status`, `priority`, `category`, `search`, `page`, `limit`

---

### `POST /api/tickets`
- **Description**: Creates a new support incident. Generates a sequential ticket number (`TD-1008`), calculates SLA deadlines, and broadcasts a WebSocket event.
- **Auth**: Required
- **Request Body**:
```json
{
  "title": "Hospital Core Database Latency Spike",
  "description": "Patient EHR query response times exceeded 12 seconds in Ward 3.",
  "category": "Software",
  "priority": "Critical"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "_id": "6ae4d...",
    "ticketNumber": "TD-1008",
    "title": "Hospital Core Database Latency Spike",
    "status": "Open",
    "priority": "Critical",
    "sla": {
      "responseDeadline": "2026-10-30T16:15:00.000Z",
      "resolutionDeadline": "2026-10-30T18:00:00.000Z"
    }
  }
}
```

---

### `GET /api/tickets/:id`
- **Description**: Detailed ticket view. Protected against IDOR; returns 404 if the ticket belongs to a foreign organization.
- **Auth**: Required

---

### `PATCH /api/tickets/:id/status`
- **Description**: Updates ticket lifecycle status (`Open` -> `In Progress` -> `Resolved` -> `Closed`).
- **Auth**: Required (`admin`, `manager`, `technician`)
- **Request Body**:
```json
{
  "status": "In Progress",
  "resolutionNotes": "Investigating query locks on database cluster."
}
```

---

### `PATCH /api/tickets/:id/reassign`
- **Description**: Reassigns ticket to another technician. Validates technician belongs to the same tenant.
- **Auth**: Required (`admin`, `manager`, `technician`)
- **Request Body**:
```json
{
  "assigneeId": "6ae4a0a8e61654672c50a1df"
}
```

---

## 8. Comments & Timeline

### `GET /api/tickets/:id/comments`
- **Description**: Retrieves comments on a ticket. Validates ticket tenant ownership.
- **Auth**: Required

---

### `POST /api/tickets/:id/comments`
- **Description**: Adds a public or internal comment to a ticket.
- **Auth**: Required
- **Request Body**:
```json
{
  "content": "Rebooted primary replica node. Latencies have returned to 45ms.",
  "isInternal": false
}
```

---

### `GET /api/tickets/:id/timeline`
- **Description**: Returns chronological audit history of ticket events (creation, assignment, status change, comments).
- **Auth**: Required

---

## 9. Attachments

### `POST /api/tickets/:id/attachments`
- **Description**: Uploads a document or screenshot to a ticket. Enforces MIME and extension whitelists (10MB limit).
- **Auth**: Required
- **Content-Type**: `multipart/form-data`
- **Form Field**: `file`

---

### `GET /api/attachments/:id/download`
- **Description**: Downloads an attachment file with strict tenant and permission checks.
- **Auth**: Required
- **Responses**:
  - `200 OK`: File stream (`application/pdf`, `image/png`, etc.)
  - `403 Forbidden`: Cross-tenant file access attempt or employee accessing another employee's private attachment.
  - `404 Not Found`: Attachment record or file on disk not found.

---

## 10. Analytics & Reporting

### `GET /api/analytics/admin`
- **Description**: Aggregated metrics for Organization Administrators.
- **Auth**: Required (`admin`)
- **Response `200 OK`**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "totalUsers": 8,
    "openTickets": 4,
    "systemUptime": "12h 45m",
    "roleBreakdown": [
      { "_id": "admin", "count": 1 },
      { "_id": "manager", "count": 1 },
      { "_id": "technician", "count": 4 },
      { "_id": "employee", "count": 2 }
    ],
    "trends": [ ... ]
  }
}
```

---

### `GET /api/analytics/export`
- **Description**: Exports filtered ticket data as a downloadable CSV report.
- **Auth**: Required (`admin`, `manager`, `technician`)
- **Response `200 OK`**: `text/csv` attachment.
