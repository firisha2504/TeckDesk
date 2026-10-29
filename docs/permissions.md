# TechDesk Role-Based Access Control (RBAC) & Permissions

## 1. Overview & Hierarchy

TechDesk enforces permission checks both at the Express.js server middleware level and within React client routes and interactive elements.

```
Administrator  (Full organization control, security, audit, user management)
      ▲
   Manager     (Team oversight, ticket assignment, SLA policy tuning, analytics)
      ▲
  Technician   (Incident triage, resolution notes, staff internal comments)
      ▲
   Employee    (Incident creation, status tracking, public replies)
```

---

## 2. Permissions Matrix

| Capability / Action | Employee | Technician | Manager | Administrator |
| :--- | :---: | :---: | :---: | :---: |
| **Submit Ticket** | ✅ | ✅ | ✅ | ✅ |
| **View Own Tickets** | ✅ | ✅ | ✅ | ✅ |
| **View All Org Tickets** | ❌ | ✅ | ✅ | ✅ |
| **Add Public Comment** | ✅ | ✅ | ✅ | ✅ |
| **Add Internal Staff Note** | ❌ | ✅ | ✅ | ✅ |
| **Change Status to 'In Progress'** | ❌ | ✅ | ✅ | ✅ |
| **Change Status to 'Resolved'** | ❌ | ✅ | ✅ | ✅ |
| **Close Own Resolved Ticket** | ✅ | ✅ | ✅ | ✅ |
| **Reopen Closed Ticket** | ✅ | ✅ | ✅ | ✅ |
| **Reassign Ticket Specialist** | ❌ | ✅ | ✅ | ✅ |
| **Manage Support Teams** | ❌ | ❌ | ✅ | ✅ |
| **Configure SLA Policies** | ❌ | ❌ | ✅ | ✅ |
| **Trigger Manual SLA Scan** | ❌ | ❌ | ✅ | ✅ |
| **View Department Analytics** | ❌ | ✅ | ✅ | ✅ |
| **Export Ticket Reports CSV** | ❌ | ✅ | ✅ | ✅ |
| **User Role Assignment** | ❌ | ❌ | ✅ | ✅ |
| **Organization Settings** | ❌ | ❌ | ❌ | ✅ |
| **System Audit Logs** | ❌ | ❌ | ❌ | ✅ |

---

## 3. Multi-Tenant Organization Isolation

TechDesk enforces strict tenant boundaries at the database query layer:
- Every resource model (`Ticket`, `User`, `Team`, `SLAPolicy`, `Notification`, `AuditLog`) contains an `organization` reference.
- The `tenantScope` middleware automatically binds the user's authenticated `organizationId` to every query filter.
- Any attempt to access or modify resources belonging to another organization returns a `404 Not Found` or `403 Forbidden` response.
