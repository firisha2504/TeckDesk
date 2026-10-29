# TechDesk REST API Reference

## Base URL & Protocols
- Base API URL: `http://localhost:5000/api`
- WebSocket URL: `ws://localhost:5000/socket.io`
- Standard Response Wrapper:
```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "Success message",
  "success": true,
  "meta": { "total": 100, "page": 1, "totalPages": 7 }
}
```

---

## 1. Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | None | Register a new user account and organization |
| `POST` | `/api/auth/login` | None | Authenticate with email/password; sets HTTP-only cookie |
| `POST` | `/api/auth/logout` | User | Clear session cookie and invalidate token |
| `GET` | `/api/auth/me` | User | Retrieve current authenticated user profile |
| `POST` | `/api/auth/forgot-password` | None | Request password reset token |
| `POST` | `/api/auth/reset-password` | None | Reset account password using token |

---

## 2. Tickets Endpoints (`/api/tickets`)

| Method | Endpoint | Auth Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/tickets` | All Users | Create a new ticket (triggers auto-assignment & SLA calculation) |
| `GET` | `/api/tickets` | All Users | List paginated tickets with filtering (status, priority, search) |
| `GET` | `/api/tickets/:id` | All Users | Retrieve ticket details by ID |
| `PATCH`| `/api/tickets/:id/status` | Staff/Owner | Transition ticket status (enforces state machine validation) |
| `PATCH`| `/api/tickets/:id/reassign` | Tech, Mgr, Admin | Reassign ticket to another technician |
| `POST` | `/api/tickets/:id/comments` | All Users | Post a new comment or internal staff note |
| `GET` | `/api/tickets/:id/comments` | All Users | Retrieve comments (internal notes hidden from employees) |
| `GET` | `/api/tickets/:id/timeline` | All Users | Retrieve chronological audit events timeline |
| `GET` | `/api/tickets/:id/recommendations` | Tech, Mgr, Admin | Get ranked technicians based on skills and active workload |
| `POST` | `/api/tickets/:id/attachments` | All Users | Upload file attachment to ticket (multipart/form-data) |

---

## 3. Support Teams (`/api/teams`)

| Method | Endpoint | Auth Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/teams` | All Users | List all support teams in organization |
| `POST` | `/api/teams` | Mgr, Admin | Create a new support team with specialties |
| `PATCH`| `/api/teams/:id` | Mgr, Admin | Update team lead, specialties, or member roster |
| `DELETE`| `/api/teams/:id` | Mgr, Admin | Delete support team |

---

## 4. SLA Policy (`/api/sla`)

| Method | Endpoint | Auth Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/sla` | All Users | Retrieve current active SLA policy and deadlines |
| `PATCH`| `/api/sla` | Mgr, Admin | Update response and resolution thresholds |
| `POST` | `/api/sla/check` | Mgr, Admin | Manually trigger SLA breach scanner |

---

## 5. Analytics & Reports (`/api/analytics`)

| Method | Endpoint | Auth Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/analytics/employee` | All Users | Retrieve personal employee metrics and trends |
| `GET` | `/api/analytics/technician` | Tech, Mgr, Admin | Retrieve technician workload and overdue count |
| `GET` | `/api/analytics/manager` | Mgr, Admin | Full department volume, compliance, and team metrics |
| `GET` | `/api/analytics/admin` | Admin | Organization statistics, audit feed, and system health |
| `GET` | `/api/analytics/export` | Tech, Mgr, Admin | Download authorized CSV report of tickets |

---

## 6. Notifications (`/api/notifications`)

| Method | Endpoint | Auth Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | User | List user's notifications (paginated) |
| `GET` | `/api/notifications/unread-count` | User | Get total unread count for badge |
| `PATCH`| `/api/notifications/:id/read` | User | Mark single notification as read |
| `POST` | `/api/notifications/read-all` | User | Mark all notifications as read |

---

## 7. Organizations & Audit (`/api/organizations`)

| Method | Endpoint | Auth Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/organizations/settings` | All Users | Get organization details and business hours |
| `PATCH`| `/api/organizations/settings` | Admin | Update organization settings and policies |
| `GET` | `/api/organizations/audit-logs` | Admin | Query immutable enterprise audit log |
