# TechDesk User Guide: Employees & Technicians

This user guide provides operational instructions for everyday users of TechDesk: **Employees (Requesters)** and **Support Technicians**.

---

# Part 1: Employee Guide (IT Service Requesters)

As an Employee, you use TechDesk to report computer hardware problems, request software installations, report network outages, and monitor the progress of your support requests.

## 1. Logging In
1. Navigate to the TechDesk portal (e.g. `http://localhost:5173/login`).
2. Enter your institutional email address and password.
3. Upon logging in, you will be redirected to the **Employee Dashboard**.

## 2. Navigating the Employee Dashboard
- **Open Tickets Count**: Displays the number of support requests currently awaiting technician triage.
- **In Progress Count**: Tickets currently being actively investigated by an IT technician.
- **Resolved Today Count**: Incidents resolved within the last 24 hours.
- **Recent Requests Table**: Displays your 5 most recent tickets with real-time status indicators.

## 3. Creating a New Support Ticket
1. Click the **+ New Ticket** button located in the top navigation bar or dashboard sidebar.
2. Fill out the ticket submission form:
   - **Ticket Title**: A concise summary of the issue (e.g., *"Cannot connect to 2nd Floor Office Wi-Fi"*).
   - **Category**: Select the appropriate category:
     - `Hardware`: Monitors, laptops, keyboards, printers, docking stations.
     - `Software`: Operating system errors, application crashes, licensing issues.
     - `Network`: Wi-Fi connectivity, VPN drops, DNS resolution errors.
     - `Security`: Phishing emails, suspicious account activity, malware warnings.
     - `Account`: Password resets, Active Directory access, permissions.
   - **Priority**: Select issue severity:
     - `Critical`: Total department stoppage or emergency patient/customer impact.
     - `High`: Significant impediment with no immediate workaround.
     - `Medium`: General issue impacting individual productivity.
     - `Low`: Minor cosmetic bug, feature request, or routine inquiry.
   - **Detailed Description**: Include step-by-step reproduction steps, error codes, and device names.
   - **Attachments**: Drag and drop error screenshots or diagnostic logs (PDF, PNG, JPG, TXT, max 10MB).
3. Click **Submit Ticket**. You will receive an immediate confirmation with your ticket number (e.g., `TD-1008`).

## 4. Tracking and Commenting on Tickets
1. Click **My Tickets** in the sidebar to view all incidents you have submitted.
2. Click any ticket number to open its **Ticket Detail View**:
   - **Status Badge**: Shows whether the ticket is `Open`, `Assigned`, `In Progress`, or `Resolved`.
   - **Assigned Technician**: Displays the name and avatar of the technician working on your request.
   - **SLA Countdown Timer**: Shows the target resolution deadline.
   - **Discussion Thread**: Post updates or reply to technician questions.
3. When the technician resolves your issue, you will receive an in-app notification. If you are satisfied with the resolution, you can click **Close Ticket**. If the issue persists, click **Reopen Ticket**.

---

# Part 2: Support Technician Guide

As a Support Technician, you are responsible for triaging incoming incidents, investigating technical root causes, executing repairs, and communicating resolutions.

## 1. The Technician Workspace
Upon login, the **Technician Dashboard** displays:
- **My Assigned Tickets**: Work queue assigned specifically to you.
- **Unassigned Queue**: Incidents awaiting assignment in your specialty area.
- **SLA Breach Warnings**: Tickets with deadlines approaching within 60 minutes highlighted in amber; breached tickets highlighted in red.
- **Performance Overview**: Your personal resolution count and SLA compliance rate for the current period.

## 2. Managing the Ticket Lifecycle

```
[Open] ──> [Assigned] ──> [In Progress] ──> [Pending User] ──> [Resolved] ──> [Closed]
```

### Accepting and Starting Work on a Ticket:
1. Open the incident from your queue.
2. In the top right action panel, change the status from `Assigned` to **`In Progress`**.
   - This records your start time and notifies the requester that work is underway.

### Requesting Information from Requester:
1. If you require additional information, change the status to **`Pending User`**.
2. Post a public comment explaining what information or test is required.
   - While in `Pending User`, SLA resolution timers can be paused according to your organization's policy.

### Resolving the Incident:
1. Once the problem is fixed, change the status to **`Resolved`**.
2. Enter mandatory **Resolution Notes** explaining the root cause and repair action (e.g., *"Replaced faulty RAM stick in slot 2. Ran memtest86 with 0 errors."*).
3. The requester receives a notification inviting them to confirm the fix.

## 3. Using Internal Notes (Technician-Only Discussion)
- When posting a comment, toggle the **Internal Note** checkbox.
- Internal notes appear with a distinct yellow/amber border.
- **Confidentiality Guarantee**: Internal notes are visible **only** to Technicians, Managers, and Admins. Standard Employees cannot view internal notes.

## 4. Reassigning or Escalating
If an incident requires assistance from another department:
1. Click the **Reassign** button in the ticket action panel.
2. Select an authorized colleague from the technician dropdown.
3. Enter an explanation for the handover.
4. The new technician will receive an immediate real-time assignment alert.
